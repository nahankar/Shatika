import express from 'express';
import { captureDesignThumbnail } from '../controllers/thumbnailController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Protect the thumbnail capture endpoint
router.use(protect);

// Thumbnail routes
router.post('/capture', captureDesignThumbnail);

export default router; 