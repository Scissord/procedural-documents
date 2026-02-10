import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgPoolClient, PgService } from '../db/pg.service';
import type { ISession } from './session.model';
import { sessionQuery } from './session.query';

@Injectable()
export class SessionService {
  constructor(
    private readonly pgService: PgService,
    private readonly configService: ConfigService,
  ) {}

  async create(client: PgPoolClient, email: string, password_hash: string) {
    const result = await client.query<ISession>(sessionQuery.create, [
      this.configService.getOrThrow<string>('SECRET_KEY'),
      email,
      password_hash,
    ]);

    return result.rows[0] ?? null;
  }
}
