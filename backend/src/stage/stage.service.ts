import { Injectable } from '@nestjs/common';
import { PgService } from '../db/pg.service';
import type { IStage } from './stage.model';

@Injectable()
export class StageService {
  constructor(private readonly pgService: PgService) {}

  async findByClassificationId(classification_id: number): Promise<{
    statusCode: number;
    message: string;
    data: { stages: IStage[] };
  }> {
    const stages = await this.pgService.query<IStage>(
      `
        SELECT
          id,
          name,
          classification_id
        FROM ref.stage
        WHERE classification_id = $1
        ORDER BY id ASC
      `,
      [classification_id],
    );

    return {
      statusCode: 200,
      message: 'Stages fetched successfully',
      data: {
        stages: stages.rows,
      },
    };
  }
}
