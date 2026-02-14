import { Injectable } from '@nestjs/common';
import { PgService } from '../db/pg.service';
import type { IAppDocument } from './app_document.model';

@Injectable()
export class AppDocumentService {
  constructor(private readonly pgService: PgService) {}

  async getByUserId(user_id: number): Promise<{
    statusCode: number;
    message: string;
    data: { documents: IAppDocument[] };
  }> {
    const documents = await this.pgService.query<IAppDocument>(
      `
        SELECT
          id,
          situation,
          created_at,
          updated_at
        FROM app.document
        WHERE user_id = $1
        ORDER BY id DESC
      `,
      [user_id],
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
