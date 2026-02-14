import { Injectable } from '@nestjs/common';
import { PgService } from '../db/pg.service';
import type { IRefDocument } from './ref_document.model';

@Injectable()
export class RefDocumentService {
  constructor(private readonly pgService: PgService) {}

  async get(
    classification_id: number,
    stage_id: number,
    role_id: number,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { documents: IRefDocument[] };
  }> {
    const documents = await this.pgService.query<IRefDocument>(
      `
        SELECT
          id,
          name_ru,
          code
        FROM ref.document
        WHERE user_id = $1
        ORDER BY id DESC
      `,
      [classification_id, stage_id, role_id],
    );

    return {
      statusCode: 200,
      message: 'Documents fetched successfully',
      data: {
        documents: documents.rows,
      },
    };
  }
}
