import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController';

const router = Router();

router.use(protect); // All cart routes require authentication

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:cartItemId', updateCartItem);
router.delete('/:cartItemId', removeFromCart);
router.delete('/', clearCart);

export default router; 