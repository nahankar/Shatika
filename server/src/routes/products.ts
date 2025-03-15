import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { protect, restrictTo } from '../middleware/auth';
import { upload } from '../utils/fileStorage';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected admin routes
router.post('/', protect, restrictTo('admin'), upload.array('images'), createProduct);

// Handle both PUT and PATCH for updates
router.route('/:id')
  .put(protect, restrictTo('admin'), upload.array('images'), updateProduct)
  .patch(protect, restrictTo('admin'), upload.array('images'), updateProduct)
  .delete(protect, restrictTo('admin'), deleteProduct);

export default router;