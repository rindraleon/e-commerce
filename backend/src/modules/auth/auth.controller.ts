import * as common from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto, UpdateProfileDto } from './dto';
import { DatabaseService } from '../../services/database.service';

@common.Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly databaseService: DatabaseService,
  ) {}

  @common.Post('signup')
  async signUp(@common.Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @common.Post('signin')
  async signin(@common.Body() dto: any) {
    return this.authService.signIn(dto);
  }

  @common.Post('signout')
  @common.UseGuards(AuthGuard('jwt'))
  async signout(@common.Req() req) {
    const userId = req.user?.id;
    return this.authService.signOut(userId);
  }

  @common.Post('forgot-password')
  @common.HttpCode(common.HttpStatus.OK)
  async forgotPassword(@common.Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @common.Get('profile')
  @common.UseGuards(AuthGuard('jwt'))
  async profile(@common.Req() req) {
    return this.authService.getUserProfile(req.user?.id);
  }

  @common.Put('profile')
  @common.UseGuards(AuthGuard('jwt'))
  async updateProfile(@common.Req() req, @common.Body() dto: any) {
    return this.authService.updateUserProfile(req.user?.id, dto);
  }
}