import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getFavorites, addToFavorites, removeFromFavorites } from '../controllers/favoriteController';

const router = express.Router();

router.use(protect); // All favorites routes require authentication

router.get('/', getFavorites);
router.post('/', addToFavorites);
router.delete('/:productId', removeFromFavorites);

export default router; 