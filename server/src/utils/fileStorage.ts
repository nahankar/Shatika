import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // Determine the appropriate subdirectory based on the fieldname
    let uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create subdirectory for art images
    if (file.fieldname === 'image') {
      uploadDir = path.join(uploadDir, 'arts');
    }
    
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function to accept only images
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Export multer upload configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Function to handle file upload and return the file URL
export const uploadToStorage = async (file: Express.Multer.File): Promise<string> => {
  try {
    // The file is already saved by multer, we just need to return the URL
    const relativePath = path.relative(
      path.join(process.cwd(), 'uploads'),
      file.path
    );
    
    // Return the URL that can be used to access the file
    return `/uploads/${relativePath}`;
  } catch (error) {
    console.error('Error in uploadToStorage:', error);
    throw new Error('File upload failed');
  }
}; 