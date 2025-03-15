import { Request, Response } from 'express';
import Material from '../models/Material';

// Get all materials (public)
export const getMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const materials = await Material.find().sort('name');
    
    // If accessed from admin dashboard, include additional information
    const isAdminDashboard = req.path.includes('/admin/dashboard');
    const response = {
      success: true,
      count: materials.length,
      data: materials,
      ...(isAdminDashboard && {
        message: 'Materials retrieved for admin dashboard',
        isAdminView: true
      })
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching materials',
      error: error.message,
    });
  }
};

// Get single material (public)
export const getMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      res.status(404).json({
        success: false,
        message: 'Material not found',
      });
      return;
    }

    // If accessed from admin dashboard, include additional information
    const isAdminDashboard = req.path.includes('/admin/dashboard');
    const response = {
      success: true,
      data: material,
      ...(isAdminDashboard && {
        message: 'Material retrieved for admin dashboard',
        isAdminView: true
      })
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching material',
      error: error.message,
    });
  }
};

// Create material (admin only)
export const createMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    const material = await Material.create({ name });

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: material,
      isAdminView: true
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating material',
      error: error.message,
    });
  }
};

// Update material (admin only)
export const updateMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { name },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!material) {
      res.status(404).json({
        success: false,
        message: 'Material not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Material updated successfully',
      data: material,
      isAdminView: true
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating material',
      error: error.message,
    });
  }
};

// Delete material (admin only)
export const deleteMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      res.status(404).json({
        success: false,
        message: 'Material not found',
      });
      return;
    }

    // Check if material is being used by any products
    const Product = require('../models/Product').default;
    const productsUsingMaterial = await Product.countDocuments({ material: req.params.id });

    if (productsUsingMaterial > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete material as it is being used by existing products',
        productsCount: productsUsingMaterial,
      });
      return;
    }

    await material.deleteOne();

    res.json({
      success: true,
      message: 'Material deleted successfully',
      isAdminView: true
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting material',
      error: error.message,
    });
  }
}; 