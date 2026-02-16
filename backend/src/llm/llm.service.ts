import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class LlmService {
  private readonly legalLLM = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0.2,
  });

  async generate(prompt: string): Promise<string> {
    const response = await this.legalLLM.invoke(prompt);
    const content = response.content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) =>
          typeof part === 'string'
            ? part
            : 'text' in part && typeof part.text === 'string'
              ? part.text
              : '',
        )
        .join('\n')
        .trim();
    }

    return String(content ?? '');
  }
}
