import { Request, Response } from 'express';
import Art from '../models/Art';

// Get all arts (public)
export const getArts = async (req: Request, res: Response): Promise<void> => {
  try {
    const arts = await Art.find().sort('name');
    
    // If accessed from admin dashboard, include additional information
    const isAdminDashboard = req.path.includes('/admin/dashboard');
    const response = {
      success: true,
      count: arts.length,
      data: arts,
      ...(isAdminDashboard && {
        message: 'Arts retrieved for admin dashboard',
        isAdminView: true
      })
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching arts',
      error: error.message,
    });
  }
};

// Get single art (public)
export const getArt = async (req: Request, res: Response): Promise<void> => {
  try {
    const art = await Art.findById(req.params.id);
    if (!art) {
      res.status(404).json({
        success: false,
        message: 'Art not found',
      });
      return;
    }

    res.json({
      success: true,
      data: art,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching art',
      error: error.message,
    });
  }
};

// Create art (admin only)
export const createArt = async (req: Request, res: Response): Promise<void> => {
  try {
    let imageUrl = '';
    
    if (req.file) {
      // If file was uploaded
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      // If URL was provided
      imageUrl = req.body.imageUrl;
    } else {
      throw new Error('Either image file or URL must be provided');
    }

    const { name, description } = req.body;

    const art = await Art.create({
      name,
      description,
      imageUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Art created successfully',
      data: art,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating art',
      error: error.message,
    });
  }
};

// Update art (admin only)
export const updateArt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    let updateData: any = { name, description };

    if (req.file) {
      // If new file was uploaded
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      // If new URL was provided
      updateData.imageUrl = req.body.imageUrl;
    }

    const art = await Art.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!art) {
      res.status(404).json({
        success: false,
        message: 'Art not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Art updated successfully',
      data: art,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating art',
      error: error.message,
    });
  }
};

// Delete art (admin only)
export const deleteArt = async (req: Request, res: Response): Promise<void> => {
  try {
    const art = await Art.findByIdAndDelete(req.params.id);

    if (!art) {
      res.status(404).json({
        success: false,
        message: 'Art not found',
      });
      return;
    }

    // Check if art is being used by any products
    const Product = require('../models/Product').default;
    const productsUsingArt = await Product.countDocuments({ art: req.params.id });

    if (productsUsingArt > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete art as it is being used by existing products',
        productsCount: productsUsingArt,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Art deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting art',
      error: error.message,
    });
  }
}; 