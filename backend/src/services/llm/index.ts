import { ChatOpenAI } from '@langchain/openai';

/**
 * LLM конфигурация
 * Можно легко переключаться между моделями
 */
export const createLLM = (options?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) => {
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: options?.model || 'gpt-4o-mini',
    temperature: options?.temperature ?? 0.3,
    maxTokens: options?.maxTokens,
  });
};

// Дефолтный LLM для юридических задач
export const legalLLM = createLLM({
  model: 'gpt-4o-mini',
  temperature: 0.2, // Ещё ниже для точности
});

// Более мощный LLM для сложных кейсов
export const advancedLLM = createLLM({
  model: 'gpt-4o',
  temperature: 0.2,
});
