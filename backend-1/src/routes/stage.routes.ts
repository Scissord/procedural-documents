import { Router } from 'express';
import { StageController } from '@controllers';

const router = Router();

router.get('/', StageController.get);

export default router;
