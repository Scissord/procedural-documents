import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { SessionService } from './session.service';

@Module({
  imports: [DatabaseModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
