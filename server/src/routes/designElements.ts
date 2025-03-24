import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { isAdmin } from '../middleware/auth';
import DesignElement from '../models/DesignElement';

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all design elements
router.get('/', async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const elements = await DesignElement.find();
    if (!elements) {
      return res.status(404).json({ 
        success: false, 
        message: 'No design elements found' 
      });
    }
    return res.json({ success: true, data: elements });
  } catch (error) {
    console.error('Error in GET /design-elements:', error);
    // Check for specific MongoDB errors
    if (error instanceof Error) {
      if (error.name === 'MongoServerError') {
        return res.status(500).json({
          success: false,
          message: 'Database error',
          error: error.message
        });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.message
        });
      }
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching design elements',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new design element
router.post('/', isAdmin, upload.single('image'), async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, artType, isActive } = req.body;
    const image = `/uploads/${req.file?.filename}`;

    const element = new DesignElement({
      name,
      artType,
      image,
      isActive: isActive === 'true'
    });

    await element.save();
    return res.status(201).json({ success: true, data: element });
  } catch (error) {
    console.error('Error creating design element:', error);
    return res.status(400).json({ 
      success: false, 
      message: 'Error creating design element',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a design element
router.put('/:id', isAdmin, upload.single('image'), async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, artType, isActive } = req.body;
    const update: any = {
      name,
      artType,
      isActive: isActive === 'true'
    };

    if (req.file) {
      update.image = `/uploads/${req.file.filename}`;
    }

    const element = await DesignElement.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!element) {
      return res.status(404).json({ success: false, message: 'Design element not found' });
    }

    return res.json({ success: true, data: element });
  } catch (error) {
    console.error('Error updating design element:', error);
    return res.status(400).json({ 
      success: false, 
      message: 'Error updating design element',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Toggle design element status
router.patch('/:id/toggle', isAdmin, async (req: Request, res: Response): Promise<Response> => {
  try {
    const { isActive } = req.body;
    const element = await DesignElement.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!element) {
      return res.status(404).json({ success: false, message: 'Design element not found' });
    }

    return res.json({ success: true, data: element });
  } catch (error) {
    console.error('Error toggling design element status:', error);
    return res.status(400).json({ 
      success: false, 
      message: 'Error toggling design element status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a design element
router.delete('/:id', isAdmin, async (req: Request, res: Response): Promise<Response> => {
  try {
    const element = await DesignElement.findByIdAndDelete(req.params.id);
    
    if (!element) {
      return res.status(404).json({ success: false, message: 'Design element not found' });
    }

    return res.json({ success: true, data: element });
  } catch (error) {
    console.error('Error deleting design element:', error);
    return res.status(400).json({ 
      success: false, 
      message: 'Error deleting design element',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 