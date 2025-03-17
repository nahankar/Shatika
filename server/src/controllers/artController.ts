import { Request, Response } from 'express';
import Art from '../models/Art';
import path from 'path';

// Get all arts (public)
export const getArts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const arts = await Art.find().sort('name');
    
    res.status(200).json({
      success: true,
      count: arts.length,
      data: arts
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching arts',
      error: error.message
    });
  }
};

// Get single art (public)
export const getArt = async (req: Request, res: Response): Promise<void> => {
  try {
    const art = await Art.findById(req.params.id).populate('products');
    
    if (!art) {
      res.status(404).json({
        success: false,
        message: 'Art not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: art
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching art',
      error: error.message
    });
  }
};

// Create art (admin only)
export const createArt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    let imageUrl = req.body.imageUrl;
    let imagePath = '';

    // Handle file upload if present
    if (req.file) {
      // Get the relative path from the uploads directory
      imagePath = path.relative(
        path.join(process.cwd(), 'uploads'),
        req.file.path
      );
      // Set the public URL
      imageUrl = `/uploads/${imagePath}`;
    }

    if (!imageUrl || !imagePath) {
      res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
      return;
    }

    // Check if art with same name exists
    const existingArt = await Art.findOne({ name: name.trim() });
    if (existingArt) {
      res.status(400).json({
        success: false,
        message: 'Art with this name already exists'
      });
      return;
    }

    const art = await Art.create({
      name: name.trim(),
      description: description.trim(),
      imageUrl,
      imagePath
    });

    res.status(201).json({
      success: true,
      message: 'Art created successfully',
      data: art
    });
  } catch (error: any) {
    console.error('Error creating art:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating art',
      error: error.message
    });
  }
};

// Update art (admin only)
export const updateArt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    let updateData: any = {
      name: name?.trim(),
      description: description?.trim()
    };

    // Handle file upload if present
    if (req.file) {
      // Get the relative path from the uploads directory
      const imagePath = path.relative(
        path.join(process.cwd(), 'uploads'),
        req.file.path
      );
      // Set the public URL
      updateData.imageUrl = `/uploads/${imagePath}`;
      updateData.imagePath = imagePath;
    } else if (req.body.imageUrl) {
      // If imageUrl is provided without a file, ensure imagePath is also set
      updateData.imageUrl = req.body.imageUrl;
      // Extract imagePath from imageUrl
      updateData.imagePath = req.body.imageUrl.replace('/uploads/', '');
    }

    // Check if art with same name exists (excluding current art)
    if (name) {
      const existingArt = await Art.findOne({
        name: name.trim(),
        _id: { $ne: req.params.id }
      });
      if (existingArt) {
        res.status(400).json({
          success: false,
          message: 'Art with this name already exists'
        });
        return;
      }
    }

    const art = await Art.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!art) {
      res.status(404).json({
        success: false,
        message: 'Art not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Art updated successfully',
      data: art
    });
  } catch (error: any) {
    console.error('Error updating art:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating art',
      error: error.message
    });
  }
};

// Delete art (admin only)
export const deleteArt = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if art exists and select imagePath
    const art = await Art.findById(req.params.id).select('+imagePath');
    if (!art) {
      res.status(404).json({
        success: false,
        message: 'Art not found'
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
        productsCount: productsUsingArt
      });
      return;
    }

    await art.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Art deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting art',
      error: error.message
    });
  }
}; 