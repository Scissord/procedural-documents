import { Module } from '@nestjs/common';
import { CasesController } from './case.controller';
import { DatabaseModule } from 'src/db/database.module';
import { CaseService } from './case.service';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports: [DatabaseModule, AiModule],
  controllers: [CasesController],
  providers: [CaseService],
  exports: [CaseService],
})
export class CaseModule {}
