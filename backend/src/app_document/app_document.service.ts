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

    const generatedText = await this.legalAgentService.generateDocument(prompt);

    const documents: { title: string; text: string }[] = [];
    const sectionRegex = /===DOC_START:([^=]+)===([\s\S]*?)===DOC_END===/g;

    const matches = [...(generatedText ?? '').matchAll(sectionRegex)];

    this.logger.info('Section matches', {
      count: matches.length,
      titles: matches.map((m) => (m[1] ?? '').trim()),
    });

    if (matches.length > 0) {
      for (const m of matches) {
        const rawTitle = (m[1] ?? '').trim();
        const text = (m[2] ?? '').trim();

        // Нормализуем заголовки (на случай лишних пробелов/регистра)
        const upper = rawTitle.toUpperCase();
        let normalizedTitle: string;

        if (upper.includes('ИСКОВОЕ') && upper.includes('ЗАЯВЛЕНИЕ')) {
          normalizedTitle = 'ИСКОВОЕ ЗАЯВЛЕНИЕ';
        } else if (
          upper.includes('ПРЕДВАРИТЕЛЬНОЕ') &&
          upper.includes('РЕШЕНИЕ') &&
          upper.includes('СУДА')
        ) {
          normalizedTitle = 'ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕ СУДА';
        } else {
          // если прилетит неожиданный title — сохраним как есть, но лучше логировать
          normalizedTitle = rawTitle;
          this.logger.warn('Unknown section title received', { rawTitle });
        }

        if (text) {
          documents.push({ title: normalizedTitle, text });
        }
      }
    }

    // Fallback: если модель не соблюла формат — не теряем документ
    if (documents.length === 0) {
      documents.push({
        title: 'ИСКОВОЕ ЗАЯВЛЕНИЕ',
        text: (generatedText ?? '').trim(),
      });
    }

    // (Опционально) можно гарантировать порядок блоков A -> B
    documents.sort((a, b) => {
      const rank = (t: string) =>
        t === 'ИСКОВОЕ ЗАЯВЛЕНИЕ'
          ? 0
          : t === 'ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕ СУДА'
            ? 1
            : 2;
      return rank(a.title) - rank(b.title);
    });

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
          docs,
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
