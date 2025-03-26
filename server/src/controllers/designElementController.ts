import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import DesignElement from '../models/DesignElement';
import cloudinary from '../config/cloudinary';

// Get all design elements
export const getDesignElements = async (_req: Request, res: Response): Promise<void> => {
  try {
    const elements = await DesignElement.find();
    res.json({
      success: true,
      data: elements,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching design elements',
      error: error.message,
    });
  }
};

// Create design element
export const createDesignElement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, artType } = req.body;

    if (!name || !artType) {
      res.status(400).json({
        success: false,
        message: 'Name and art type are required',
      });
      return;
    }

    if (!req.files?.image || Array.isArray(req.files.image)) {
      res.status(400).json({
        success: false,
        message: 'Single image file is required',
      });
      return;
    }

    const imageFile = req.files.image as UploadedFile;
    const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
      folder: 'shatika',
      resource_type: 'auto',
    });

    const element = await DesignElement.create({
      name,
      artType,
      image: result.secure_url,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: element,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating design element',
      error: error.message,
    });
  }
};

// Update design element
export const updateDesignElement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, artType, isActive } = req.body;
    const updateData: any = { name, artType, isActive };

    if (req.files?.image && !Array.isArray(req.files.image)) {
      const imageFile = req.files.image as UploadedFile;
      const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
        folder: 'shatika',
        resource_type: 'auto',
      });
      updateData.image = result.secure_url;
    }

    const element = await DesignElement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!element) {
      res.status(404).json({
        success: false,
        message: 'Design element not found',
      });
      return;
    }

    res.json({
      success: true,
      data: element,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating design element',
      error: error.message,
    });
  }
};

// Delete design element
export const deleteDesignElement = async (req: Request, res: Response): Promise<void> => {
  try {
    const element = await DesignElement.findById(req.params.id);

    if (!element) {
      res.status(404).json({
        success: false,
        message: 'Design element not found',
      });
      return;
    }

    // Extract public_id from Cloudinary URL
    if (element.image) {
      const publicId = element.image.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`shatika/${publicId}`);
      }
    }

    await element.deleteOne();

    res.json({
      success: true,
      message: 'Design element deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting design element',
      error: error.message,
    });
  }
}; 