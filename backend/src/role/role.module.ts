import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { DatabaseModule } from 'src/db/database.module';
import { RoleService } from './role.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
