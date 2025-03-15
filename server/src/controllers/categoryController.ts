import { Request, Response } from 'express';
import Category from '../models/Category';

// Get all categories (public)
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
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

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message,
    });
  }
};

// Get single category (public)
export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
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

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message,
    });
  }
};

// Create category (admin only)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    const category = await Category.create({ name });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
      isAdminView: true
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message,
    });
  }
};

// Update category (admin only)
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
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
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
      isAdminView: true
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message,
    });
  }
};

// Delete category (admin only)
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    // Check if category is being used by any products
    const Product = require('../models/Product').default;
    const productsUsingCategory = await Product.countDocuments({ category: req.params.id });

    if (productsUsingCategory > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete category as it is being used by existing products',
        productsCount: productsUsingCategory,
      });
      return;
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully',
      isAdminView: true
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message,
    });
  }
}; 