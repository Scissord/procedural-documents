import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { IStage } from './stage.model';
import { StageService } from './stage.service';

@ApiTags('stages')
@Controller('stages')
export class StageController {
  constructor(private readonly stageService: StageService) {}

  @Get('classification/:classification_id')
  findByClassificationId(
    @Param('classification_id') classification_id: number,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { stages: IStage[] };
  }> {
    return this.stageService.findByClassificationId(classification_id);
  }
}
