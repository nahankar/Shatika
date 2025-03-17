import { Request, Response } from 'express';
import User, { ICartItemBase, CartItemType } from '../models/User';
import Product from '../models/Product';
import { catchAsync } from '../utils/catchAsync';
import { Types } from 'mongoose';

export const getCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  
  const user = await User.findById(userId).populate({
    path: 'cart.product',
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
    data: user.cart
  });
});

export const addToCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { productId, quantity, size, color } = req.body;

  console.log('Adding to cart:', {
    userId,
    productId,
    quantity,
    size,
    color
  });

  if (!productId || !quantity) {
    return res.status(400).json({
      success: false,
      message: 'Product ID and quantity are required'
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

  console.log('Current cart:', user.cart.map(item => ({
    _id: item._id.toString(),
    product: item.product.toString(),
    quantity: item.quantity
  })));

  const cartItem: ICartItemBase = {
    product: new Types.ObjectId(productId),
    quantity,
    size,
    color
  };

  const existingItemIndex = user.cart.findIndex(
    (item: CartItemType) => item.product.toString() === productId &&
    item.size === size &&
    item.color === color
  );

  if (existingItemIndex > -1) {
    console.log('Updating existing cart item:', {
      index: existingItemIndex,
      item: user.cart[existingItemIndex]
    });
    user.cart[existingItemIndex].quantity += quantity;
  } else {
    const newCartItem: CartItemType = {
      ...cartItem,
      _id: new Types.ObjectId()
    };
    console.log('Adding new cart item:', newCartItem);
    user.cart.push(newCartItem);
  }

  console.log('Cart after update:', user.cart.map(item => ({
    _id: item._id.toString(),
    product: item.product.toString(),
    quantity: item.quantity
  })));

  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Product added to cart'
  });
});

export const updateCartItem = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  console.log('Updating cart item:', {
    userId: userId?.toString(),
    cartItemId,
    quantity,
    body: req.body
  });

  if (!quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be greater than 0'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  console.log('Current cart:', user.cart.map(item => ({
    _id: item._id.toString(),
    product: item.product.toString(),
    quantity: item.quantity
  })));

  const cartItemIndex = user.cart.findIndex(
    (item) => item._id.toString() === cartItemId
  );

  if (cartItemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Cart item not found'
    });
  }

  user.cart[cartItemIndex].quantity = quantity;
  await user.save();

  console.log('Updated cart item:', {
    itemId: user.cart[cartItemIndex]._id.toString(),
    quantity: user.cart[cartItemIndex].quantity
  });

  return res.status(200).json({
    success: true,
    message: 'Cart updated successfully',
    data: user.cart[cartItemIndex]
  });
});

export const removeFromCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { cartItemId } = req.params;

  console.log('Removing cart item:', {
    userId: userId?.toString(),
    cartItemId,
    cartItemIdType: typeof cartItemId
  });

  if (!cartItemId) {
    return res.status(400).json({
      success: false,
      message: 'Cart item ID is required'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  console.log('Current cart:', user.cart.map(item => ({
    _id: item._id.toString(),
    product: item.product.toString()
  })));

  // Find the cart item before removing
  const cartItem = user.cart.find(item => item._id.toString() === cartItemId);
  if (!cartItem) {
    return res.status(404).json({
      success: false,
      message: 'Cart item not found'
    });
  }

  // Remove the item using filter instead of $pull
  user.cart = user.cart.filter(item => item._id.toString() !== cartItemId);
  await user.save();

  console.log('Cart after removal:', user.cart.map(item => ({
    _id: item._id.toString(),
    product: item.product.toString()
  })));

  return res.status(200).json({
    success: true,
    message: 'Product removed from cart'
  });
});

export const clearCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.cart = [];
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Cart cleared successfully'
  });
}); 