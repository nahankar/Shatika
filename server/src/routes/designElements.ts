import express from 'express';
import {
  getDesignElements,
  createDesignElement,
  updateDesignElement,
  deleteDesignElement,
  toggleStatus,
} from '../controllers/designElementController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getDesignElements);

// Protected routes (admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', createDesignElement);
router.put('/:id', updateDesignElement);
router.patch('/:id/toggle', toggleStatus);
router.delete('/:id', deleteDesignElement);

export default router; 