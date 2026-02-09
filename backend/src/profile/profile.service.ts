import { Injectable } from '@nestjs/common';
import { PgService } from '../db/pg.service';
import type { IProfile } from './profile.model';
import { profileQuery } from './profile.query';

const { SECRET_KEY } = process.env;

if (!SECRET_KEY) {
  throw new Error('SECRET_KEY is not set');
}

@Injectable()
export class ProfileService {
  constructor(private readonly pgService: PgService) {}

  async findByUserId(user_id: number) {
    const result = await this.pgService.query<IProfile>(
      profileQuery.findByUserId,
      [SECRET_KEY, user_id],
    );

    return result.rows[0] ?? null;
  }
}
