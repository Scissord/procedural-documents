import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { IAppDocument } from './app_document.model';
import { AppDocumentService } from './app_document.service';
import type { AuthRequest } from 'src/auth/auth.middleware';
import { Req } from '@nestjs/common';
import { IFields } from './dto/create-document.dto';

interface UploadedFilePayload {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

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

  @Post('/appeal')
  @UseInterceptors(FileInterceptor('file'))
  createAppeal(
    @Req() req: AuthRequest,
    @UploadedFile() file: UploadedFilePayload,
    @Body('case_id') case_id: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { document: IAppDocument };
  }> {
    const auth = req.auth;
    if (!auth) {
      throw new UnauthorizedException('Auth context is missing');
    }

    return this.appDocumentService.createAppeal(auth.user_id, case_id, file);
  }

  @Get('/:case_id/chronology')
  getChronology(
    @Req() req: AuthRequest,
    @Param('case_id', ParseUUIDPipe) case_id: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { documents: IAppDocument[] };
  }> {
    const auth = req.auth;
    if (!auth) {
      throw new UnauthorizedException('Auth context is missing');
    }

    return this.appDocumentService.getChronology(auth.user_id, case_id);
  }
}
