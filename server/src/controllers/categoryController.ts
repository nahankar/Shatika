import { Request, Response } from 'express';
import Category from '../models/Category';
import { catchAsync } from '../utils/catchAsync';

// Get all categories (public)
export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await Category.find().sort('name');
  
  // If accessed from admin dashboard, include additional information
  const isAdminDashboard = req.path.includes('/admin/dashboard');
  const response = {
    success: true,
    count: categories.length,
    data: categories,
    ...(isAdminDashboard && {
      message: 'Categories retrieved for admin dashboard',
      isAdminView: true
    })
  };

  return res.json(response);
});

// Get single category (public)
export const getCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found',
    });
  }

  // If accessed from admin dashboard, include additional information
  const isAdminDashboard = req.path.includes('/admin/dashboard');
  const response = {
    success: true,
    data: category,
    ...(isAdminDashboard && {
      message: 'Category retrieved for admin dashboard',
      isAdminView: true
    })
  };

  return res.json(response);
});

// Create category (admin only)
export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;

  const category = await Category.create({ name });

  return res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
    isAdminView: true
  });
});

// Update category (admin only)
export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found',
    });
  }

  return res.json({
    success: true,
    message: 'Category updated successfully',
    data: category,
    isAdminView: true
  });
});

// Delete category (admin only)
export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found',
    });
  }

  // Check if category is being used by any products
  const Product = require('../models/Product').default;
  const productsUsingCategory = await Product.countDocuments({ category: req.params.id });

  if (productsUsingCategory > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete category as it is being used by existing products',
      productsCount: productsUsingCategory,
    });
  }

  await category.deleteOne();

  return res.json({
    success: true,
    message: 'Category deleted successfully',
    isAdminView: true
  });
}); 