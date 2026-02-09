import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { qdrantService } from '@services';

function makeExcerpt(text: string, query: string, maxChars: number): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;

  const q = (query ?? '').trim();
  if (!q) return clean.slice(0, maxChars) + '…';

  // Try to find a window around a keyword from query
  const keywords = q
    .split(/[\s,.;:()«»"'[\]{}]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4)
    .slice(0, 8);

  const lower = clean.toLowerCase();
  let hitIdx = -1;
  for (const kw of keywords) {
    const idx = lower.indexOf(kw.toLowerCase());
    if (idx !== -1) {
      hitIdx = idx;
      break;
    }
  }

  if (hitIdx === -1) return clean.slice(0, maxChars) + '…';

  const half = Math.floor(maxChars / 2);
  const start = Math.max(0, hitIdx - half);
  const end = Math.min(clean.length, start + maxChars);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < clean.length ? '…' : '';
  return prefix + clean.slice(start, end) + suffix;
}

/**
 * Tool для поиска по законодательству РК
 * Используется агентом для RAG
 */
export const qdrantSearchTool = tool(
  async ({ query, limit = 5, collection }): Promise<string> => {
    if (!collection) {
      throw new Error(
        'Qdrant collection is required. Expected one of: kz_gk, kz_gpk, kz_civil_practice',
      );
    }

    // Hard caps to avoid context blow-ups (costly + can crash the run)
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 5);
    const maxCharsPerResult = 1400;

    const results = await qdrantService.searchWithMetadata(
      query,
      safeLimit,
      collection,
    );

    if (results.length === 0) {
      return 'Релевантные статьи не найдены.';
    }

    // Форматируем результаты с указанием источников
    const out = results
      .map((doc, i) => {
        const source = doc.metadata.source || 'Неизвестный источник';
        const article = doc.metadata.article || '';
        const excerpt = makeExcerpt(
          String(doc.content ?? ''),
          query,
          maxCharsPerResult,
        );
        return `[${i + 1}] ${source}${article ? `, ${article}` : ''}\n${excerpt}`;
      })
      .join('\n\n---\n\n');

    // Extra safety: cap total tool output
    return out.length > 15000 ? out.slice(0, 15000) + '\n\n…(обрезано)' : out;
  },
  {
    name: 'search_legislation',
    description: `Поиск по законодательству Республики Казахстан.
      Используй для поиска:
      - Статей кодексов (ГК, ГПК, УК, УПК, КоАП и др.)
      - Законов РК
      - Нормативных актов

      Входные данные: поисковый запрос на русском языке.
      Пример: "ответственность за неисполнение договора", "сроки подачи апелляции"
    `,
    schema: z.object({
      query: z
        .string()
        .describe('Поисковый запрос для поиска релевантных статей'),
      collection: z
        .enum(['kz_gk', 'kz_gpk', 'kz_civil_practice'])
        .describe(
          'Имя коллекции Qdrant. В текущем проекте: kz_gk | kz_gpk | kz_civil_practice',
        ),
      limit: z
        .number()
        .optional()
        .default(5)
        .describe('Количество результатов (по умолчанию 5)'),
    }),
  },
);
