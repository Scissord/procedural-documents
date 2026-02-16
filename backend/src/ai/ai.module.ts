import { Module } from '@nestjs/common';
import { LegalAgentService } from './legal-agent.service';
import { PromptTemplateService } from './prompt-template.service';
import { LlmService } from 'src/llm/llm.service';
import { QdrantService } from 'src/qdrant/qdrant.service';

@Module({
  providers: [
    PromptTemplateService,
    LegalAgentService,
    LlmService,
    QdrantService,
  ],
  exports: [PromptTemplateService, LegalAgentService],
})
export class AiModule {}
