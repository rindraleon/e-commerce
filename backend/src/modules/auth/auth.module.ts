import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module';

const jwtSecret = process.env.JWT_SECRET || 'change_this_secret';
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set — using fallback (insecure). Set JWT_SECRET in backend/.env for dev/prod.');
}

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '4h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule, AuthService],
})
export class AuthModule { }