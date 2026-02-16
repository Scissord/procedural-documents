import { Module } from '@nestjs/common';
import { AppDocumentController } from './app_document.controller';
import { DatabaseModule } from 'src/db/database.module';
import { AppDocumentService } from './app_document.service';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports: [DatabaseModule, AiModule],
  controllers: [AppDocumentController],
  providers: [AppDocumentService],
})
export class AppDocumentModule {}
