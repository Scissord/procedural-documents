import { qdrantSearchTool } from './tools/qdrant_search';
import { legalLLM } from '@services';

// Динамический require для обхода проблемы с moduleResolution: "node"
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { createReactAgent } = require('@langchain/langgraph/prebuilt') as any;

/**
 * Создание агента для генерации юридических документов
 * Использует LangGraph prebuilt agent
 */
export const createLegalAgent = () => {
  const tools = [qdrantSearchTool];

  // createReactAgent из LangGraph - современный подход
  const agent = createReactAgent({
    llm: legalLLM,
    tools,
  });

  return agent;
};

// Singleton instance
let agentInstance: ReturnType<typeof createReactAgent> | null = null;

/**
 * Получить экземпляр агента (lazy initialization)
 */
export const getLegalAgent = () => {
  if (!agentInstance) {
    agentInstance = createLegalAgent();
  }
  return agentInstance;
};

/**
 * Генерация юридического документа
 */
export const generateLegalDocument = async (input: string): Promise<string> => {
  // create agent
  const agent = getLegalAgent();

  // LangGraph agent использует invoke с messages
  const result = (await agent.invoke(
    {
      messages: [{ role: 'user', content: input }],
    },
    {
      recursionLimit: 50,
    },
  )) as { messages: Array<{ content: string | object }> };

  // Получаем последнее сообщение от ассистента
  const lastMessage = result.messages[result.messages.length - 1];
  return typeof lastMessage.content === 'string'
    ? lastMessage.content
    : JSON.stringify(lastMessage.content);
};
