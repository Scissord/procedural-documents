import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { IClassification } from './classification.model';
import { ClassificationService } from './classification.service';

@ApiTags('classifications')
@Controller('classifications')
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  @Get()
  getAll(): Promise<{
    statusCode: number;
    message: string;
    data: { classifications: IClassification[] };
  }> {
    return this.classificationService.getAll();
  }
}
