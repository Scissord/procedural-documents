import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { TokenService } from './token.service';

@Module({
  imports: [DatabaseModule],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
