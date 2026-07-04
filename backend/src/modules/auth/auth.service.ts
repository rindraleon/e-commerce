import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../../services/database.service';
import { SignUpDto, SignInDto } from './dto';
import { AppRole } from '../../entities/user-role.entity';
import * as bcrypt from 'bcrypt';
import * as common from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) { }

  async signUp(signUpDto: SignUpDto) {
    const { email, password, fullName } = signUpDto;

    // Check if user already exists
    const existingUser = await this.databaseService.findUserByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await this.databaseService.createUser({
      email,
      encrypted_password: hashedPassword,
    });

    // Create the profile
    await this.databaseService.createProfile({
      userId: user.id,
      fullName,
      email,
    });

    // Set default role as client
    await this.databaseService.createUserRole({
      userId: user.id,
      role: 'client' as AppRole
    });

    // Generate JWT access token for the new user
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Fetch created profile & role to include in response
    const profile = await this.databaseService.findProfileByUserId(user.id);
    const role = await this.databaseService.getUserRole(user.id);

    return {
      message: 'Account created successfully',
      access_token,
      user: {
        id: user.id,
        email: user.email,
        profile,
        role
      }
    };
  }

  // alias compatible pour éviter les erreurs de casse/typo
  async signin(dto: any) {
    return this.signIn(dto as any);
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const user = await this.databaseService.findUserByEmail(email);
    if (!user) {
      throw new common.UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password);
    if (!isPasswordValid) {
      throw new common.UnauthorizedException('Invalid credentials');
    }

    // Get user profile and role
    const profile = await this.databaseService.findProfileByUserId(user.id);
    const role = await this.databaseService.getUserRole(user.id);

    // Generate JWT token
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Return a consistent response shape
    return {
      success: true,
      message: 'Authenticated',
      access_token,
      user: {
        id: user.id,
        email: user.email,
        profile,
        role,
      },
    };
  }

  async signOut(userId: string) {
    // In a real implementation, you might invalidate tokens here
    return { message: 'Sign out successful' };
  }

  async forgotPassword(email: string) {
    // In a real implementation, you would send a reset email
    return { message: 'Password reset email sent' };
  }

  async getUserProfile(userId: string) {
    if (!userId) {
      throw new common.UnauthorizedException('User id required');
    }

    // Best-effort: fetch user, profile and role and return a consistent object
    const user = await this.databaseService.findUserById?.(userId);
    if (!user) {
      throw new common.NotFoundException('User not found');
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

  async updateUserProfile(userId: string, updateData: any) {
    if (!userId) throw new common.UnauthorizedException('User id required');
    // delegate to database service and return updated profile
    await this.databaseService.updateProfile?.(userId, updateData);
    const profile = await this.databaseService.findProfileByUserId(userId);
    return { id: userId, profile };
  }

  async validateUser() {
    return null;
  }
}