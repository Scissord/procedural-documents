import { Router } from 'express';
import { ApiController } from '@controllers';

const router = Router();

router.get('/test', ApiController.test);

export default router;
