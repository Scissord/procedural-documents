import { Module } from '@nestjs/common';
import { RefDocumentController } from './ref_document.controller';
import { DatabaseModule } from 'src/db/database.module';
import { RefDocumentService } from './ref_document.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RefDocumentController],
  providers: [RefDocumentService],
})
export class RefDocumentModule {}
