import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import fileUpload from 'express-fileupload';
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
import designElementsRouter from './routes/designElements';
import projectRoutes from './routes/projectRoutes';
import thumbnailRoutes from './routes/thumbnailRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5001', 'https://shatika.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Configure express-fileupload
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  abortOnLimit: true,
  responseOnLimit: 'File size limit has been reached (50MB)',
  createParentPath: true,
  debug: process.env.NODE_ENV === 'development',
}));

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
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
app.use('/api/design-elements', designElementsRouter);
app.use('/api/projects', projectRoutes);
app.use('/api/thumbnails', thumbnailRoutes);

// Admin dashboard routes
app.use('/api/v1/admin/dashboard', protect, restrictTo('admin'));

// Error handling middleware (single instance)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);

  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      message: 'File too large',
      error: 'File size should be less than 50MB'
    });
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