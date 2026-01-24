import { Router } from 'express';
import { ClassificationController } from '@controllers';

const router = Router();

router.get('/', ClassificationController.get);

export default router;
