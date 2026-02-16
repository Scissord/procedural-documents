import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { IRefDocument } from './ref_document.model';
import { RefDocumentService } from './ref_document.service';
import type { AuthRequest } from 'src/auth/auth.middleware';
import { Req } from '@nestjs/common';

@ApiTags('ref-documents')
@Controller('ref-documents')
export class RefDocumentController {
  constructor(private readonly refDocumentService: RefDocumentService) {}

  @Get()
  get(
    @Req() req: AuthRequest,
    @Query()
    query: { classification_id: number; stage_id: number; role_id: number },
  ): Promise<{
    statusCode: number;
    message: string;
    data: { documents: IRefDocument[] };
  }> {
    const auth = req.auth;
    if (!auth) {
      throw new UnauthorizedException('Auth context is missing');
    }

    const classification_id = Number(query.classification_id);
    const stage_id = Number(query.stage_id);
    const role_id = Number(query.role_id);

    if (
      !Number.isFinite(classification_id) ||
      !Number.isFinite(stage_id) ||
      !Number.isFinite(role_id)
    ) {
      throw new BadRequestException(
        'classification_id, stage_id, role_id must be numbers',
      );
    }

    return this.refDocumentService.get(classification_id, stage_id, role_id);
  }

  @Get(':id')
  async getById(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { document: IRefDocument };
  }> {
    const auth = req.auth;
    if (!auth) {
      throw new UnauthorizedException('Auth context is missing');
    }

    const result = await this.refDocumentService.getById(id);
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
