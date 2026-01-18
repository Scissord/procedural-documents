import { TestController } from '@controllers';
import { Router } from 'express';

const router = Router();

router.post('/generate', TestController.generateDocument);

export default router;
