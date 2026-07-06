import * as common from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  UpdateProfileDto,
} from './dto';

@common.Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @common.Post('signup')
  async signUp(@common.Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @common.Post('signin')
  async signin(@common.Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @common.Post('signout')
  @common.UseGuards(JwtAuthGuard)
  async signout(@CurrentUser('id') userId: string) {
    return this.authService.signOut(userId);
  }

  @common.Post('forgot-password')
  @common.HttpCode(common.HttpStatus.OK)
  async forgotPassword(@common.Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @common.Post('reset-password')
  @common.HttpCode(common.HttpStatus.OK)
  async resetPassword(@common.Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @common.Get('profile')
  @common.UseGuards(JwtAuthGuard)
  async profile(@CurrentUser('id') userId: string) {
    return this.authService.getUserProfile(userId);
  }

  @common.Put('profile')
  @common.UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @common.Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateUserProfile(userId, dto);
  }
}
