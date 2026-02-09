import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { ProfileService } from './profile.service';

@Module({
  imports: [DatabaseModule],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
