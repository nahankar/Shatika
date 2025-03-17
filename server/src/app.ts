import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { protect, restrictTo } from './middleware/authMiddleware';

// Import routes
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categoryRoutes';
import materialRoutes from './routes/materialRoutes';
import artRoutes from './routes/artRoutes';
import homeSectionRoutes from './routes/homeSectionRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import cartRoutes from './routes/cartRoutes';
import authRoutes from './routes/auth';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/arts', artRoutes);
app.use('/api/home-sections', homeSectionRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/cart', cartRoutes);

// Error handling middleware
// Admin dashboard routes
app.use('/api/v1/admin/dashboard', protect, restrictTo('admin'));

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'File too large',
        error: 'File size should be less than 5MB'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message
      });
    }
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: err.message
    });
    return;
  }

  // Handle file type errors
  if (err.message === 'Only image files are allowed!') {
    res.status(400).json({
      success: false,
      message: 'Invalid file type',
      error: 'Please upload only image files'
    });
    return;
  }

  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app; 