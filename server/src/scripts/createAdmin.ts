import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shatika')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: 'admin@shatika.com' });
      if (existingAdmin) {
        console.log('Admin user already exists');
        process.exit(0);
      }

      // Create admin user
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@shatika.com',
        password: 'admin123',
        role: 'admin'
      });

      console.log('Admin user created successfully:', admin.email);
    } catch (error) {
      console.error('Error creating admin user:', error);
    }

    process.exit(0);
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }); 