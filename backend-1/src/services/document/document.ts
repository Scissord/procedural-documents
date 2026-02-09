import { db, DocumentValidationService, TemplateService } from '@services';
import { PromptBuilder } from '../prompt/prompt';
import { DocumentRepository } from '@repositories';
import { IUserDocument, IDocumentTemplate } from '@interfaces';

interface IDocument {
  id: number;
  user_id: number;
  situation: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

/**
 * Результат подготовки документа с полным промптом
 */
interface IPreparedDocument {
  prompt: string;
  template: IDocumentTemplate | null;
  structureTemplate: string;
}

export const DocumentService = {
  async createDocument(situation: string): Promise<IDocument> {
    const query = `
      INSERT INTO app.document (
        user_id,
        situation
      )
      VALUES ($1, $2)
      RETURNING *;
    `;

    const document = await db.query(query, [8, situation]);

    return document.rows[0];
  },

  async getDocument(document_id: number): Promise<IDocument> {
    const query = `
      SELECT * FROM app.document
      WHERE id = $1
    `;

    const document = await db.query(query, [document_id]);

    return document.rows[0];
  },

  async prepareDocument(
    document_id: number,
    classification_id: number,
    role_id: number,
    stage_id: number,
    situation: string,
    court_name: string,
    court_address: string,
    case_number: string,
    price_of_claim: string,
    userData: {
      fullName: string;
      iin?: string;
      bin?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    opponentData: {
      fullName: string;
      iin?: string;
      bin?: string;
      address?: string;
      phone: string;
      email: string;
      representative?: string;
    },
  ): Promise<string> {
    // Guard against huge inputs (PDF dumps etc.) causing model context overflow.
    // Keep enough facts for the LLM, but avoid multi-hundred-thousand token prompts.
    const slicedSituation = DocumentValidationService.sliceSituation(situation);

    // Replace default values in template with actual data
    const replaceTemplateValues = (template: string): string => {
      return template
        .replace(
          /Название суда/g,
          court_name || '<<НУЖНО УТОЧНИТЬ: наименование суда>>',
        )
        .replace(
          /Адресс суда/g,
          court_address || '<<НУЖНО УТОЧНИТЬ: адрес суда>>',
        )
        .replace(
          /ФИО истца/g,
          userData?.fullName || '<<НУЖНО УТОЧНИТЬ: ФИО истца>>',
        )
        .replace(
          /ИИН\/БИН истца/g,
          userData?.iin || userData?.bin || '<<НУЖНО УТОЧНИТЬ: ИИН/БИН истца>>',
        )
        .replace(
          /Адрес истца/g,
          userData?.address || '<<НУЖНО УТОЧНИТЬ: адрес истца>>',
        )
        .replace(/Телефон истца/g, userData?.phone || '')
        .replace(/plaintiff@test\.com/g, userData?.email || '')
        .replace(
          /Имя ответчика/g,
          opponentData?.fullName || '<<НУЖНО УТОЧНИТЬ: ФИО ответчика>>',
        )
        .replace(
          /ИИН\/БИН ответчика/g,
          opponentData?.iin ||
            opponentData?.bin ||
            '<<НУЖНО УТОЧНИТЬ: ИИН/БИН ответчика>>',
        )
        .replace(
          /Адрес ответчика/g,
          opponentData?.address || '<<НУЖНО УТОЧНИТЬ: адрес ответчика>>',
        )
        .replace(/Телефон ответчика/g, opponentData?.phone || '')
        .replace(/defendant@test\.com/g, opponentData?.email || '')
        .replace(/Представитель ответчика/g, opponentData?.representative || '')
        .replace(/\.\.\./g, price_of_claim || '<<НУЖНО УТОЧНИТЬ: цена иска>>');
    };

    let input = '';
    switch (document_id) {
      case 1:
        input = replaceTemplateValues(
          TemplateService.getFirstTemplate(slicedSituation),
        );
        break;

      case 2:
        input = replaceTemplateValues(
          TemplateService.getSecondTemplate(slicedSituation),
        );
        break;

      default: {
        // Try to get template from database
        const template = await DocumentRepository.getById(document_id);
        if (template) {
          // Build structure from template sections
          const sections = template.sections
            .map((section) => section.template)
            .join('\n\n');
          input = replaceTemplateValues(sections);
        }
        break;
      }
    }

    return input;
  },

  /**
   * Получает список документов по stage_id из БД
   */
  async getDocumentsByStageId(stage_id: number) {
    return DocumentRepository.getByStageId(stage_id);
  },

  /**
   * Получает список документов пользователя из app.document
   */
  async getUserDocuments(user_id: number): Promise<IUserDocument[]> {
    return DocumentRepository.getUserDocuments(user_id);
  },

  /**
   * Подготовить документ с универсальным промптом
   * Использует PromptBuilder для генерации промпта на основе метаданных шаблона
   */
  async prepareDocumentWithUniversalPrompt(
    document_id: number,
    classification_id: number,
    role_id: number,
    stage_id: number,
    situation: string,
    court_name: string,
    court_address: string,
    case_number: string,
    price_of_claim: string,
    userData: {
      fullName: string;
      iin?: string;
      bin?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    opponentData: {
      fullName: string;
      iin?: string;
      bin?: string;
      address?: string;
      phone: string;
      email: string;
      representative?: string;
    },
  ): Promise<IPreparedDocument> {
    // Guard against huge inputs
    const slicedSituation = DocumentValidationService.sliceSituation(situation);

    // Функция замены плейсхолдеров
    const replaceTemplateValues = (template: string): string => {
      return template
        .replace(
          /Название суда/g,
          court_name || '<<НУЖНО УТОЧНИТЬ: наименование суда>>',
        )
        .replace(
          /Адресс суда/g,
          court_address || '<<НУЖНО УТОЧНИТЬ: адрес суда>>',
        )
        .replace(
          /ФИО истца/g,
          userData?.fullName || '<<НУЖНО УТОЧНИТЬ: ФИО истца>>',
        )
        .replace(
          /ИИН\/БИН истца/g,
          userData?.iin || userData?.bin || '<<НУЖНО УТОЧНИТЬ: ИИН/БИН истца>>',
        )
        .replace(
          /Адрес истца/g,
          userData?.address || '<<НУЖНО УТОЧНИТЬ: адрес истца>>',
        )
        .replace(/Телефон истца/g, userData?.phone || '')
        .replace(/plaintiff@test\.com/g, userData?.email || '')
        .replace(
          /Имя ответчика/g,
          opponentData?.fullName || '<<НУЖНО УТОЧНИТЬ: ФИО ответчика>>',
        )
        .replace(
          /ИИН\/БИН ответчика/g,
          opponentData?.iin ||
            opponentData?.bin ||
            '<<НУЖНО УТОЧНИТЬ: ИИН/БИН ответчика>>',
        )
        .replace(
          /Адрес ответчика/g,
          opponentData?.address || '<<НУЖНО УТОЧНИТЬ: адрес ответчика>>',
        )
        .replace(/Телефон ответчика/g, opponentData?.phone || '')
        .replace(/defendant@test\.com/g, opponentData?.email || '')
        .replace(/Представитель ответчика/g, opponentData?.representative || '')
        .replace(/\.\.\./g, price_of_claim || '<<НУЖНО УТОЧНИТЬ: цена иска>>')
        .replace(
          /Номер дела/g,
          case_number || '<<НУЖНО УТОЧНИТЬ: номер дела>>',
        );
    };

    // Получаем шаблон из БД
    const template = await DocumentRepository.getById(document_id);

    if (!template) {
      // Fallback для старых шаблонов 1 и 2
      let structureTemplate = '';
      if (document_id === 1) {
        structureTemplate = replaceTemplateValues(
          TemplateService.getFirstTemplate(slicedSituation),
        );
      } else if (document_id === 2) {
        structureTemplate = replaceTemplateValues(
          TemplateService.getSecondTemplate(slicedSituation),
        );
      }

      // Создаём минимальный шаблон для PromptBuilder
      const fallbackTemplate: IDocumentTemplate = {
        id: document_id,
        name_ru:
          document_id === 1
            ? 'Исковое заявление'
            : 'Исковое заявление (электронная подача)',
        role_id: role_id || 1,
        stage_id: stage_id || 1,
        jurisdiction_id: 1,
        classification_id: classification_id || 1,
        placeholders: { required: [], optional: [] },
        sections: [
          { key: 'header', title_ru: 'Шапка', template: 'standard_header' },
          {
            key: 'body',
            title_ru: 'Текст документа',
            template: 'standard_body',
          },
          {
            key: 'requests',
            title_ru: 'Просительная часть',
            template: 'standard_requests',
          },
          {
            key: 'attachments',
            title_ru: 'Приложения',
            template: 'standard_attachments',
          },
          {
            key: 'signature',
            title_ru: 'Подпись',
            template: 'standard_signature',
          },
        ],
        rules: { stages_allowed: ['Возбуждение дела'] },
      };

      const prompt = PromptBuilder.buildUniversalPrompt(
        fallbackTemplate,
        slicedSituation,
        structureTemplate,
      );

      return {
        prompt,
        template: fallbackTemplate,
        structureTemplate,
      };
    }

    // Строим структуру из секций шаблона
    const structureTemplate = this.buildStructureFromSections(
      template,
      slicedSituation,
      replaceTemplateValues,
    );

    // Генерируем универсальный промпт
    const prompt = PromptBuilder.buildUniversalPrompt(
      template,
      slicedSituation,
      structureTemplate,
    );

    return {
      prompt,
      template,
      structureTemplate,
    };
  },

  /**
   * Построить структуру документа из секций шаблона
   */
  buildStructureFromSections(
    template: IDocumentTemplate,
    situation: string,
    replaceTemplateValues: (s: string) => string,
  ): string {
    const sections: string[] = [];

    for (const section of template.sections) {
      let sectionContent = '';

      switch (section.key) {
        case 'header':
          sectionContent = this.buildHeaderSection(template.role_id);
          break;
        case 'body':
          sectionContent = this.buildBodySection(situation);
          break;
        case 'facts':
          sectionContent = this.buildFactsSection(situation);
          break;
        case 'legal_basis':
          sectionContent = this.buildLegalBasisSection();
          break;
        case 'requests':
          sectionContent = this.buildRequestsSection(template.name_ru);
          break;
        case 'attachments':
          sectionContent = this.buildAttachmentsSection();
          break;
        case 'signature':
          sectionContent = this.buildSignatureSection();
          break;
        default:
          sectionContent = `[${section.title_ru}]\n_____________________________________`;
      }

      sections.push(`[${section.title_ru}]\n${sectionContent}`);
    }

    return replaceTemplateValues(sections.join('\n\n'));
  },

  /**
   * Построить секцию "Шапка"
   */
  buildHeaderSection(roleId: number): string {
    if (roleId === 2) {
      // Ответчик
      return `
В Название суда
Адрес: Адресс суда
Дело №: Номер дела

Ответчик: Имя ответчика, ИИН/БИН: ИИН/БИН ответчика
Адрес: Адрес ответчика
Контакты: Телефон ответчика, defendant@test.com

Истец: ФИО истца, ИИН/БИН: ИИН/БИН истца
Адрес: Адрес истца
Контакты: Телефон истца, plaintiff@test.com
      `.trim();
    }

    // Истец (по умолчанию)
    return `
В Название суда
Адрес: Адресс суда
Дело №: Номер дела

Истец: ФИО истца, ИИН/БИН: ИИН/БИН истца
Адрес: Адрес истца
Контакты: Телефон истца, plaintiff@test.com

Ответчик: Имя ответчика, ИИН/БИН: ИИН/БИН ответчика
Адрес: Адрес ответчика
Контакты: Телефон ответчика, defendant@test.com
Представитель: Представитель ответчика
    `.trim();
  },

  /**
   * Построить секцию "Текст документа"
   */
  buildBodySection(situation: string): string {
    return `
Цена иска: ...

Описательная часть:
${situation}

Мотивировочная часть:
В соответствии со ст. ___ ГК РК / ГПК РК...
_____________________________________
    `.trim();
  },

  /**
   * Построить секцию "Фактические обстоятельства"
   */
  buildFactsSection(situation: string): string {
    return `
Изложение обстоятельств:
${situation}

Сведения о доказательствах:
_____________________________________
    `.trim();
  },

  /**
   * Построить секцию "Правовые основания"
   */
  buildLegalBasisSection(): string {
    return `
Нормы права и процессуальные основания:
В соответствии со ст. ___ ГК РК...
В соответствии со ст. ___ ГПК РК...
_____________________________________
    `.trim();
  },

  /**
   * Построить секцию "Просительная часть"
   */
  buildRequestsSection(_documentName: string): string {
    return `
На основании изложенного ПРОШУ СУД:

1) _____________________________________

2) _____________________________________

3) _____________________________________
    `.trim();
  },

  /**
   * Построить секцию "Приложения"
   */
  buildAttachmentsSection(): string {
    return `
Перечень прилагаемых документов:

1) _____________________________________

2) _____________________________________

3) _____________________________________

4) _____________________________________
    `.trim();
  },

  /**
   * Построить секцию "Подпись"
   */
  buildSignatureSection(): string {
    return `
Дата: «___» __________ 20__ г.

Подпись: ____________________
    `.trim();
  },
};
