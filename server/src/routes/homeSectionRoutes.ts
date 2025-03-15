import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { upload } from '../utils/fileStorage';
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

router.post('/', upload.single('image'), createHomeSection);
router.patch('/:id', upload.single('image'), updateHomeSection);
router.delete('/:id', deleteHomeSection);

export default router; 