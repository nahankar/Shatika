import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import {
  getHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
} from '../controllers/homeSectionController';

const router = express.Router();

router.get('/', getHomeSections);

router.use(protect);
router.use(restrictTo('admin'));

router.post('/', createHomeSection);
router.patch('/:id', updateHomeSection);
router.delete('/:id', deleteHomeSection);

export default router; 