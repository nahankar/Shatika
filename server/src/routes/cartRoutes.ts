import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController';

const router = express.Router();

router.use(protect); // All cart routes require authentication

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.delete('/', clearCart);

export default router; 