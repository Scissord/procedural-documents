import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { IRole } from './role.model';
import { RoleService } from './role.service';

@ApiTags('roles')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  get(): Promise<{
    statusCode: number;
    message: string;
    data: { roles: IRole[] };
  }> {
    return this.roleService.get();
  }
}
