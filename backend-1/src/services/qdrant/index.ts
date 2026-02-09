import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantVectorStore } from '@langchain/qdrant';
import { OpenAIEmbeddings } from '@langchain/openai';

/**
 * Singleton для Qdrant Vector Store
 * Lazy initialization - создаётся только при первом вызове
 */
class QdrantService {
  private static instance: QdrantService;
  private vectorStores: Map<string, QdrantVectorStore> = new Map();
  private client: QdrantClient | null = null;
  private embeddings: OpenAIEmbeddings | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): QdrantService {
    if (!QdrantService.instance) {
      QdrantService.instance = new QdrantService();
    }
    return QdrantService.instance;
  }

  /**
   * Инициализация подключения к Qdrant
   * Вызывается лениво при первом запросе
   */
  private async init(): Promise<void> {
    // client/embeddings are shared across collections
    if (this.client && this.embeddings) return;

    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.doInit();
    await this.initPromise;
  }

  private async doInit(): Promise<void> {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      // apiKey: process.env.QDRANT_API_KEY,
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName:
        process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-small',
    });

    // vector store(s) are created lazily per collection
  }

  /**
   * Поиск релевантных документов
   */
  async search(
    query: string,
    limit: number = 5,
    collectionName: string,
  ): Promise<string[]> {
    if (!collectionName) {
      throw new Error('Collection name is required');
    }

    const vectorStore = await this.getVectorStore(collectionName);
    const docs = await vectorStore.similaritySearch(query, limit);
    return docs.map((doc) => doc.pageContent);
  }

  /**
   * Поиск с метаданными (для указания источников)
   */
  async searchWithMetadata(
    query: string,
    limit: number = 5,
    collectionName: string,
  ): Promise<Array<{ content: string; metadata: Record<string, unknown> }>> {
    if (!collectionName) {
      throw new Error('Collection name is required');
    }

    const vectorStore = await this.getVectorStore(collectionName);
    const docs = await vectorStore.similaritySearch(query, limit);
    return docs.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));
  }

  /**
   * Получить vector store напрямую
   */
  async getVectorStore(collectionName: string): Promise<QdrantVectorStore> {
    await this.init();

    if (!collectionName) {
      throw new Error('Collection name is required');
    }

    const existing = this.vectorStores.get(collectionName);
    if (existing) return existing;

    const store = await QdrantVectorStore.fromExistingCollection(
      this.embeddings!,
      {
        client: this.client!,
        collectionName,
      },
    );
    this.vectorStores.set(collectionName, store);
    return store;
  }
}

export const qdrantService = QdrantService.getInstance();
