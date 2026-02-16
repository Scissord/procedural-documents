import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantVectorStore } from '@langchain/qdrant';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class QdrantService {
  private readonly vectorStores = new Map<string, QdrantVectorStore>();
  private client: QdrantClient | null = null;
  private embeddings: OpenAIEmbeddings | null = null;
  private initPromise: Promise<void> | null = null;

  private async init(): Promise<void> {
    if (this.client && this.embeddings) {
      return;
    }

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = Promise.resolve(this.doInit());
    await this.initPromise;
  }

  private doInit(): void {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL ?? 'http://localhost:6333',
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName:
        process.env.OPENAI_EMBEDDINGS_MODEL ?? 'text-embedding-3-small',
    });
  }

  async searchWithMetadata(
    query: string,
    limit: number,
    collectionName: string,
  ): Promise<Array<{ content: string; metadata: Record<string, unknown> }>> {
    const vectorStore = await this.getVectorStore(collectionName);
    const docs = await vectorStore.similaritySearch(query, limit);

    return docs.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));
  }

  private async getVectorStore(
    collectionName: string,
  ): Promise<QdrantVectorStore> {
    await this.init();

    const existing = this.vectorStores.get(collectionName);
    if (existing) {
      return existing;
    }

    const store = await QdrantVectorStore.fromExistingCollection(
      this.embeddings as OpenAIEmbeddings,
      {
        client: this.client as QdrantClient,
        collectionName,
      },
    );

    this.vectorStores.set(collectionName, store);
    return store;
  }
}
