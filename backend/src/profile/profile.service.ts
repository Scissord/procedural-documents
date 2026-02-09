import { Injectable } from '@nestjs/common';
import { PgPoolClient, PgService } from '../db/pg.service';
import type { IProfile } from './profile.model';
import { profileQuery } from './profile.query';

const { SECRET_KEY } = process.env;

if (!SECRET_KEY) {
  throw new Error('SECRET_KEY is not set');
}

@Injectable()
export class ProfileService {
  constructor(private readonly pgService: PgService) {}

  async create(
    client: PgPoolClient,
    user_id: number,
    data: Record<string, any>,
  ) {
    const result = await client.query<IProfile>(profileQuery.create, [
      user_id,
      data.first_name,
      SECRET_KEY,
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
      [SECRET_KEY, user_id],
    );

    return result.rows[0] ?? null;
  }
}
