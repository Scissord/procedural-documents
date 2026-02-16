import { Injectable } from '@nestjs/common';
import { LlmService } from 'src/llm/llm.service';
import { QdrantService } from 'src/qdrant/qdrant.service';

@Injectable()
export class LegalAgentService {
  constructor(
    private readonly llmService: LlmService,
    private readonly qdrantService: QdrantService,
  ) {}

  // Type guard: проверяет, что value — объект с title:string
  private isTitleObject(value: unknown): value is { title: string } {
    if (typeof value !== 'object' || value === null) return false;

    const obj = value as Record<string, unknown>; // безопасно
    return typeof obj.title === 'string';
  }

  // Универсальная функция безопасного преобразования в строку
  private toSafeString(value: unknown, fallback = ''): string {
    if (value == null) return fallback; // null или undefined
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean')
      return String(value);

    if (this.isTitleObject(value)) {
      return value.title;
    }

    try {
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
    } catch {
      // циклический объект
    }

    return fallback;
  }

  private async buildRagContext(prompt: string): Promise<string> {
    const collections = ['kz_gk', 'kz_gpk', 'kz_civil_practice'] as const;
    const parts: string[] = [];

    for (const collection of collections) {
      const hits = await this.qdrantService.searchWithMetadata(
        prompt,
        5,
        collection,
      );
      if (!hits.length) continue;

      const block = hits
        .map((hit, idx) => {
          const source = this.toSafeString(
            hit.metadata.source,
            'Неизвестный источник',
          );
          const article = this.toSafeString(hit.metadata.article, '');
          const header = article ? `${source}, ${article}` : source;

          return `[${collection} #${idx + 1}] ${header}\n${hit.content}`;
        })
        .join('\n\n');

      parts.push(block);
    }

    return parts.join('\n\n---\n\n');
  }

  async generateDocument(prompt: string): Promise<string> {
    const ragContext = await this.buildRagContext(prompt);
    const finalPrompt = ragContext
      ? `${prompt}\n\nКОНТЕКСТ ИЗ ПРАВОВОЙ БАЗЫ:\n${ragContext}`
      : prompt;

    return this.llmService.generate(finalPrompt);
  }
}
