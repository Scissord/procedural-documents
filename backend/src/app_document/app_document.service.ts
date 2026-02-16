import { Inject, Injectable } from '@nestjs/common';
import { PgService } from '../db/pg.service';
import type { IAppDocument } from './app_document.model';
import type { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { IFields } from './dto/create-document.dto';
import { PromptTemplateService } from 'src/ai/prompt-template.service';
import { LegalAgentService } from 'src/ai/legal-agent.service';

@Injectable()
export class AppDocumentService {
  constructor(
    private readonly pgService: PgService,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly legalAgentService: LegalAgentService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  async create(
    user_id: number,
    data: { fields: IFields },
  ): Promise<{
    statusCode: number;
    message: string;
    data: { document: IAppDocument };
  }> {
    this.logger.info('Create legal document started', {
      user_id,
      document_id: data.fields.document_id,
    });

    const template = this.promptTemplateService.buildTemplate(data.fields);
    const prompt = this.promptTemplateService.buildPrompt(template);

    // this gonna be saved in base -> we don't need to save in minio
    const generatedText = await this.legalAgentService.generateDocument(prompt);
    const documents: { title: string; text: string }[] = [];
    const splitRegex = /(ИСКОВОЕ ЗАЯВЛЕНИЕ|ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕ СУДА)/g;
    const matches = [...generatedText.matchAll(splitRegex)];

    for (let i = 0; i < matches.length; i++) {
      const title = matches[i][0];
      const startIndex = matches[i].index ?? 0; // если undefined, считаем с 0
      const endIndex = matches[i + 1]?.index ?? generatedText.length;

      const text = generatedText
        .slice(startIndex + title.length, endIndex)
        .trim();
      documents.push({ title, text });
    }

    const created = await this.pgService.query<IAppDocument>(
      `
        INSERT INTO app.document (
          user_id,
          docs
        )
        VALUES ($1, $2)
        RETURNING
          id
      `,
      [user_id, JSON.stringify(documents)],
    );

    const document = created.rows[0];

    return {
      statusCode: 200,
      message: 'Document created successfully',
      data: {
        document,
      },
    };
  }

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

  async getById(
    user_id: number,
    id: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { document: IAppDocument | null };
  }> {
    const document = await this.pgService.query<IAppDocument>(
      `
        SELECT
          id,
          user_id,
          docs,
          created_at,
          updated_at
        FROM app.document
        WHERE id = $1 AND user_id = $2
        LIMIT 1
      `,
      [id, user_id],
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
