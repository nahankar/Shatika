import { Request, Response } from 'express';
import User from '../models/User';
import Product from '../models/Product';
import { catchAsync } from '../utils/catchAsync';

export const getFavorites = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  
  const user = await User.findById(userId).populate({
    path: 'favorites',
    populate: [
      { path: 'category', select: 'name' },
      { path: 'material', select: 'name' },
      { path: 'art', select: 'name' }
    ]
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: user.favorites
  });
});

export const addToFavorites = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.favorites.includes(productId)) {
    user.favorites.push(productId);
    await user.save();
  }

  return res.status(200).json({
    success: true,
    message: 'Product added to favorites'
  });
});

export const removeFromFavorites = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { productId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.favorites = user.favorites.filter(id => id.toString() !== productId);
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Product removed from favorites'
  });
}); 