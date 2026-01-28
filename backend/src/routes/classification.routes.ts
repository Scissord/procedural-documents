import { Router } from 'express';
import { ClassificationController } from '@controllers';
import { auth } from '@middlewares';

const router = Router();

router.get('/', auth, ClassificationController.get);

export default router;
