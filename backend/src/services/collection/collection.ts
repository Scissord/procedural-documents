import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { Document } from '@langchain/core/documents';
import { QdrantVectorStore } from '@langchain/qdrant';
import { logger, qdrantService } from '@services';

type ArticleChunk = {
  article: string;
  content: string;
};

export const CollectionService = {
  async readPdf(path: string): Promise<string> {
    const buffer = fs.readFileSync(path);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    return result.text;
  },

  /**
   * Пытается разрезать текст по заголовкам "Статья N" и вернуть чанки по статьям.
   * Если статьи не распознаны — вернёт пустой массив (для fallback на splitText()).
   */
  async splitByArticles(text: string): Promise<ArticleChunk[]> {
    // Нормализуем пробелы, чтобы регулярка чаще срабатывала на PDF-тексте
    const normalized = text.replace(/\u00a0/g, ' ');

    // Примерные варианты из PDF: "Статья 12.", "СТАТЬЯ 12-1", "Статья 12-1."
    const re = /(^|\n)\s*(Статья|СТАТЬЯ)\s+(\d+(?:-\d+)?)(?:\s*[.\-–—:]|\s+)/g;

    const hits: Array<{ index: number; article: string }> = [];
    let m: RegExpExecArray | null;

    while ((m = re.exec(normalized)) !== null) {
      hits.push({ index: m.index, article: m[3] });
      // Safety: avoid infinite loops on zero-width matches
      if (re.lastIndex === m.index) re.lastIndex++;
    }

    if (hits.length === 0) return [];

    const chunks: ArticleChunk[] = [];
    for (let i = 0; i < hits.length; i++) {
      const start = hits[i].index;
      const end = i + 1 < hits.length ? hits[i + 1].index : normalized.length;
      const content = normalized.slice(start, end).trim();
      if (!content) continue;
      chunks.push({ article: hits[i].article, content });
    }

    // Иногда PDF даёт оглавление/дубли — отфильтруем совсем короткие куски
    return chunks.filter((c) => c.content.length > 80);
  },

  async splitText(
    text: string,
    chunkSize = 800,
    overlap = 100,
  ): Promise<string[]> {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = start + chunkSize;
      chunks.push(text.slice(start, end));
      start = Math.max(end - overlap, start + 1);
    }

    return chunks;
  },

  async createDocuments(chunks: string[], source: string): Promise<Document[]> {
    return chunks.map(
      (chunk, idx) =>
        new Document({
          pageContent: chunk,
          metadata: { source, chunk: idx },
        }),
    );
  },

  async createArticleDocuments(
    chunks: ArticleChunk[],
    source: string,
  ): Promise<Document[]> {
    return chunks.map(
      (chunk, idx) =>
        new Document({
          pageContent: chunk.content,
          metadata: { source, chunk: idx, article: chunk.article },
        }),
    );
  },

  async uploadToQdrant(
    docs: Document[],
    collectionName: string,
  ): Promise<void> {
    const vectorStore: QdrantVectorStore =
      await qdrantService.getVectorStore(collectionName);

    const batchSize =
      Number.parseInt(process.env.QDRANT_BATCH_SIZE ?? '50', 10) || 50;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      try {
        await vectorStore.addDocuments(batch);
        logger.info(`
        batch uploaded to qdrant
        batchStart: ${i},
        batchEnd: ${i + batch.length - 1},
        size: ${batch.length}
      `);
      } catch (err) {
        logger.error(`
        error adding documents batch to vector store,
        batchStart: ${i},
        batchEnd: ${i + batch.length - 1},
        ${err}
      `);
        throw err;
      }
    }
  },
};
