import express from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes - only for getting categories
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin dashboard routes - protected
router.use(protect);
router.use(restrictTo('admin'));

router.route('/admin/dashboard/categories')
  .get(getCategories)  // Get all categories in admin dashboard
  .post(createCategory);  // Create new category

router.route('/admin/dashboard/categories/:id')
  .patch(updateCategory)  // Update category
  .delete(deleteCategory);  // Delete category

export default router; 