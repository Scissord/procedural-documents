import { Injectable } from '@nestjs/common';
import { PgPoolClient, PgService } from '../db/pg.service';
import type { IUser } from './user.model';
import { userQuery } from './user.query';

const { SECRET_KEY } = process.env;

if (!SECRET_KEY) {
  throw new Error('SECRET_KEY is not set');
}

@Injectable()
export class UserService {
  constructor(private readonly pgService: PgService) {}

  async create(client: PgPoolClient, email: string, password_hash: string) {
    const result = await client.query<IUser>(userQuery.create, [
      SECRET_KEY,
      email,
      password_hash,
    ]);

    return result.rows[0] ?? null;
  }

  async findByEmail(email: string) {
    const result = await this.pgService.query<IUser>(userQuery.findByEmail, [
      SECRET_KEY,
      email,
    ]);

    return result.rows[0] ?? null;
  }

  async findById(id: string) {
    const result = await this.pgService.query<IUser>(userQuery.findById, [
      SECRET_KEY,
      id,
    ]);

    return result.rows[0] ?? null;
  }
}
