import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import HomeSection from '../models/HomeSection';
import cloudinary from '../config/cloudinary';

// Get all home sections
export const getHomeSections = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sections = await HomeSection.find().sort('displayOrder');
    res.json({
      success: true,
      data: sections,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching home sections',
      error: error.message,
    });
  }
};

// Create home section
export const createHomeSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, name, displayOrder } = req.body;

    if (!type || !name || displayOrder === undefined) {
      res.status(400).json({
        success: false,
        message: 'All fields (type, name, displayOrder) are required',
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

    const section = await HomeSection.create({
      type,
      name,
      displayOrder,
      image: result.secure_url,
    });

    res.status(201).json({
      success: true,
      data: section,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating home section',
      error: error.message,
    });
  }
};

// Update home section
export const updateHomeSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, name, displayOrder, isActive } = req.body;
    const updateData: any = { type, name, displayOrder, isActive };

    if (req.files?.image && !Array.isArray(req.files.image)) {
      const file = req.files.image as UploadedFile;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'shatika',
        resource_type: 'auto',
      });
      updateData.image = result.secure_url;
    }

    const section = await HomeSection.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!section) {
      res.status(404).json({
        success: false,
        message: 'Home section not found',
      });
      return;
    }

    res.json({
      success: true,
      data: section,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating home section',
      error: error.message,
    });
  }
};

// Delete home section
export const deleteHomeSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const section = await HomeSection.findById(req.params.id);

    if (!section) {
      res.status(404).json({
        success: false,
        message: 'Home section not found',
      });
      return;
    }

    // Extract public_id from Cloudinary URL
    if (section.image) {
      const publicId = section.image.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`shatika/${publicId}`);
      }
    }

    await section.deleteOne();

    res.json({
      success: true,
      message: 'Home section deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting home section',
      error: error.message,
    });
  }
}; 