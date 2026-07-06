import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { EmailService } from '../../common/email/email.service';
import { DatabaseService } from '../../database/database.service';
import { AppRole } from '../../entities/user-role.entity';
import {
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  UpdateProfileDto,
} from './dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureDefaultAdmin();
    } catch (error) {
      this.logger.error(
        'Failed to prepare the default admin account',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private isEnabled(value: string | undefined, fallback: boolean) {
    if (!value?.trim()) {
      return fallback;
    }

    return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
  }

  private async persistAdminRole(userId: string) {
    if (typeof this.databaseService.setUserRole === 'function') {
      await this.databaseService.setUserRole(userId, AppRole.ADMIN);
      return;
    }

    if (typeof this.databaseService.createUserRole === 'function') {
      await this.databaseService.createUserRole({
        userId,
        role: AppRole.ADMIN,
      });
    }
  }

  private async ensureDefaultAdmin() {
    const isProduction = process.env.NODE_ENV === 'production';
    const enableDefaultAdmin = this.isEnabled(
      process.env.ENABLE_DEFAULT_ADMIN,
      !isProduction,
    );

    if (!enableDefaultAdmin) {
      return;
    }

    const email =
      process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase() ||
      (isProduction ? '' : 'admin@eshop.local');
    const password =
      process.env.DEFAULT_ADMIN_PASSWORD?.trim() ||
      (isProduction ? '' : 'admin123');
    const fullName =
      process.env.DEFAULT_ADMIN_FULL_NAME?.trim() || 'Administrateur';

    if (!email || !password) {
      this.logger.warn(
        'Default admin is enabled but credentials are incomplete. Skipping bootstrap.',
      );
      return;
    }

    const existingUser = await this.databaseService.findUserByEmail(email);

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.databaseService.createUser({
        email,
        encrypted_password: hashedPassword,
      });

      await this.databaseService.createProfile({
        userId: user.id,
        fullName,
        email,
      });
      await this.persistAdminRole(user.id);

      this.logger.log(`Default admin account ready: ${email}`);
      return;
    }

    if (!existingUser.encrypted_password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.databaseService.updateUser(existingUser.id, {
        encrypted_password: hashedPassword,
      });
    }

    const existingProfile = await this.databaseService.findProfileByUserId(
      existingUser.id,
    );
    if (!existingProfile) {
      await this.databaseService.createProfile({
        userId: existingUser.id,
        fullName,
        email,
      });
    }

    await this.persistAdminRole(existingUser.id);
    this.logger.log(`Default admin account ready: ${email}`);
  }

  private buildAuthPayload(userId: string, email: string) {
    return { sub: userId, email };
  }

  private async buildAuthResponse(
    userId: string,
    email: string,
    message: string,
  ) {
    const profile = await this.databaseService.findProfileByUserId(userId);
    const role = await this.databaseService.getUserRole(userId);
    const accessToken = this.jwtService.sign(
      this.buildAuthPayload(userId, email),
    );

    return {
      message,
      access_token: accessToken,
      user: {
        id: userId,
        email,
        profile,
        role,
      },
    };
  }

  async signUp(signUpDto: SignUpDto) {
    const { email, password, fullName, phone } = signUpDto;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser =
      await this.databaseService.findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.databaseService.createUser({
      email: normalizedEmail,
      encrypted_password: hashedPassword,
    });

    await this.databaseService.createProfile({
      userId: user.id,
      fullName,
      email: normalizedEmail,
      phone,
    });

    await this.databaseService.createUserRole({
      userId: user.id,
      role: AppRole.CLIENT,
    });

    await this.emailService.sendWelcomeEmail(normalizedEmail, fullName);

    return this.buildAuthResponse(
      user.id,
      user.email,
      'Account created successfully',
    );
  }

  async signin(dto: SignInDto) {
    return this.signIn(dto);
  }

  async signIn(signInDto: SignInDto) {
    const normalizedEmail = signInDto.email.trim().toLowerCase();
    const user = await this.databaseService.findUserByEmail(normalizedEmail);

    if (!user || !user.encrypted_password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      user.encrypted_password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(
      user.id,
      user.email,
      'Authenticated successfully',
    );
  }

  async signOut(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return { message: 'Sign out successful' };
  }

  async forgotPassword(email: string) {
    if (!email?.trim()) {
      throw new BadRequestException('Email is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.databaseService.findUserByEmail(normalizedEmail);

    if (!user) {
      return {
        message:
          'If this email exists in our system, a password reset message has been sent.',
      };
    }

    await this.databaseService.invalidatePasswordResetTokens(user.id);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await this.databaseService.createPasswordResetToken({
      userId: user.id,
      token,
      expiresAt,
      usedAt: null,
    });

    const profile = await this.databaseService.findProfileByUserId(user.id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.emailService.sendPasswordResetEmail(
      normalizedEmail,
      resetLink,
      profile?.fullName,
    );

    return {
      message:
        'If this email exists in our system, a password reset message has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const resetToken = await this.databaseService.findValidPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);
    await this.databaseService.updateUser(resetToken.userId, {
      encrypted_password: hashedPassword,
    });
    await this.databaseService.markPasswordResetTokenUsed(resetToken.id);

    return { message: 'Password updated successfully' };
  }

  async getUserProfile(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.databaseService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.databaseService.findProfileByUserId(userId);
    const role = await this.databaseService.getUserRole(userId);

    return {
      id: user.id,
      email: user.email,
      profile,
      role,
    };
  }

  async updateUserProfile(
    userId: string,
    updateData: UpdateProfileDto & { fullName?: string; avatarUrl?: string },
  ) {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const existingUser = await this.databaseService.findUserById(userId);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const profilePayload = {
      fullName: updateData.full_name ?? updateData.fullName,
      phone: updateData.phone,
      avatarUrl: updateData.avatar_url ?? updateData.avatarUrl,
    };

    const sanitizedPayload = Object.fromEntries(
      Object.entries(profilePayload).filter(([, value]) => value !== undefined),
    );

    const profile = await this.databaseService.updateProfile(
      userId,
      sanitizedPayload,
    );
    const role = await this.databaseService.getUserRole(userId);

    return {
      id: existingUser.id,
      email: existingUser.email,
      profile,
      role,
      message: 'Profile updated successfully',
    };
  }

  async validateUser() {
    return null;
  }
}
