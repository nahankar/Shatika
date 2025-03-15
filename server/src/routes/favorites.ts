import express from 'express';
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
} from '../controllers/favoriteController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All favorites routes are protected
router.use(protect);

router.get('/', getFavorites);
router.post('/', addToFavorites);
router.delete('/:productId', removeFromFavorites);

export default router; 