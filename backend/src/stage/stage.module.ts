import { Module } from '@nestjs/common';
import { StageController } from './stage.controller';
import { DatabaseModule } from 'src/db/database.module';
import { StageService } from './stage.service';

@Module({
  imports: [DatabaseModule],
  controllers: [StageController],
  providers: [StageService],
})
export class StageModule {}
