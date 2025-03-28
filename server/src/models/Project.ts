import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  fabricCategory: string;
  materialId?: string;
  materialName?: string;
  fabricImage?: string;
  designThumbnail?: string; // Design thumbnail image
  designData?: string; // JSON string containing design information
  user: mongoose.Types.ObjectId;
  selectedProductId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
    },
    fabricCategory: {
      type: String,
      required: [true, 'Fabric category is required'],
    },
    materialId: {
      type: String,
    },
    materialName: {
      type: String,
    },
    fabricImage: {
      type: String,
    },
    designThumbnail: {
      type: String,
    },
    designData: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    selectedProductId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', projectSchema); 