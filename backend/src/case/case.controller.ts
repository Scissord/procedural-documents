import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { ICase } from './case.model';
import { CaseService } from './case.service';
import type { AuthRequest } from 'src/auth/auth.middleware';
import { Req } from '@nestjs/common';

@ApiTags('cases')
@Controller('cases')
export class CasesController {
  constructor(private readonly caseService: CaseService) {}

  @Get()
  get(@Req() req: AuthRequest): Promise<{
    statusCode: number;
    message: string;
    data: { cases: ICase[] };
  }> {
    const auth = req.auth;
    if (!auth) {
      throw new UnauthorizedException('Auth context is missing');
    }

    return this.caseService.getByUserId(auth.user_id);
  }
}
