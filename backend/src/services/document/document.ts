import { db, DocumentValidationService, TemplateService } from '@services';
import { DocumentRepository } from '@repositories';

interface IDocument {
  id: number;
  user_id: number;
  situation: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
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
};
