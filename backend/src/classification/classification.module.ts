import { Module } from '@nestjs/common';
import { ClassificationController } from './classification.controller';
import { DatabaseModule } from 'src/db/database.module';
import { ClassificationService } from './classification.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ClassificationController],
  providers: [ClassificationService],
})
export class ClassificationModule {}
