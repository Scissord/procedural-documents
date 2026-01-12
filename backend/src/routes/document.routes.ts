import { Router } from 'express';
import { DocumentController } from '@controllers';

const router = Router();

// Генерация юридического документа
router.post('/generate', DocumentController.generateDocument);

export default router;
