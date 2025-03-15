import mongoose from 'mongoose';

export interface ICategory {
  name: string;
}

export interface ICategoryDocument extends ICategory, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICategoryDocument>('Category', categorySchema); 