import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PgService } from '../db/pg.service';
import type { IAppDocument } from './app_document.model';
import type { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { IFields } from './dto/create-document.dto';
import { PromptTemplateService } from 'src/ai/prompt-template.service';
import { LegalAgentService } from 'src/ai/legal-agent.service';
import { CaseService } from 'src/case/case.service';

interface UploadedFilePayload {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const MAX_APPEAL_TEXT_CHARS = 12000;

@Injectable()
export class AppDocumentService {
  constructor(
    private readonly pgService: PgService,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly legalAgentService: LegalAgentService,
    private readonly caseService: CaseService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  private sanitizeForJsonText(input: string): string {
    let sanitized = '';
    for (const char of input) {
      const code = char.charCodeAt(0);
      const isAllowedControl = code === 9 || code === 10 || code === 13;
      const isPrintable = code >= 32 && code !== 127;

      if (isAllowedControl || isPrintable) {
        sanitized += char;
      } else {
        sanitized += ' ';
      }
    }

    return sanitized.trim();
  }

  private buildAppealAnalysisPrompt(documentText: string): string {
    return `
Ты — практикующий юрист по гражданскому процессу Республики Казахстан.

Задача:
Проанализируй возражение/апелляционный документ и покажи, почему позиция уязвима.
НЕ генерируй новый процессуальный документ. Нужен только аналитический вывод.

Критические правила:
1) Используй только нормы и фрагменты из предоставленного RAG-контекста.
2) Если правовое основание не найдено, укажи: <<НУЖНО УТОЧНИТЬ: правовое основание>>.
3) Не выдумывай статьи и судебную практику.
4) Оцени:
   - процессуальные нарушения (сроки, подсудность, структура, допустимость требований),
   - материально-правовые уязвимости,
   - логические противоречия и недоказанность,
   - риск-формулировки, которые могут быть отвергнуты судом.

Формат ответа (строго):
1. Краткая суть позиции оппонента (3-5 предложений)
2. Топ-7 уязвимостей (нумерованный список, у каждой: суть + риск + ссылка на норму из контекста)
3. Что именно оспаривать в суде (нумерованный список)
4. Какие доказательства запросить/представить для опровержения (нумерованный список)
5. Итоговая оценка силы возражения: НИЗКАЯ / СРЕДНЯЯ / ВЫСОКАЯ + 1 абзац обоснования

Текст возражения/апелляции для анализа:
${documentText}
    `.trim();
  }

  async create(
    user_id: number,
    data: { fields: IFields },
  ): Promise<{
    statusCode: number;
    message: string;
    data: { document: IAppDocument };
  }> {
    const result = await this.caseService.create(user_id, 0);
    if (!result.data.case) {
      throw new NotFoundException('Case not found');
    }

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
        case_id,
        docs,
        stage
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        case_id,
        stage
    `,
      [user_id, result.data.case.id, JSON.stringify(documents), 0],
    );

    const document = created.rows[0];

    return Promise.resolve({
      statusCode: 200,
      message: 'Document created successfully',
      data: {
        document,
      },
    });
  }

  async createAppeal(
    user_id: number,
    case_id: string,
    file: UploadedFilePayload,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { document: IAppDocument };
  }> {
    if (!file) {
      throw new BadRequestException('Appeal file is required');
    }
    if (!case_id) {
      throw new BadRequestException('case_id is required');
    }

    const rawText = Buffer.from(file.buffer).toString('utf-8');
    const normalizedText = this.sanitizeForJsonText(rawText);
    if (!normalizedText) {
      throw new BadRequestException('Uploaded file is empty');
    }
    const truncatedText = normalizedText.slice(0, MAX_APPEAL_TEXT_CHARS);

    const caseResult = await this.pgService.query<{ id: string }>(
      `
        SELECT id
        FROM app.case
        WHERE id = $1 AND user_id = $2
        LIMIT 1
      `,
      [case_id, user_id],
    );

    if (caseResult.rows.length === 0) {
      throw new NotFoundException('Case not found');
    }

    const filePreview = truncatedText.slice(0, 500);
    this.logger.info('Appeal file received', {
      case_id,
      user_id,
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      originalTextLength: normalizedText.length,
      usedTextLength: truncatedText.length,
      preview: filePreview,
    });

    const prompt = this.buildAppealAnalysisPrompt(truncatedText);
    const ragQuery = truncatedText.slice(0, 2000);
    const llmAnalysisRaw =
      await this.legalAgentService.generateDocumentWithRagQuery(
        prompt,
        ragQuery,
      );
    const llmAnalysis = this.sanitizeForJsonText(llmAnalysisRaw ?? '');

    const docs = [
      {
        title: 'АНАЛИЗ УЯЗВИМОСТЕЙ',
        text: (llmAnalysis ?? '').trim(),
      },
    ];

    const created = await this.pgService.query<IAppDocument>(
      `
      INSERT INTO app.document (
        user_id,
        case_id,
        docs,
        stage
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        case_id,
        stage
    `,
      [user_id, case_id, JSON.stringify(docs), 1],
    );

    const document = created.rows[0];

    return {
      statusCode: 200,
      message: 'Appeal analyzed successfully',
      data: {
        document,
      },
    };
  }

  async getChronology(
    user_id: number,
    case_id: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { documents: IAppDocument[] };
  }> {
    const documents = await this.pgService.query<IAppDocument>(
      `
        SELECT
          id,
          case_id,
          docs,
          stage,
          created_at
        FROM app.document
        WHERE user_id = $1
        AND case_id = $2
        ORDER BY created_at ASC
      `,
      [user_id, case_id],
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
