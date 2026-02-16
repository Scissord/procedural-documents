import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { IAppDocument } from './app_document.model';
import { AppDocumentService } from './app_document.service';
import type { AuthRequest } from 'src/auth/auth.middleware';
import { Req } from '@nestjs/common';
import { IFields } from './dto/create-document.dto';

@ApiTags('app-documents')
@Controller('app-documents')
export class AppDocumentController {
  constructor(private readonly appDocumentService: AppDocumentService) {}

  @Post()
  create(
    @Req() req: AuthRequest,
    @Body() body: { fields: IFields },
  ): Promise<{
    statusCode: number;
    message: string;
    data: { document: IAppDocument };
  }> {
    const auth = req.auth;
    if (!auth) {
      throw new UnauthorizedException('Auth context is missing');
    }

    return this.appDocumentService.create(auth.user_id, body);
  }

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

  @Get(':id')
  async getById(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { document: IAppDocument };
  }> {
    const auth = req.auth;
    if (!auth) {
      throw new UnauthorizedException('Auth context is missing');
    }

    const result = await this.appDocumentService.getById(auth.user_id, id);
    if (!result.data.document) {
      throw new NotFoundException('Document not found');
    }

    return {
      statusCode: result.statusCode,
      message: result.message,
      data: {
        document: result.data.document,
      },
    };
  }
}
