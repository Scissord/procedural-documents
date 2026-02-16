import { Injectable } from '@nestjs/common';
import { PgService } from '../db/pg.service';
import type { IRole } from './role.model';

@Injectable()
export class RoleService {
  constructor(private readonly pgService: PgService) {}

  async get(): Promise<{
    statusCode: number;
    message: string;
    data: { roles: IRole[] };
  }> {
    const roles = await this.pgService.query<IRole>(
      `
        SELECT
          id,
          name_ru,
          code
        FROM ref.role
        ORDER BY id ASC
      `,
    );

    return {
      statusCode: 200,
      message: 'Roles fetched successfully',
      data: {
        roles: roles.rows,
      },
    };
  }
}
