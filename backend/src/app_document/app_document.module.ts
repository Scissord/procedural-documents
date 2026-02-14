import { Module } from '@nestjs/common';
import { AppDocumentController } from './app_document.controller';
import { DatabaseModule } from 'src/db/database.module';
import { AppDocumentService } from './app_document.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppDocumentController],
  providers: [AppDocumentService],
})
export class ClassificationModule {}
