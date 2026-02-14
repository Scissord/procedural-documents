import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { IAppDocument } from './app_document.model';
import { AppDocumentService } from './app_document.service';
import type { AuthRequest } from 'src/auth/auth.middleware';
import { Req } from '@nestjs/common';

@ApiTags('app-documents')
@Controller('app-documents')
export class AppDocumentController {
  constructor(private readonly appDocumentService: AppDocumentService) {}

  @Get()
  get(@Req() req: AuthRequest): Promise<{
    statusCode: number;
    message: string;
    data: { documents: IAppDocument[] };
  }> {
    const auth = req.auth;
    if (!auth) {
      throw new UnauthorizedException('Auth context is missing');
    }

    return this.appDocumentService.getByUserId(auth.user_id);
  }
}
