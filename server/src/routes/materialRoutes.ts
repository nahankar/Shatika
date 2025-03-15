import express from 'express';
import {
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '../controllers/materialController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes - only for getting materials
router.get('/', getMaterials);
router.get('/:id', getMaterial);

// Admin routes - protected
router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
  .post(createMaterial);

router.route('/:id')
  .patch(updateMaterial)
  .delete(deleteMaterial);

export default router; 