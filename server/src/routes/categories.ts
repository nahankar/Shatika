import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getCategories);

// Protected routes (admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', createCategory);
router.route('/:id')
  .put(updateCategory)
  .patch(updateCategory)
  .delete(deleteCategory);

export default router; 