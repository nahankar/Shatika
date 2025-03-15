import { Request, Response } from 'express';
import Product from '../models/Product';

// Get all products
export const getProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('material', 'name')
      .populate('art', 'name');
    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message,
    });
  }
};

// Get single product
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('material', 'name')
      .populate('art', 'name');
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }
    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message,
    });
  }
};

// Create product
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, material, art } = req.body;
    let tags = [];
    
    // Parse tags if they exist
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
      } catch (e) {
        console.error('Error parsing tags:', e);
      }
    }

    // Validate required fields
    if (!name || !description || !price || !category || !material || !art) {
      res.status(400).json({
        success: false,
        message: 'All fields (name, description, price, category, material, art) are required',
      });
      return;
    }

    // Handle file uploads
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one image is required',
      });
      return;
    }

    // Get file paths for uploaded images with full URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrls = (req.files as Express.Multer.File[]).map(
      file => `${baseUrl}/uploads/${file.filename}`
    );

    // Create product with image URLs
    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      material,
      art,
      tags,
      images: imageUrls,
    });

    // Populate category and material fields in the response
    await product.populate(['category', 'material', 'art']);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Product creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message,
    });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Update product request body:', req.body);
    console.log('Update product files:', req.files);
    console.log('Update product params:', req.params);

    const { name, description, price, category, material, art } = req.body;
    console.log('Destructured fields:', { name, description, price, category, material, art });
    
    let tags: string[] = [];
    let imageUrls: string[] = [];
    
    // Parse tags if they exist
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
        console.log('Parsed tags:', tags);
      } catch (e) {
        console.error('Error parsing tags:', e);
        tags = [];
      }
    }

    // Validate required fields
    if (!name || !description || !price || !category || !material || !art) {
      console.log('Missing required fields:', {
        name: !name,
        description: !description,
        price: !price,
        category: !category,
        material: !material,
        art: !art
      });
      res.status(400).json({
        success: false,
        message: 'All fields (name, description, price, category, material, art) are required',
      });
      return;
    }

    // Get existing product
    const existingProduct = await Product.findById(req.params.id);
    console.log('Existing product:', existingProduct);
    
    if (!existingProduct) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    // Handle images
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // If new images are uploaded
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrls = (req.files as Express.Multer.File[]).map(
        file => `${baseUrl}/uploads/${file.filename}`
      );
      console.log('New image URLs:', imageUrls);
    }

    // Handle existing images
    if (req.body.existingImages) {
      try {
        const existingImages = JSON.parse(req.body.existingImages) as string[];
        console.log('Existing images from request:', existingImages);
        
        // If we have both new and existing images, combine them
        if (imageUrls.length > 0) {
          imageUrls = [...imageUrls, ...existingImages];
        } else {
          // If no new images, use existing ones
          imageUrls = existingImages;
        }
      } catch (e) {
        console.error('Error parsing existing images:', e);
        // If parsing fails and no new images, keep current images
        if (imageUrls.length === 0) {
          imageUrls = existingProduct.images || [];
        }
      }
    } else if (imageUrls.length === 0) {
      // If no new images and no existing images specified, keep current images
      imageUrls = existingProduct.images || [];
    }

    const updateData = {
      name,
      description,
      price: Number(price),
      category,
      material,
      art,
      tags,
      images: imageUrls,
    };

    console.log('Final update data:', updateData);

    // Update product with new data
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('category', 'name')
      .populate('material', 'name')
      .populate('art', 'name');

    console.log('Updated product:', product);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found during update',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Product update error details:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message,
    });
  }
}; 