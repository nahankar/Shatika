import { Request, Response } from 'express';
import Project from '../models/Project';
const asyncHandler = require('express-async-handler');
import path from 'path';
import fs from 'fs';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
export const getProjects = asyncHandler(async (_req: Request, res: Response) => {
  const projects = await Project.find().sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects
  });
});

// @desc    Get a single project
// @route   GET /api/projects/:id
// @access  Public
export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id)
    .populate('selectedProductId')
    .lean();
  
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  
  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, fabricCategory, selectedProductId, materialId, materialName } = req.body;
    
    // Handle file upload if present
    let fabricImage = '';
    if (req.file) {
      fabricImage = `/uploads/${req.file.filename}`;
    }
    
    // If no file was uploaded but selectedProductId exists, use that
    // Create the project with all available data
    const newProject = new Project({
      name,
      description,
      fabricCategory,
      materialId,
      materialName,
      fabricImage,
      user: req.user._id,
      selectedProductId: selectedProductId || null,
    });
    
    // Save the project
    const savedProject = await newProject.save();
    
    // Populate the selectedProduct field if it exists
    const populatedProject = await Project.findById(savedProject._id)
      .populate('selectedProductId')
      .exec();
    
    return res.status(201).json({
      success: true,
      data: populatedProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  let project = await Project.findById(req.params.id);
  
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  
  // Check if user owns the project or is admin
  if (project.user && project.user.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
    res.status(403);
    throw new Error('User not authorized to update this project');
  }
  
  // Process file upload if present
  let fabricImage = project.fabricImage;
  
  if (req.file) {
    // Delete old image if exists
    if (project.fabricImage) {
      const oldImagePath = path.join(__dirname, '..', '..', 'uploads', project.fabricImage.replace('/uploads/', ''));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    fabricImage = `/uploads/${req.file.filename}`;
  }
  
  // Update project
  project = await Project.findByIdAndUpdate(
    req.params.id, 
    { 
      name: req.body.name,
      description: req.body.description,
      fabricCategory: req.body.fabricCategory,
      materialId: req.body.materialId || project.materialId,
      materialName: req.body.materialName || project.materialName,
      fabricImage,
      designData: req.body.designData || project.designData, // Keep existing designData if not provided
      selectedProductId: req.body.selectedProductId || project.selectedProductId,
    },
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  
  // Check if user owns the project or is admin
  if (project.user && project.user.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
    res.status(403);
    throw new Error('User not authorized to delete this project');
  }
  
  // Delete image if exists
  if (project.fabricImage) {
    const imagePath = path.join(__dirname, '..', '..', 'public', project.fabricImage);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  
  await Project.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

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