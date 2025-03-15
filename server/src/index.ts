import dotenv from 'dotenv';
import { connectDB } from './config/db';
import app from './app';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const port = process.env.PORT || 5001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});