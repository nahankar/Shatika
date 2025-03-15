import express from 'express';
import { getArts, createArt, updateArt, deleteArt } from '../controllers/artController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { upload } from '../utils/fileStorage';

const router = express.Router();

// Public routes
router.get('/', getArts);

// Protected routes (admin only)
router.post('/', protect, restrictTo('admin'), upload.single('image'), createArt);
router.patch('/:id', protect, restrictTo('admin'), upload.single('image'), updateArt);
router.delete('/:id', protect, restrictTo('admin'), deleteArt);

export default router; 