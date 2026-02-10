import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgPoolClient, PgService } from '../db/pg.service';
import { JwtService } from '@nestjs/jwt';
import type { IToken } from './token.model';
import { tokenQuery } from './token.query';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly pgService: PgService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    client: PgPoolClient,
    user_id: number,
    session_id: number,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    const access_token = await this.jwtService.signAsync({
      id: user_id,
      session_id,
    });
    const refresh_token = await this.jwtService.signAsync({
      id: user_id,
      session_id,
    });

    const exists = await client.query<IToken>(tokenQuery.check, [
      user_id,
      session_id,
    ]);

    if (exists.rows.length > 0) {
      await client.query<IToken>(tokenQuery.update, [
        exists.rows[0].id,
        refresh_token,
        expiresAt,
      ]);
    } else {
      await client.query<IToken>(tokenQuery.create, [
        user_id,
        session_id,
        refresh_token,
        expiresAt,
      ]);
    }

    return { access_token, refresh_token };
  }
}
