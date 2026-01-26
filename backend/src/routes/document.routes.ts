import { Router } from 'express';
import { DocumentController } from '@controllers';

const router = Router();

// Генерация юридического документа
// router.post('/generate', DocumentController.generateDocument);

// генерация из ситуации (для Telegram бота)
router.post(
  '/telegram/generate',
  DocumentController.generateDocumentFromSituation,
);

router.get('/stage/:stage_id', DocumentController.getDocumentsByStageId);

export default router;
