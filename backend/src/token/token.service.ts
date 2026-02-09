import { Injectable } from '@nestjs/common';
import { PgPoolClient, PgService } from '../db/pg.service';
import type { IToken } from './token.model';
import { tokenQuery } from './token.query';

const { SECRET_KEY } = process.env;

if (!SECRET_KEY) {
  throw new Error('SECRET_KEY is not set');
}

@Injectable()
export class TokenService {
  constructor(private readonly pgService: PgService) {}

  async create(client: PgPoolClient, email: string, password_hash: string) {
    const result = await client.query<IToken>(tokenQuery.create, [
      SECRET_KEY,
      email,
      password_hash,
    ]);

    return result.rows[0] ?? null;
  }
}
