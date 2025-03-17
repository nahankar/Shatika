import express from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { upload } from '../utils/cloudinary';

const router = express.Router();

// Public routes - only for getting categories
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin dashboard routes - protected
router.use(protect);
router.use(restrictTo('admin'));

router.route('/categories')
  .get(getCategories)
  .post(upload.single('image'), createCategory);

router.route('/categories/:id')
  .get(getCategory)
  .put(upload.single('image'), updateCategory)
  .delete(deleteCategory);

export default router; 