import { Router } from 'express';
import { CollectionController } from '@controllers';

const router = Router();

// Upload collections to Qdrant
router.post('/kz_gk/upload', CollectionController.uploadKzGk);
router.post('/kz_gpk/upload', CollectionController.uploadKzGpk);
router.post(
  '/kz_civil_practice/upload',
  CollectionController.uploadKzCivilPractice,
);

export default router;
