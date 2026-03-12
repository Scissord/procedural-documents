import { Module } from '@nestjs/common';
import { AppDocumentController } from './app_document.controller';
import { DatabaseModule } from 'src/db/database.module';
import { AppDocumentService } from './app_document.service';
import { AiModule } from 'src/ai/ai.module';
import { CaseModule } from 'src/case/case.module';

@Module({
  imports: [DatabaseModule, AiModule, CaseModule],
  controllers: [AppDocumentController],
  providers: [AppDocumentService],
})
export class AppDocumentModule {}
