import { Injectable } from '@nestjs/common';
import { PgService } from '../db/pg.service';
import type { IClassification } from './classification.model';

@Injectable()
export class ClassificationService {
  constructor(private readonly pgService: PgService) {}

  async getAll(): Promise<{
    statusCode: number;
    message: string;
    data: { classifications: IClassification[] };
  }> {
    const classifications = await this.pgService.query<IClassification>(
      'SELECT id, name, code FROM ref.classification ORDER BY id ASC',
    );

    return {
      statusCode: 200,
      message: 'Classifications fetched successfully',
      data: {
        classifications: classifications.rows,
      },
    };
  }
}
