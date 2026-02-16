import { Injectable } from '@nestjs/common';
import { IFields } from 'src/app_document/dto/create-document.dto';
import { getPrompt } from 'src/helpers/get_prompt';
import { getTemplate } from 'src/helpers/get_template';

@Injectable()
export class PromptTemplateService {
  buildTemplate(fields: IFields): string {
    return getTemplate(fields);
  }

  buildPrompt(template: string): string {
    return getPrompt(template);
  }
}
