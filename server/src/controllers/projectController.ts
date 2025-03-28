import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import Project from '../models/Project';
import cloudinary from '../config/cloudinary';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// @desc    Get a single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('selectedProductId')
      .lean();
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }

    // Check if user owns the project or is admin
    if (project.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Create project route called');
    console.log('Request body:', req.body);
    console.log('Files present:', req.files ? Object.keys(req.files) : 'No files');
    
    // Process file upload if present
    let fabricImage = '';
    let designThumbnail = '';
    
    if (req.files?.fabricImage && !Array.isArray(req.files.fabricImage)) {
      console.log('Fabric image found in request');
      const file = req.files.fabricImage as UploadedFile;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'shatika',
        resource_type: 'auto',
      });
      fabricImage = result.secure_url;
      console.log('Fabric image uploaded:', fabricImage);
    }
    
    // Process design thumbnail if present
    if (req.files?.designThumbnail && !Array.isArray(req.files.designThumbnail)) {
      console.log('Design thumbnail found in request');
      const file = req.files.designThumbnail as UploadedFile;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'shatika/thumbnails',
        resource_type: 'auto',
      });
      designThumbnail = result.secure_url;
      console.log('Design thumbnail uploaded:', designThumbnail);
    }
    
    // Create new project with user ID from auth middleware
    const project = await Project.create({
      user: req.user?._id,
      name: req.body.name,
      description: req.body.description,
      fabricCategory: req.body.fabricCategory,
      materialId: req.body.materialId,
      materialName: req.body.materialName,
      designData: req.body.designData,
      selectedProductId: req.body.selectedProductId,
      fabricImage,
      designThumbnail
    });
    
    const populatedProject = await Project.findById(project._id).populate('selectedProductId');
    
    res.status(201).json({
      success: true,
      data: populatedProject
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

// @desc    Update a project
// @route   PATCH /api/projects/:id
// @access  Private
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Update project route called:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Files present:', req.files ? Object.keys(req.files) : 'No files');
    
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    // Check if user owns the project or is admin
    if (project.user && project.user.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'User not authorized to update this project'
      });
      return;
    }
    
    // Process file upload if present
    let fabricImage = project.fabricImage;
    let designThumbnail = project.designThumbnail;
    
    if (req.files?.fabricImage && !Array.isArray(req.files.fabricImage)) {
      // Delete old image from Cloudinary if exists
      if (project.fabricImage) {
        const publicId = project.fabricImage.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`shatika/${publicId}`);
        }
      }
      
      const file = req.files.fabricImage as UploadedFile;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'shatika',
        resource_type: 'auto',
      });
      fabricImage = result.secure_url;
    }
    
    // Process design thumbnail if present
    if (req.files?.designThumbnail && !Array.isArray(req.files.designThumbnail)) {
      console.log('Design thumbnail file found in request');
      // Delete old thumbnail from Cloudinary if exists
      if (project.designThumbnail) {
        const publicId = project.designThumbnail.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`shatika/thumbnails/${publicId}`);
        }
      }
      
      const file = req.files.designThumbnail as UploadedFile;
      console.log('Uploading design thumbnail to Cloudinary...');
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'shatika/thumbnails',
        resource_type: 'auto',
      });
      designThumbnail = result.secure_url;
      console.log('Design thumbnail uploaded:', designThumbnail);
    }
    
    // Create update object with only the fields that are present
    const updateData: any = {};
    
    // Update fields only if they are present in the request
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.fabricCategory) updateData.fabricCategory = req.body.fabricCategory;
    if (req.body.materialId) updateData.materialId = req.body.materialId;
    if (req.body.materialName) updateData.materialName = req.body.materialName;
    if (req.body.designData) updateData.designData = req.body.designData;
    if (req.body.selectedProductId) updateData.selectedProductId = req.body.selectedProductId;
    if (fabricImage !== project.fabricImage) updateData.fabricImage = fabricImage;
    if (designThumbnail !== project.designThumbnail) updateData.designThumbnail = designThumbnail;
    
    console.log('Update data:', updateData);
    
    // Update project with only the changed fields
    project = await Project.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true, runValidators: true }
    ).populate('selectedProductId');
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found after update'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    // Check if user owns the project or is admin
    if (project.user && project.user.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'User not authorized to delete this project'
      });
      return;
    }
    
    // Delete image from Cloudinary if exists
    if (project.fabricImage) {
      const publicId = project.fabricImage.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`shatika/${publicId}`);
      }
    }
    
    await Project.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};

// Get project by ID
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('selectedProductId')
      .lean();
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if this project belongs to the current user
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }
    
    return res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
}; 