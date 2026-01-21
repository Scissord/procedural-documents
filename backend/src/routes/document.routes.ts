import { Router } from 'express';
import { DocumentController } from '@controllers';

const router = Router();

// Генерация юридического документа
router.post('/generate', DocumentController.generateDocument);

// генерация из ситуации (для Telegram бота)
router.post(
  '/generate-from-situation',
  DocumentController.generateDocumentFromSituation,
);

export default router;
