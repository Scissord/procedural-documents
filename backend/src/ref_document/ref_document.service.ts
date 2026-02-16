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
          role_id,
          stage_id,
          classification_id,
          placeholders,
          sections,
          rules
        FROM ref.document
        WHERE
          classification_id = $1
          AND stage_id = $2
          AND role_id = $3
        ORDER BY id ASC
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

  async getById(id: number): Promise<{
    statusCode: number;
    message: string;
    data: { document: IRefDocument | null };
  }> {
    const document = await this.pgService.query<IRefDocument>(
      `
        SELECT
          id,
          name_ru,
          role_id,
          stage_id,
          classification_id,
          placeholders,
          sections,
          rules
        FROM ref.document
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    return {
      statusCode: 200,
      message: 'Document fetched successfully',
      data: {
        document: document.rows[0] ?? null,
      },
    };
  }
}
