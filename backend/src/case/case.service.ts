import { Inject, Injectable } from '@nestjs/common';
import { PgService } from '../db/pg.service';
import type { ICase } from './case.model';
import type { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class CaseService {
  constructor(
    private readonly pgService: PgService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  async create(
    user_id: number,
    status: number,
  ): Promise<{
    data: { case: ICase };
  }> {
    const cases = await this.pgService.query<ICase>(
      `
        INSERT INTO app.case (user_id, status)
        VALUES ($1, $2)
        RETURNING *
      `,
      [user_id, status],
    );

    return {
      data: {
        case: cases.rows[0],
      },
    };
  }

  async getByUserId(user_id: number): Promise<{
    statusCode: number;
    message: string;
    data: { cases: ICase[] };
  }> {
    const cases = await this.pgService.query<ICase>(
      `
        SELECT
          id,
          user_id,
          status,
          created_at,
          updated_at
        FROM app.case
        WHERE user_id = $1
        ORDER BY id DESC
      `,
      [user_id],
    );

    return {
      statusCode: 200,
      message: 'Cases fetched successfully',
      data: {
        cases: cases.rows,
      },
    };
  }
}
