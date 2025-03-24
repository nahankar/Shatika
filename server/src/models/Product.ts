import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: mongoose.Types.ObjectId;
  material: mongoose.Types.ObjectId;
  art: mongoose.Types.ObjectId;
  tags: string[];
  images: string[];
  stock: number;
  isActive: boolean;
  showInDIY: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: [true, 'Material is required'],
    },
    art: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Art',
      required: [true, 'Art is required'],
    },
    tags: [{
      type: String,
      trim: true,
    }],
    images: [{
      type: String,
      required: [true, 'At least one product image is required'],
    }],
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
      description: 'Determines if the product is visible to users',
    },
    showInDIY: {
      type: Boolean,
      default: false,
      description: 'Determines if the product appears in DIY projects',
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search functionality
productSchema.index({ name: 'text', description: 'text', category: 'text' });

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product; 