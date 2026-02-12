import {
  Body,
  Controller,
  Get,
  Req,
  Ip,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
  Headers,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentAccessToken, CurrentUser } from './current-user.decorator';
import { JwtTokenGuard } from './jwt-token.guard';
import type { LogoutRequest } from './logout.middleware';

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, JwtTokenGuard)
  @Get('profile')
  profile(
    @CurrentUser() user: { id: string },
    @CurrentAccessToken() access_token: string,
  ) {
    return this.authService.profile(user.id, access_token);
  }
}
