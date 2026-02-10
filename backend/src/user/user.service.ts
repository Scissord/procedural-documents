import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgPoolClient, PgService } from '../db/pg.service';
import type { IUser } from './user.model';
import { userQuery } from './user.query';

@Injectable()
export class UserService {
  private readonly secretKey: string;

  constructor(
    private readonly pgService: PgService,
    private readonly configService: ConfigService,
  ) {
    this.secretKey = this.configService.getOrThrow<string>('SECRET_KEY');
  }

  async create(
    client: PgPoolClient,
    email: string,
    password_hash: string,
  ): Promise<IUser> {
    const result = await client.query<IUser>(userQuery.create, [
      this.secretKey,
      email,
      password_hash,
    ]);

    return result.rows[0] ?? null;
  }

  async findByEmail(email: string) {
    const result = await this.pgService.query<IUser>(userQuery.findByEmail, [
      this.secretKey,
      email,
    ]);

    return result.rows[0] ?? null;
  }

  async findById(id: string) {
    const result = await this.pgService.query<IUser>(userQuery.findById, [
      this.secretKey,
      id,
    ]);

    return result.rows[0] ?? null;
  }
}
