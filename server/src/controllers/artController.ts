import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import Art from '../models/Art';
import cloudinary from '../config/cloudinary';

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

    if (!name || !description) {
      res.status(400).json({
        success: false,
        message: 'Name and description are required',
      });
      return;
    }

    if (!req.files?.image || Array.isArray(req.files.image)) {
      res.status(400).json({
        success: false,
        message: 'Image is required',
      });
      return;
    }

    const file = req.files.image as UploadedFile;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'shatika',
      resource_type: 'auto',
    });

    const art = await Art.create({
      name,
      description,
      imageUrl: result.secure_url,
      imagePath: result.public_id,
    });

    res.status(201).json({
      success: true,
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
    const updateData: any = { name, description };

    if (req.files?.image && !Array.isArray(req.files.image)) {
      const file = req.files.image as UploadedFile;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'shatika',
        resource_type: 'auto',
      });
      updateData.imageUrl = result.secure_url;
      updateData.imagePath = result.public_id;
    }

    const art = await Art.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
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
      data: art
    });
  } catch (error: any) {
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
    const art = await Art.findById(req.params.id);

    if (!art) {
      res.status(404).json({
        success: false,
        message: 'Art not found',
      });
      return;
    }

    // Delete image from Cloudinary
    if (art.imagePath) {
      await cloudinary.uploader.destroy(art.imagePath);
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