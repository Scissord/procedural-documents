import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgPoolClient, PgService } from '../db/pg.service';
import type { IProfile } from './profile.model';
import { profileQuery } from './profile.query';

@Injectable()
export class ProfileService {
  constructor(
    private readonly pgService: PgService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    client: PgPoolClient,
    user_id: number,
    data: Record<string, any>,
  ) {
    const result = await client.query<IProfile>(profileQuery.create, [
      user_id,
      data.first_name,
      this.configService.getOrThrow<string>('SECRET_KEY'),
      data.last_name ?? null,
      data.middle_name ?? null,
      data.phone ?? null,
      data.birthday ?? null,
      data.gender ?? 'O', // M, F, O
      data.locale,
      data.timezone,
    ]);

    return result.rows[0] ?? null;
  }

  async findByUserId(user_id: number) {
    const result = await this.pgService.query<IProfile>(
      profileQuery.findByUserId,
      [this.configService.getOrThrow<string>('SECRET_KEY'), user_id],
    );

    return result.rows[0] ?? null;
  }
}
