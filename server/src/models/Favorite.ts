import mongoose from 'mongoose';

export interface IFavorite {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
}

export interface IFavoriteDocument extends IFavorite, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only favorite a product once
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.model<IFavoriteDocument>('Favorite', favoriteSchema); 