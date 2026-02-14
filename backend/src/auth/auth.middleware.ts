import {
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { NextFunction, Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TokenService } from 'src/token/token.service';
import type { Logger as WinstonLogger } from 'winston';

interface JwtTokenPayload {
  id: number | string;
  session_id: number | string;
  exp?: number;
}

export interface AuthRequest extends Request {
  auth?: {
    user_id: number;
    session_id: number;
    access_token: string;
    refresh_token: string;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  async use(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const accessTokenFromCookie = this.extractCookie(req, 'access_token');
      const refresh_token = this.extractCookie(req, 'refresh_token');

      // this.logger.info('Auth middleware: cookies received', {
      //   access_token: accessTokenFromCookie,
      //   refresh_token,
      // });

      if (!accessTokenFromCookie || !refresh_token) {
        throw new UnauthorizedException(
          'Access token and refresh token are required',
        );
      }

      const accessTokenState = await this.verifyAccessToken(
        accessTokenFromCookie,
      );
      const accessPayload = accessTokenState.payload;
      const refreshPayload = await this.verifyRefreshToken(refresh_token);

      const access_user_id = Number(accessPayload.id);
      const access_session_id = Number(accessPayload.session_id);
      const refresh_user_id = Number(refreshPayload.id);
      const refresh_session_id = Number(refreshPayload.session_id);

      if (
        !Number.isFinite(access_user_id) ||
        !Number.isFinite(access_session_id) ||
        !Number.isFinite(refresh_user_id) ||
        !Number.isFinite(refresh_session_id)
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }

      if (
        access_user_id !== refresh_user_id ||
        access_session_id !== refresh_session_id
      ) {
        throw new UnauthorizedException('Token pair mismatch');
      }

      const user_id = refresh_user_id;
      const session_id = refresh_session_id;

      const tokenExists = await this.tokenService.isRefreshTokenValid(
        user_id,
        session_id,
        refresh_token,
      );

      if (!tokenExists) {
        const diagnostics = await this.tokenService.getRefreshTokenDiagnostics(
          user_id,
          session_id,
          refresh_token,
        );

        if (diagnostics.reason === 'mismatch') {
          throw new UnauthorizedException('Refresh token mismatch with DB');
        }
        if (diagnostics.reason === 'revoked') {
          throw new UnauthorizedException('Refresh token was revoked');
        }
        if (diagnostics.reason === 'expired_in_db') {
          throw new UnauthorizedException('Refresh token expired in DB');
        }

        throw new UnauthorizedException('Refresh token is not active');
      }

      let access_token = accessTokenFromCookie;
      if (accessTokenState.expired) {
        access_token = await this.tokenService.createAccessToken(
          user_id,
          session_id,
        );

        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('access_token', access_token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        });
      }

      req.auth = {
        user_id,
        session_id,
        access_token,
        refresh_token,
      };

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.clearAuthCookies(res);
      }
      throw error;
    }
  }

  private clearAuthCookies(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
    };
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
  }

  private extractCookie(req: Request, cookieName: string): string | undefined {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return undefined;
    }

    const cookies = cookieHeader.split(';');
    for (const entry of cookies) {
      const [name, ...value] = entry.trim().split('=');
      if (name === cookieName) {
        return decodeURIComponent(value.join('='));
      }
    }

    return undefined;
  }

  private async verifyAccessToken(
    access_token: string,
  ): Promise<{ payload: JwtTokenPayload; expired: boolean }> {
    try {
      const payload =
        await this.jwtService.verifyAsync<JwtTokenPayload>(access_token);
      return { payload, expired: false };
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'TokenExpiredError') {
        throw new UnauthorizedException('Invalid access token');
      }

      try {
        const payload = await this.jwtService.verifyAsync<JwtTokenPayload>(
          access_token,
          {
            ignoreExpiration: true,
          },
        );
        return { payload, expired: true };
      } catch {
        throw new UnauthorizedException('Invalid access token');
      }
    }
  }

  private async verifyRefreshToken(
    refresh_token: string,
  ): Promise<JwtTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtTokenPayload>(refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
