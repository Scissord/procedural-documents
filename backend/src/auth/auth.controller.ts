import {
  Body,
  Controller,
  Patch,
  Req,
  Ip,
  Post,
  Res,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { LogoutRequest } from './logout.middleware';
import type { AuthRequest } from './auth.middleware';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.registerTx(dto);
  }

  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.loginTx(dto, ip, userAgent, res);
  }

  @Post('logout')
  logout(@Req() req: LogoutRequest, @Res({ passthrough: true }) res: Response) {
    if (!req.auth) {
      throw new UnauthorizedException('Auth context is missing');
    }

    return this.authService.logoutTx(
      req.auth.user_id,
      req.auth.session_id,
      req.auth.refresh_token,
      res,
    );
  }

  @Patch('profile')
  profile(@Req() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    const auth = req.auth;
    if (!auth) {
      throw new UnauthorizedException('Auth context is missing');
    }

    return this.authService.updateProfileTx(auth.user_id, dto);
  }
}
