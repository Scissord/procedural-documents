/**
 * Декларации типов для LangChain модулей
 * Нужны потому что moduleResolution: "node" не поддерживает exports из package.json
 */

declare module '@langchain/langgraph/prebuilt' {
  import { BaseChatModel } from '@langchain/core/language_models/chat_models';
  import { StructuredToolInterface } from '@langchain/core/tools';
  import { CompiledStateGraph } from '@langchain/langgraph';

  export interface CreateReactAgentParams {
    llm: BaseChatModel;
    tools: StructuredToolInterface[];
    stateModifier?: string;
    checkpointSaver?: unknown;
    interruptBefore?: string[];
    interruptAfter?: string[];
  }

  export function createReactAgent(
    params: CreateReactAgentParams,
  ): CompiledStateGraph<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >;
}
