import {
  DocumentExportService,
  DocumentValidationService,
  DocumentService,
  logger,
} from '@services';
import { normalizeError } from '@helpers';
import { Request, Response } from 'express';
import { IGenerateDocumentRequest } from '@interfaces';
import { generateLegalDocument } from '../agents/legal_agent';

// Дефолтные значения для Telegram бота
const defaultTelegramData = {
  document_id: 1,
  classification_id: 1,
  role_id: 1,
  stage_id: 1,
  court_name: '<<НУЖНО УТОЧНИТЬ: наименование суда>>',
  court_address: '<<НУЖНО УТОЧНИТЬ: адрес суда>>',
  case_number: '<<НУЖНО УТОЧНИТЬ: номер дела>>',
  price_of_claim: '<<НУЖНО УТОЧНИТЬ: цена иска>>',
  userData: {
    fullName: '<<НУЖНО УТОЧНИТЬ: ФИО истца>>',
  },
  opponentData: {
    fullName: '<<НУЖНО УТОЧНИТЬ: ФИО ответчика>>',
    phone: '',
    email: '',
  },
};

/**
 * Контроллер для работы с юридическими документами
 */
export const DocumentController = {
  /**
   * Генерация юридического документа
   * POST /api/documents/generate
   * Использует универсальный PromptBuilder для всех 47 шаблонов
   **/
  async generateDocument(req: Request, res: Response): Promise<void> {
    try {
      const {
        document_id,
        classification_id,
        role_id,
        stage_id,
        situation,
        court_name,
        court_address,
        case_number,
        price_of_claim,
        userData,
        opponentData,
      }: IGenerateDocumentRequest = req.body;

      await DocumentValidationService.validateDocument(
        document_id,
        classification_id,
        role_id,
        stage_id,
        situation,
        court_name,
        court_address,
        case_number,
        price_of_claim,
        userData,
        opponentData,
      );

      // Используем универсальный PromptBuilder для генерации промпта
      // Промпт автоматически адаптируется под:
      // - role_id (истец/ответчик)
      // - stage_id (стадия процесса)
      // - sections (секции документа)
      // - специальные правила (экспертиза, мировое соглашение, апелляция/кассация)
      const { prompt, template } =
        await DocumentService.prepareDocumentWithUniversalPrompt(
          document_id,
          classification_id,
          role_id,
          stage_id,
          situation,
          court_name,
          court_address,
          case_number,
          price_of_claim,
          userData,
          opponentData,
        );

      if (!prompt) {
        throw new Error('Document template not found');
      }

      logger.info(
        `Generating document: ${template?.name_ru || 'Unknown'} (id: ${document_id})`,
      );

      const document = await generateLegalDocument(prompt);

      logger.info('Document generated successfully');

      const buffer = await DocumentExportService.toDocxBuffer(document);
      const filename = `document_${Date.now()}.docx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send(buffer);
      return;
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error(`
        Failed to generate document
        Error: ${message}
      `);
      res.status(500).json({
        success: false,
        error: 'Ошибка при генерации документа',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  },

  /**
   * Упрощенная генерация документа только из ситуации (для Telegram бота)
   * POST /api/documents/generate-from-situation
   * Использует универсальный PromptBuilder
   */
  async generateDocumentFromSituation(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { situation, document_id, role_id, stage_id } = req.body;

      if (!situation || typeof situation !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Поле situation обязательно',
        });
        return;
      }

      // Используем дефолтные значения с возможностью переопределения
      const data = {
        ...defaultTelegramData,
        document_id: document_id || defaultTelegramData.document_id,
        role_id: role_id || defaultTelegramData.role_id,
        stage_id: stage_id || defaultTelegramData.stage_id,
        situation,
      };

      // Используем универсальный PromptBuilder
      const { prompt, template } =
        await DocumentService.prepareDocumentWithUniversalPrompt(
          data.document_id,
          data.classification_id,
          data.role_id,
          data.stage_id,
          data.situation,
          data.court_name,
          data.court_address,
          data.case_number,
          data.price_of_claim,
          data.userData,
          data.opponentData,
        );

      if (!prompt) {
        throw new Error('Document template not found');
      }

      logger.info(
        `Generating document from situation: ${template?.name_ru || 'Unknown'} (id: ${data.document_id})`,
      );

      const document = await generateLegalDocument(prompt);

      logger.info('Document generated successfully from situation');

      res.json({
        success: true,
        document,
        metadata: {
          generatedAt: new Date().toISOString(),
          documentType: template?.name_ru || 'Исковое заявление',
          documentId: data.document_id,
          roleId: data.role_id,
          stageId: data.stage_id,
          collections: ['kz_gk', 'kz_gpk', 'kz_civil_practice'],
        },
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error(`
        Failed to generate document from situation
        Error: ${message}
      `);
      res.status(500).json({
        success: false,
        error: 'Ошибка при генерации документа',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  },

  /**
   * Получение списка документов по stage_id
   * GET /api/documents/stage/:stage_id
   */
  async getDocumentsByStageId(req: Request, res: Response): Promise<void> {
    try {
      const stage_id = Number(req.params.stage_id);

      if (!stage_id || isNaN(stage_id)) {
        res.status(400).json({
          success: false,
          error: 'stage_id is required and must be a number',
        });
        return;
      }

      const documents = await DocumentService.getDocumentsByStageId(stage_id);

      res.status(200).json({
        success: true,
        data: documents,
        count: documents.length,
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Failed to get documents by stage_id', { error: message });
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении документов',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  },
};
