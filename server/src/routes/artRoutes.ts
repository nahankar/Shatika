import express from 'express';
import { getArts, createArt, updateArt, deleteArt } from '../controllers/artController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getArts);

// Protected routes (admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', createArt);
router.patch('/:id', updateArt);
router.delete('/:id', deleteArt);

export default router; 