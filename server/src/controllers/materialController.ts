import { Request, Response } from 'express';
import Material from '../models/Material';
import { catchAsync } from '../utils/catchAsync';

// Get all materials
export const getMaterials = catchAsync(async (_req: Request, res: Response) => {
  const materials = await Material.find();
  return res.status(200).json({
    success: true,
    data: materials,
  });
});

// Get material by ID
export const getMaterial = catchAsync(async (req: Request, res: Response) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found',
    });
  }
  return res.status(200).json({
    success: true,
    data: material,
  });
});

// Create material
export const createMaterial = catchAsync(async (req: Request, res: Response) => {
  const material = await Material.create(req.body);
  return res.status(201).json({
    success: true,
    data: material,
  });
});

// Update material
export const updateMaterial = catchAsync(async (req: Request, res: Response) => {
  const material = await Material.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: material,
  });
});

// Delete material
export const deleteMaterial = catchAsync(async (req: Request, res: Response) => {
  const material = await Material.findByIdAndDelete(req.params.id);

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: {},
  });
}); 