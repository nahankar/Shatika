import mongoose, { Document, Schema, CallbackWithoutResultAndOptionalError } from 'mongoose';
import fs from 'fs';
import path from 'path';

export interface IArt extends Document {
  name: string;
  description: string;
  imageUrl: string;  // This will be set by the server after file upload
  imagePath: string; // Internal storage path
  createdAt: Date;
  updatedAt: Date;
}

const artSchema = new Schema<IArt>(
  {
    name: {
      type: String,
      required: [true, 'Art name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Art name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Art description is required'],
      trim: true,
      maxlength: [1000, 'Art description cannot exceed 1000 characters']
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    imagePath: {
      type: String,
      required: true,
      trim: true,
      select: false // This field won't be returned in queries by default
    }
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(_doc, ret) {
        // Remove sensitive fields when converting to JSON
        delete ret.imagePath;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Add index for better query performance
artSchema.index({ name: 1 });

// Virtual for products using this art
artSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'art'
});

// Pre-save middleware to ensure imageUrl is properly formatted
artSchema.pre('save', function(next: CallbackWithoutResultAndOptionalError) {
  // If imagePath is modified, update imageUrl
  if (this.isModified('imagePath')) {
    // Convert internal path to public URL
    // This assumes your server is set up to serve files from the uploads directory
    this.imageUrl = `/uploads/arts/${this.imagePath.split('/').pop()}`;
  }
  next();
});

// Pre-remove middleware to check for product references
artSchema.pre('deleteOne', { document: true, query: false }, async function(next: CallbackWithoutResultAndOptionalError) {
  try {
    // Check if any products are using this art
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ art: this._id });
    
    if (productCount > 0) {
      throw new Error('Cannot delete art as it is being used by existing products');
    }

    // If no products are using this art, delete the physical image file
    if (this.imagePath) {
      const imagePath = path.join(process.cwd(), 'uploads', 'arts', path.basename(this.imagePath));
      
      // Check if file exists before trying to delete
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Failed to delete art'));
  }
});

const Art = mongoose.model<IArt>('Art', artSchema);

export default Art; 