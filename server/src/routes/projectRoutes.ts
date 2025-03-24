import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../utils/fileStorage';

const router = express.Router();

// Public routes
router.get('/', getProjects);
router.get('/:id', getProject);

// Protected routes
router.post('/', protect, upload.single('fabricImage'), createProject);
router.put('/:id', protect, upload.single('fabricImage'), updateProject);
router.delete('/:id', protect, deleteProject);

export default router; 