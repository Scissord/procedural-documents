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

  // check if session exists
  // if exists, update
  // if not, create
  async check(
    client: PgPoolClient,
    user_id: number,
    ip: string,
    user_agent: string,
  ) {
    const exists = await client.query<ISession>(sessionQuery.check, [
      user_id,
      ip,
      user_agent,
    ]);

    let session: ISession | null = null;

    if (exists.rows.length > 0) {
      await client.query<ISession>(sessionQuery.update, [exists.rows[0].id]);
      session = { id: exists.rows[0].id } as ISession;
    } else {
      const result = await client.query<ISession>(sessionQuery.create, [
        user_id,
        ip,
        user_agent,
      ]);
      session = result.rows[0] ?? null;
    }

    return session || null;
  }

  async deactivate(
    client: PgPoolClient,
    user_id: number,
    session_id: number,
  ): Promise<boolean> {
    const result = await client.query<{ id: number }>(sessionQuery.deactivate, [
      session_id,
      user_id,
    ]);

    return result.rows.length > 0;
  }
}
