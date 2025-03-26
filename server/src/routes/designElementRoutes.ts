import express from 'express';
import {
  getDesignElements,
  createDesignElement,
  updateDesignElement,
  deleteDesignElement,
} from '../controllers/designElementController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getDesignElements);

// Protected routes (admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', createDesignElement);
router.patch('/:id', updateDesignElement);
router.delete('/:id', deleteDesignElement);

export default router; 