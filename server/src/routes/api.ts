import express from 'express';
import { captureDesignThumbnail } from '../controllers/thumbnailController';

const router = express.Router();

router.post('/thumbnails/capture', captureDesignThumbnail);

export default router; 