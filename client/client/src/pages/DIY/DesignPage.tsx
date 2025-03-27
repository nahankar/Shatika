import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import {
  Box,
  IconButton,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  Snackbar,
  Alert,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  CircularProgress,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as ResetIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Fullscreen as FullscreenIcon,
  GridOn as GridIcon,
  Star as FavoriteIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  RotateRight as RotateIcon,
  Delete as TrashIcon,
  ContentCopy as DuplicateIcon,
  Crop as CropIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import styles from './DesignPage.module.css';
import { designElementsAPI, projectsAPI, productsAPI, materialsAPI, categoriesAPI } from '../../services/api';
import { SelectChangeEvent } from '@mui/material/Select';

interface Material {
  _id: string;
  name: string;
}

interface ProductThumbnail {
  _id: string;
  name: string;
  images: string[];
  description?: string;
  price?: number;
  category?: { _id: string; name: string } | string;
  material?: { _id: string; name: string } | string;
  materialType?: string;
  materials?: Array<{ _id: string; name: string } | string>;
  materialInfo?: string;
  showInDIY?: boolean;
}

interface DesignPageProps {
  projectId?: string;
  projectData?: any;
}

interface DesignShape {
  id: string;
  name: string;
  artType: string;
  isActive: boolean;
  render: (color: string) => React.ReactNode;
}

interface PlacedShape extends DesignShape {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  cropSettings?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface DesignState {
  'Body': PlacedShape[];
}

interface DragItem {
  shape: PlacedShape;
  fromArea: string;
}

// Additional function to fetch product data when we only have the ID
const fetchProductData = async (productId: string) => {
  try {
    console.log('Fetching product data for ID:', productId);
    const response = await productsAPI.getById(productId);
    if (response.data && response.data.success) {
      console.log('Product data fetched successfully:', response.data.data);
      return response.data.data;
    } else {
      console.error('Failed to fetch product data:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error fetching product data:', error);
    return null;
  }
};

const DesignPage: React.FC<DesignPageProps> = ({ projectId, projectData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('#666666');
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [colorPage, setColorPage] = useState(0);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [undoStack, setUndoStack] = useState<DesignState[]>([]);
  const [redoStack, setRedoStack] = useState<DesignState[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const dragItemRef = useRef<DragItem | null>(null);

  // Add state for selected material ID
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');

  // Separate placed shapes for each area - keep only Body
  const [bodyShapes, setBodyShapes] = useState<PlacedShape[]>([]);
  const [draggedShape, setDraggedShape] = useState<DesignShape | null>(null);

  // Extended color palette with 12 colors per page (6x2)
  const allColors = [
    // Page 1
    [
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
      '#000000', '#FFFFFF', '#808080', '#C0C0C0', '#800000', '#008000',
    ],
    // Page 2
    [
      '#000080', '#808000', '#800080', '#008080', '#FFA500', '#A52A2A',
      '#FFB6C1', '#98FB98', '#4B0082', '#FF4500', '#DA70D6', '#FA8072',
    ],
    // Page 3
    [
      '#20B2AA', '#87CEEB', '#778899', '#B8860B', '#FF69B4', '#CD853F',
      '#8B4513', '#DEB887', '#556B2F', '#483D8B', '#008B8B', '#9932CC',
    ],
  ];

  const colorPalette = allColors[colorPage];

  // Design shapes with their visual representations
  const [designShapes, setDesignShapes] = useState<DesignShape[]>([]);

  // Get the API URL from environment variables
  const API_URL = import.meta.env.VITE_API_URL;

  // Helper function to get the full image URL
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Add this state for fabric image
  const [fabricImage, setFabricImage] = useState<string>('');

  // Add state for tracking which shape is being cropped
  const [croppingShape, setCroppingShape] = useState<string | null>(null);
  
  // Add state for project information
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [fabricCategory, setFabricCategory] = useState<string>('');
  
  // Track the original product ID to detect changes
  const [originalProductId, setOriginalProductId] = useState<string | null>(null);
  
  // Confirmation dialog for fabric changes
  const [showFabricChangeDialog, setShowFabricChangeDialog] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState(false);

  // Add carousel state
  const [currentCarouselPage, setCurrentCarouselPage] = useState(0);
  
  // Add state for products
  const [diyProducts, setDiyProducts] = useState<ProductThumbnail[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Add a state to track the selected product in the carousel
  const [selectedCarouselProduct, setSelectedCarouselProduct] = useState<string | null>(null);
  
  // Thumbnails to display per page
  const thumbnailsPerPage = 5;
  
  // Navigation handlers - completely revised
  const handlePrevCarouselPage = () => {
    if (currentCarouselPage > 0) {
      setCurrentCarouselPage(prev => prev - 1);
    }
  };
  
  const handleNextCarouselPage = () => {
    const totalPages = Math.ceil(diyProducts.length / thumbnailsPerPage);
    if (currentCarouselPage < totalPages - 1) {
      setCurrentCarouselPage(prev => prev + 1);
    }
  };

  // Add a state variable to track whether we need to restore a design later
  const [pendingDesignData, setPendingDesignData] = useState<string | null>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Add state for categories
  const [categories, setCategories] = useState<Array<{_id: string; name: string}>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Add a function to fetch categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      console.log("Fetching categories...");
      const response = await categoriesAPI.getAll();
      if (response.data && response.data.success) {
        console.log("Categories fetched successfully:", response.data.data);
        setCategories(response.data.data);
      } else {
        console.log("Failed to fetch categories:", response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Add useEffect to fetch materials and categories
  useEffect(() => {
    fetchMaterials();
    fetchCategories();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoadingMaterials(true);
      console.log("Fetching materials...");
      const response = await materialsAPI.getAll();
      if (response.data && response.data.success) {
        console.log("Materials fetched successfully:", response.data.data);
        // Log full details of materials for debugging
        console.log("FULL MATERIALS LIST:", JSON.stringify(response.data.data, null, 2));
        setMaterials(response.data.data);
      } else {
        console.log("Failed to fetch materials:", response.data);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Add useEffect to log whenever fabricCategory changes
  useEffect(() => {
    console.log("Fabric category changed to:", fabricCategory);
    console.log("Available materials:", materials);
    
    // Check if the current fabricCategory is in the materials list
    const materialInList = materials.some(m => m.name === fabricCategory);
    console.log("Is fabricCategory in materials list?", materialInList);
    
    // Log each material in the list for debugging
    console.log("Materials list contents:");
    materials.forEach(m => {
      console.log(`Material: ${m.name}, ID: ${m._id}`);
    });
    
    // Check for common material names
    if (fabricCategory === "Khadi Cotton") {
      console.log("Fabric category is 'Khadi Cotton'");
    } else if (fabricCategory === "Pure Cotton") {
      console.log("Fabric category is 'Pure Cotton'");
    } else if (fabricCategory === "Silk") {
      console.log("Fabric category is 'Silk'");
    }
  }, [fabricCategory, materials]);

  useEffect(() => {
    // Fetch design elements as soon as component mounts
    fetchDesignElements();
  }, []);

  // Add this function to extract material type consistently
  const extractMaterialType = (product: any): string => {
    if (!product) return '';
    
    const materialType = 
      product.material || 
      product.materialType || 
      (product.materials && product.materials.length > 0 
        ? (typeof product.materials[0] === 'object' && 'name' in product.materials[0]
          ? product.materials[0].name 
          : product.materials[0])
        : '') || 
      (product.name && materials.find(m => product.name.includes(m.name))?.name || '');
    
    // Ensure the material type is one of the valid options
    return materials.find(m => m.name === materialType)?.name || '';
  };

  // Update material type extraction in both useEffect and handleProductSelect
  const getMaterialType = (product: any): string => {
    if (!product) return '';
    
    let materialType = '';
    
    // Case 1: Check if material is an object with name property
    if (product.material) {
      if (typeof product.material === 'object' && 'name' in product.material) {
        console.log('Found material object with name:', product.material);
        materialType = product.material.name;
      } else if (typeof product.material === 'string') {
        materialType = product.material;
      }
    }
    // Case 2: Check materialType field
    else if (product.materialType) {
      materialType = product.materialType;
    }
    // Case 3: Check materials array
    else if (product.materials && product.materials.length > 0) {
      const firstMaterial = product.materials[0];
      if (typeof firstMaterial === 'object' && 'name' in firstMaterial) {
        materialType = firstMaterial.name;
      } else if (typeof firstMaterial === 'string') {
        materialType = firstMaterial;
      }
    }

    // If no material found yet, try to extract from name
    if (!materialType && product.name) {
      if (product.name.includes('Khadi Cotton')) materialType = 'Khadi Cotton';
      else if (product.name.includes('Pure Cotton')) materialType = 'Pure Cotton';
      else if (product.name.includes('Silk')) materialType = 'Silk';
    }

    console.log('Extracted material type:', materialType, 'from product:', product);
    return materialType;
  };

  // Update the useEffect that handles project data loading
  useEffect(() => {
    if (projectData) {
      console.log("Project data loaded:", projectData);
      setProjectName(projectData.name || '');
      setProjectDescription(projectData.description || '');
      
      // Check if the project data is from Add Project page
      const isFromAddProject = !projectId || projectId.startsWith('temp-');
      console.log("Is from Add Project page:", isFromAddProject);
      
      // Handle category ID from the project data - ENSURE we get the ID not the name
      if (projectData.fabricCategory) {
        console.log("Fabric category from project data:", projectData.fabricCategory);
        
        // Check if fabricCategory is an ID (MongoDB ObjectId format)
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(projectData.fabricCategory);
        
        if (isMongoId) {
          // It's already a category ID, use directly
          const categoryId = projectData.fabricCategory;
          console.log("Using category ID directly:", categoryId);
          setProductCategory(categoryId);
        } else {
          // It's a category name, we need to find the ID
          console.log("Got category name, need to convert to ID:", projectData.fabricCategory);
          
          // Find the category ID from the name using the categories list
          if (categories.length > 0) {
            const category = categories.find(c => c.name.toLowerCase() === projectData.fabricCategory.toLowerCase());
            if (category) {
              console.log("Found category ID for name:", category._id);
              setProductCategory(category._id);
            } else {
              console.warn("Could not find category ID for name:", projectData.fabricCategory);
              // For backwards compatibility - keep the name but log a warning
              setProductCategory(projectData.fabricCategory);
            }
          } else {
            console.log("Categories not loaded yet, will set on categories load");
            // Keep the name temporarily until categories are loaded
            setProductCategory(projectData.fabricCategory);
          }
        }
      }
      
      // Direct material data from Add Project
      if (projectData.materialId) {
        console.log("Setting material ID from project data:", projectData.materialId);
        setSelectedMaterialId(projectData.materialId);
      }
      
      if (projectData.materialName) {
        console.log("Setting material name from project data:", projectData.materialName);
        setFabricCategory(projectData.materialName);
      }
      
      // CRITICAL: Set the selected carousel product ID if it exists
      if (projectData.selectedProductId) {
        const productId = typeof projectData.selectedProductId === 'object' 
          ? projectData.selectedProductId._id 
          : projectData.selectedProductId;
        
        console.log("Setting selected carousel product:", productId);
        setSelectedCarouselProduct(productId);
        setOriginalProductId(productId);
        
        // If the product is an object, we can get the fabric image directly
        if (typeof projectData.selectedProductId === 'object') {
          const product = projectData.selectedProductId;
          console.log("Product is already loaded as object:", product);
          
          // Set the fabric image from product
          if (product.images && product.images.length > 0) {
            const imagePath = product.images[0];
            const imageUrl = imagePath.startsWith('http')
              ? imagePath
              : `http://localhost:5173${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
            
            console.log("Setting fabric image from product object:", imageUrl);
            setFabricImage(imageUrl);
          }
        } else {
          // Need to fetch the product to get the image
          console.log("Fetching product data to get image:", productId);
          fetchProductData(productId).then(product => {
            if (product && product.images && product.images.length > 0) {
              const imagePath = product.images[0];
              const imageUrl = imagePath.startsWith('http')
                ? imagePath
                : `http://localhost:5173${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
              
              console.log("Setting fabric image from fetched product:", imageUrl);
              setFabricImage(imageUrl);
            }
          });
        }
      }
      
      // Also check direct fabricImage in the project data as fallback
      if (projectData.fabricImage) {
        console.log("Found fabric image directly in project data:", projectData.fabricImage);
        const imagePath = projectData.fabricImage;
        const imageUrl = imagePath.startsWith('http')
          ? imagePath
          : `http://localhost:5173${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
        
        console.log("Setting fabric image directly from project data:", imageUrl);
        setFabricImage(imageUrl);
      }
      
      // If there's design data, save it for later processing once design elements are loaded
      if (projectData.designData) {
        console.log("Found design data, saving for restoration:", projectData.designData);
        setPendingDesignData(projectData.designData);
      }
    }
  }, [projectData, categories]);

  // Add a separate useEffect that depends on both designShapes and pendingDesignData
  // This will run after design elements are loaded and there's pending design data
  useEffect(() => {
    if (pendingDesignData && designShapes.length > 0) {
      console.log("Now restoring design data with loaded design elements:", designShapes.length);
      try {
        const savedDesign = JSON.parse(pendingDesignData);
        
        // Helper function to restore render functions to shapes
        const restoreRenderFunction = (shape: any): PlacedShape => {
          // Find the matching design element to get its render function
          const designElement = designShapes.find(element => element.id === shape.id.split('-')[0]);
          
          if (!designElement) {
            console.error(`Could not find design element for shape ${shape.id}`);
            // Create a fallback render function
            return {
              ...shape,
              render: (color: string) => (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundColor: color 
                }} />
              )
            };
          }
          
          // Restore the render function from the design element
          return {
            ...shape,
            render: designElement.render
          };
        };
        
        // Load shapes for body area if they exist, restoring render functions
        if (savedDesign.body && savedDesign.body.length > 0) {
          console.log("Restoring body shapes:", savedDesign.body.length);
          setBodyShapes(savedDesign.body.map(restoreRenderFunction));
        }
        
        // Load other design settings
        if (savedDesign.isLocked !== undefined) setIsLocked(savedDesign.isLocked);
        if (savedDesign.isFavorite !== undefined) setIsFavorite(savedDesign.isFavorite);
        
        console.log('Successfully restored design data');
        
        // Clear the pending design data after restoration
        setPendingDesignData(null);
      } catch (error) {
        console.error('Error parsing saved design data:', error);
      }
    }
  }, [designShapes, pendingDesignData, materials]);

  // Add this debug useEffect to help troubleshoot
  useEffect(() => {
    console.log("Current fabric image state:", fabricImage);
  }, [fabricImage]);

  const fetchDesignElements = async () => {
    try {
      console.log("Fetching design elements from API...");
      const response = await designElementsAPI.getAll();
      if (response.data && response.data.success) {
        // Filter to only show elements that are active
        const elements = response.data.data
          .filter((element: any) => element.isActive !== false)
          .map((element: any) => ({
          id: element._id,
          name: element.name,
          artType: element.artType,
          isActive: element.isActive,
          render: (color: string) => {
            // Use the most reliable approach for coloring SVGs
            const imageUrl = getImageUrl(element.image);
            return (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative',
                backgroundColor: color !== '#FFFFFF' ? color : '#000000',
                WebkitMaskImage: `url(${imageUrl})`,
                maskImage: `url(${imageUrl})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}>
              </div>
            );
          }
        }));
        console.log(`Loaded ${elements.length} design elements from API`);
        setDesignShapes(elements);
      } else {
        console.log("No design elements found or API error");
        setDesignShapes([]);
      }
    } catch (error) {
      console.error('Error fetching design elements:', error);
      setDesignShapes([]);
    }
  };

  // Add helper functions to calculate hue rotation, saturation and brightness from hex color
  const getColorHueRotation = (hexColor: string): string => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substring(1, 3), 16) / 255;
    const g = parseInt(hexColor.substring(3, 5), 16) / 255;
    const b = parseInt(hexColor.substring(5, 7), 16) / 255;
    
    // Calculate HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    
    if (max !== min) {
      if (max === r) {
        h = 60 * (0 + (g - b) / (max - min));
      } else if (max === g) {
        h = 60 * (2 + (b - r) / (max - min));
      } else {
        h = 60 * (4 + (r - g) / (max - min));
      }
    }
    
    if (h < 0) h += 360;
    
    return `${Math.round(h)}deg`;
  };

  const getColorSaturation = (hexColor: string): string => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substring(1, 3), 16) / 255;
    const g = parseInt(hexColor.substring(3, 5), 16) / 255;
    const b = parseInt(hexColor.substring(5, 7), 16) / 255;
    
    // Calculate HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    }
    
    // Return higher saturation for more vibrant colors
    return `${Math.min(Math.round(s * 1000), 1000)}%`;
  };

  const getColorBrightness = (hexColor: string): string => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substring(1, 3), 16) / 255;
    const g = parseInt(hexColor.substring(3, 5), 16) / 255;
    const b = parseInt(hexColor.substring(5, 7), 16) / 255;
    
    // Use a relative luminance formula (simplified)
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) * 2;
    
    // Return appropriate brightness based on color intensity
    return `${Math.max(Math.min(Math.round(brightness * 100), 200), 50)}%`;
  };

  const getShapeSetterForArea = (area: string): [(shapes: PlacedShape[]) => void, PlacedShape[]] => {
    // Simplified function - only Body area exists
        return [setBodyShapes, bodyShapes];
  };

  // Add keyboard movement amount
  const KEYBOARD_MOVE_AMOUNT = 20; // Grid size for movement

  // Add keyboard event listener to the window
  React.useEffect(() => {
    const keysPressed = new Set<string>();
    let animationFrameId: number | null = null;

    const moveShape = (timestamp: number) => {
      if (!selectedShape || isLocked || keysPressed.size === 0) {
        animationFrameId = null;
        return;
      }

      const [area, indexStr] = selectedShape.split('-');
      const index = parseInt(indexStr);
      const [setShapes, shapes] = getShapeSetterForArea(area);
      const shape = shapes[index];

      if (!shape) {
        animationFrameId = null;
        return;
      }

      const container = document.querySelector(`[data-draggable-area="${area}"]`);
      if (!container) {
        animationFrameId = null;
        return;
      }

      const containerBounds = container.getBoundingClientRect();
      let newX = shape.x;
      let newY = shape.y;

      // Adjust position based on all pressed keys
      if (keysPressed.has('ArrowLeft')) newX -= KEYBOARD_MOVE_AMOUNT;
      if (keysPressed.has('ArrowRight')) newX += KEYBOARD_MOVE_AMOUNT;
      if (keysPressed.has('ArrowUp')) newY -= KEYBOARD_MOVE_AMOUNT;
      if (keysPressed.has('ArrowDown')) newY += KEYBOARD_MOVE_AMOUNT;

      // Clamp to container boundaries
      newX = Math.max(0, Math.min(containerBounds.width - shape.width, newX));
      newY = Math.max(0, Math.min(containerBounds.height - shape.height, newY));

      // Update state if position changed
      if (newX !== shape.x || newY !== shape.y) {
        setShapes(shapes.map((s, i) =>
          i === index ? { ...s, x: newX, y: newY } : s
        ));
      }

      // Continue animation
      animationFrameId = requestAnimationFrame(moveShape);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedShape || isLocked) return;

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        if (!keysPressed.has(e.key)) {
          keysPressed.add(e.key);
          if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(moveShape);
          }
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const [area, indexStr] = selectedShape.split('-');
        const index = parseInt(indexStr);
        const [_, shapes] = getShapeSetterForArea(area);
        const shape = shapes[index];
        if (shape) {
          handleShapeDelete(shape.id, area);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        keysPressed.delete(e.key);
        if (keysPressed.size === 0 && animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
          saveToHistory();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [selectedShape, isLocked, bodyShapes]);

  const handleDragStart = (shape: DesignShape | PlacedShape, fromArea?: string) => {
    if ('x' in shape && fromArea) {
      // If dragging an existing placed shape, store the reference
      dragItemRef.current = { shape: { ...shape }, fromArea }; // Create a copy of the shape
    } else {
      // If dragging a new shape from the palette, create a completely new object
      const newId = `${shape.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const shapeCopy = {
        ...shape,
        id: newId
      };
      setDraggedShape(shapeCopy);
      // Clear any existing drag reference to prevent interference
      dragItemRef.current = null;
    }
  };

  // Default shape size and calculations
  const GRID_SIZE = 20; // Size of grid cells for snapping
  const DEFAULT_SHAPE_SIZE = 80; // Default size of shapes

  const snapToGrid = (value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Calculate the appropriate size for a shape based on the drop area dimensions
  const calculateShapeSize = (areaWidth: number, areaHeight: number): number => {
    // Use a percentage of the smaller dimension, but max out at DEFAULT_SHAPE_SIZE
    const size = Math.min(Math.min(areaWidth, areaHeight) * 0.2, DEFAULT_SHAPE_SIZE);
    // Ensure it's a multiple of GRID_SIZE
    return Math.max(GRID_SIZE, snapToGrid(size));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, areaName: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the drop target's position and dimensions
    const dropTarget = e.currentTarget.getBoundingClientRect();
    const dropTargetElement = e.currentTarget as HTMLElement;
    
    // Calculate the raw position relative to the drop target
    const rawX = e.clientX - dropTarget.left;
    const rawY = e.clientY - dropTarget.top;

    // Add scroll offset
    const scrollX = dropTargetElement.scrollLeft;
    const scrollY = dropTargetElement.scrollTop;

    // Calculate appropriate shape size for this area
    const shapeSize = calculateShapeSize(dropTarget.width, dropTarget.height);

    // Calculate final position with snapping
    let x: number;
    let y: number;

    if (dragItemRef.current) {
      // For existing shapes (moving)
      x = Math.max(0, snapToGrid(rawX + scrollX));
      y = Math.max(0, snapToGrid(rawY + scrollY));
    } else {
      // For new shapes (initial placement)
      // Center the shape on the cursor by subtracting half the shape size
      const halfSize = shapeSize / 2;
      x = Math.max(0, snapToGrid(rawX - halfSize + scrollX));
      y = Math.max(0, snapToGrid(rawY - halfSize + scrollY));
    }

    // Ensure the shape stays within the bounds of the drop target
    const maxX = dropTarget.width - shapeSize;
    const maxY = dropTarget.height - shapeSize;
    x = Math.min(Math.max(0, x), maxX > 0 ? maxX : 0);
    y = Math.min(Math.max(0, y), maxY > 0 ? maxY : 0);

    if (dragItemRef.current) {
      // Moving an existing shape
      const { shape, fromArea } = dragItemRef.current;
      
      if (fromArea === areaName) {
        // If dropping in the same area, just update position
        const [setShapes, shapes] = getShapeSetterForArea(areaName);
        const updatedShapes = shapes.map(s => 
          s.id === shape.id ? { ...s, x, y } : { ...s }
        );
        setShapes(updatedShapes);
        
        const newIndex = updatedShapes.findIndex(s => s.id === shape.id);
        if (newIndex !== -1) {
          setSelectedShape(`${areaName}-${newIndex}`);
        }
      } else {
        // If dropping in a different area
        const [setSourceShapes, sourceShapes] = getShapeSetterForArea(fromArea);
        const [setTargetShapes, targetShapes] = getShapeSetterForArea(areaName);
        
        const newSourceShapes = sourceShapes.filter(s => s.id !== shape.id).map(s => ({...s}));
        const movedShape = { 
          ...shape, 
          x, 
          y, 
          color: selectedColor,
          // Adjust size if needed for the new area
          width: Math.min(shape.width, dropTarget.width - x),
          height: Math.min(shape.height, dropTarget.height - y)
        };
        const newTargetShapes = [...targetShapes.map(s => ({...s})), movedShape];
        
        setSourceShapes(newSourceShapes);
        setTargetShapes(newTargetShapes);
        
        const newIndex = newTargetShapes.length - 1;
        setSelectedShape(`${areaName}-${newIndex}`);
      }
    } else if (draggedShape) {
      // Creating a new shape from the palette - always use the current selected color
      const newShape: PlacedShape = {
        ...draggedShape,
        x,
        y,
        width: shapeSize,
        height: shapeSize,
        rotation: 0,
        color: selectedColor,
      };

      const [setShapes, shapes] = getShapeSetterForArea(areaName);
      const newShapes = [...shapes.map(s => ({...s})), newShape];
      setShapes(newShapes);
      
      const newIndex = newShapes.length - 1;
      setSelectedShape(`${areaName}-${newIndex}`);
    }

    // Save to history after all state updates are complete
    saveToHistory();

    // Clear drag states after everything is done
    setDraggedShape(null);
    dragItemRef.current = null;
  };

  const handleShapeDelete = (shapeId: string, area: string) => {
    const [setShapes, shapes] = getShapeSetterForArea(area);
    saveToHistory();
    setShapes(shapes.filter(shape => shape.id !== shapeId));
    setSelectedShape(null);
  };

  // Update handleBackgroundClick to properly handle deselection
  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Check if clicking on the draggable area or any element that's not part of a shape
    if (target.classList.contains(styles.draggableArea) || 
        target.getAttribute('data-draggable-area') === 'true') {
      setSelectedShape(null);
    }
  };

  // Function to save current state to undo stack
  const saveToHistory = () => {
    const currentState: DesignState = {
      'Body': [...bodyShapes],
    };
    setUndoStack([...undoStack, currentState]);
    setRedoStack([]); // Clear redo stack when new action is performed
  };

  // Undo function
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    const currentState: DesignState = {
      'Body': [...bodyShapes],
    };
    
    setRedoStack([...redoStack, currentState]);
    setBodyShapes(previousState['Body']);
    setUndoStack(undoStack.slice(0, -1));
  };

  // Redo function
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    const currentState: DesignState = {
      'Body': [...bodyShapes],
    };
    
    setUndoStack([...undoStack, currentState]);
    setBodyShapes(nextState['Body']);
    setRedoStack(redoStack.slice(0, -1));
  };

  // Reset function
  const handleReset = () => {
    saveToHistory();
    setBodyShapes([]);
  };

  // Delete selected function
  const handleDeleteSelected = () => {
    if (!selectedShape) return;
    
    saveToHistory();
    const [area, index] = selectedShape.split('-');
    const [setShapes, shapes] = getShapeSetterForArea(area);
    const newShapes = shapes.filter((_, i) => i !== parseInt(index));
    setShapes(newShapes);
    setSelectedShape(null);
  };

  // Toggle fullscreen
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Fetch DIY-enabled products when component mounts
  useEffect(() => {
    fetchDIYProducts();
  }, []);

  const fetchDIYProducts = async () => {
    try {
      setLoadingProducts(true);
      console.log("Fetching DIY-enabled products...");
      
      // Fetch all products
      const response = await productsAPI.getAll();
      
      if (response.data && response.data.success) {
        console.log("All products:", response.data.data);
        
        // More robust filtering for products with showInDIY=true - handle different possible formats
        const diyEnabledProducts = response.data.data.filter((product: any) => {
          if (!product) return false;
          
          // Check for different possible property formats (boolean true, string "true", 1, etc)
          const hasShowInDIY = product && 'showInDIY' in product;
          let isEnabled = false;
          
          if (hasShowInDIY) {
            // Handle different data types for the property
            if (typeof product.showInDIY === 'boolean') {
              isEnabled = product.showInDIY === true;
            } else if (typeof product.showInDIY === 'string') {
              isEnabled = product.showInDIY.toLowerCase() === 'true';
            } else if (typeof product.showInDIY === 'number') {
              isEnabled = product.showInDIY === 1;
            }
          } else {
            // Fallback: Check if "DIY" is in the name if the property doesn't exist
            isEnabled = product.name && typeof product.name === 'string' && product.name.includes('DIY');
            console.log(`Product ${product.name} doesn't have showInDIY property, using name fallback:`, isEnabled);
          }
          
          console.log(`Product ${product.name || 'Unknown'} (${product._id || 'No ID'}) showInDIY:`, 
            hasShowInDIY ? product.showInDIY : 'not present', 
            "isEnabled:", isEnabled);
          
          return isEnabled;
        });
        
        console.log(`Loaded ${diyEnabledProducts.length} DIY products out of ${response.data.data.length} total:`, diyEnabledProducts);
        setDiyProducts(diyEnabledProducts);
        
        // If a product is already selected in the project, highlight it in the carousel
        if (projectData && projectData.selectedProductId) {
          const productId = typeof projectData.selectedProductId === 'object' 
            ? projectData.selectedProductId._id 
            : projectData.selectedProductId;
          
          setSelectedCarouselProduct(productId);
        }
      } else {
        console.log("Failed to fetch DIY products:", response.data);
        setDiyProducts([]);
      }
    } catch (error) {
      console.error('Error fetching DIY products:', error);
      setDiyProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Update handleProductSelect to properly set the fabric image
  const handleProductSelect = (product: ProductThumbnail) => {
    console.log("Product selected from carousel:", product);
    setSelectedCarouselProduct(product._id);

    // Extract material information
    if (product.material) {
      console.log("Product has material:", product.material);
      if (typeof product.material === 'object' && product.material !== null) {
        // Handle material as object
        if ('_id' in product.material && 'name' in product.material) {
          console.log("Setting material ID from object:", product.material._id);
          console.log("Setting fabric category from object:", product.material.name);
          setSelectedMaterialId(product.material._id);
          setFabricCategory(product.material.name);
        }
      } else if (typeof product.material === 'string') {
        // Handle material as string (ID)
        console.log("Setting material ID from string:", product.material);
        setSelectedMaterialId(product.material);
        
        // Look up the material name if available
        const materialName = getMaterialNameById(product.material);
        if (materialName) {
          console.log("Setting fabric category from ID lookup:", materialName);
          setFabricCategory(materialName);
        }
      }
    }

    // CRITICAL: Extract and set fabric image from product
    if (product.images && product.images.length > 0) {
      const imagePath = product.images[0];
      const imageUrl = imagePath.startsWith('http')
        ? imagePath
        : `http://localhost:5173${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
      
      console.log("Setting fabric image from carousel selection:", imageUrl);
      setFabricImage(imageUrl);
    } else {
      console.warn("Selected product has no images!");
    }

    // Extract and set product category if available
    if (product.category) {
      console.log("Product has category:", product.category);
      if (typeof product.category === 'object' && product.category !== null && '_id' in product.category) {
        console.log("Setting product category from object:", product.category._id);
        setProductCategory(product.category._id);
      } else if (typeof product.category === 'string') {
        console.log("Setting product category from string:", product.category);
        setProductCategory(product.category);
      }
    }

    // Check if we've changed from the original product
    if (originalProductId && originalProductId !== product._id) {
      // Log that we've changed from the original product
      console.log(`Fabric changed from original product ${originalProductId} to ${product._id}`);
    } else {
      console.log(`Selected the original product ${product._id}`);
    }
  };

  // Add the helper function to get material name by ID
  const getMaterialNameById = (id: string): string => {
    const material = materials.find(m => m._id === id);
    return material ? material.name : '';
  };

  // Update the TextField that renders the material dropdown
  <TextField
    fullWidth
    select
    label="Fabric Material"
    variant="outlined"
    size="small"
    value={fabricCategory || ""}
    onChange={(e) => {
      setFabricCategory(e.target.value);
      // Find the material ID for this name
      const material = materials.find(m => m.name === e.target.value);
      if (material) {
        setSelectedMaterialId(material._id);
      }
    }}
    disabled={loadingMaterials}
  >
    {/* Always include these common materials */}
    <MenuItem value="Khadi Cotton">Khadi Cotton</MenuItem>
    <MenuItem value="Pure Cotton">Pure Cotton</MenuItem>
    <MenuItem value="Silk">Silk</MenuItem>
    
    {/* Then include all materials from the API if they're different */}
    {materials.filter(m => 
      m.name !== "Khadi Cotton" && 
      m.name !== "Pure Cotton" && 
      m.name !== "Silk"
    ).map((material) => (
      <MenuItem key={material._id} value={material.name}>
        {material.name}
      </MenuItem>
    ))}
  </TextField>

  // Update the saveProjectWithCurrentFabric function to save category ID
  const saveProjectWithCurrentFabric = async () => {
    try {
      if (!projectId) {
        setSnackbar({
          open: true,
          message: 'Cannot save: Project ID is missing',
          severity: 'error',
        });
        return;
      }

    const design = {
      body: bodyShapes,
      isLocked,
      isFavorite,
    };

      console.log(`Saving design with ${bodyShapes.length} body shapes`);
      if (bodyShapes.length > 0) {
        console.log('Sample shape data:', {
          id: bodyShapes[0].id,
          x: bodyShapes[0].x,
          y: bodyShapes[0].y,
          width: bodyShapes[0].width,
          height: bodyShapes[0].height,
          rotation: bodyShapes[0].rotation,
          color: bodyShapes[0].color,
        });
      }

      // Create a FormData object to send to the API
      const formData = new FormData();
      
      // Add updated project information
      formData.append('name', projectName);
      formData.append('description', projectDescription);
      
      // Use productCategory for fabricCategory field (proper category value)
      // Make sure we're using the ID, not the display name
      formData.append('fabricCategory', productCategory || 'Fabric');
      console.log('Saving with category ID:', productCategory || 'Fabric');
      
      // Add material name as a separate field
      formData.append('materialName', fabricCategory || '');
      console.log('Saving with material name:', fabricCategory || '');
      
      // Also include the material ID if available
      if (selectedMaterialId) {
        formData.append('materialId', selectedMaterialId);
        console.log('Saving with material ID:', selectedMaterialId);
      }
      
      // Add the selected product ID if available
      if (selectedCarouselProduct) {
        formData.append('selectedProductId', selectedCarouselProduct);
        console.log('Saving with selected product ID:', selectedCarouselProduct);
        
        // Update the original product ID so future saves don't trigger the confirmation
        setOriginalProductId(selectedCarouselProduct);
      }
      
      // Add the design data as a JSON string
      const designJson = JSON.stringify(design);
      formData.append('designData', designJson);
      console.log('Design data being saved:', designJson);
      
      // Send the update request to the API
      const response = await projectsAPI.update(projectId, formData);
      
      if (response.data && response.data.success) {
        // Show success message
        setSnackbar({
          open: true,
          message: 'Project saved successfully!',
          severity: 'success',
        });
        console.log('Project saved successfully:', response.data);
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to save project',
          severity: 'error',
        });
        console.error('Failed to save project:', response.data);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error saving project',
        severity: 'error',
      });
      console.error('Error saving project:', error);
    }
  };

  // Modified handleSave to check for fabric changes
  const handleSave = async () => {
    // Check if the fabric has changed from the original
    const fabricChanged = selectedCarouselProduct && originalProductId && 
      selectedCarouselProduct !== originalProductId;
    
    console.log("Checking fabric change:", {
      originalProductId,
      selectedCarouselProduct,
      fabricChanged
    });
    
    if (fabricChanged) {
      // Show confirmation dialog
      setPendingSaveAction(true);
      setShowFabricChangeDialog(true);
    } else {
      // No fabric change, proceed with save
      await saveProjectWithCurrentFabric();
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Add to cart
  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Adding to cart');
  };

  // Add a function to handle duplication of elements
  const handleShapeDuplicate = (shape: PlacedShape, area: string) => {
    // Save to history before duplication
    saveToHistory();
    
    // Create duplicate with a new ID and slightly offset position
    const duplicateShape: PlacedShape = {
      ...shape,
      id: `${shape.id.split('-')[0]}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: Math.min(shape.x + GRID_SIZE * 2, window.innerWidth - shape.width - 50),
      y: Math.min(shape.y + GRID_SIZE * 2, window.innerHeight - shape.height - 50),
    };
    
    // Get the setter and current shapes for the area
    const [setShapes, shapes] = getShapeSetterForArea(area);
    
    // Add the duplicate to the shapes array
    const newShapes = [...shapes, duplicateShape];
    setShapes(newShapes);
    
    // Select the new duplicate
    const newIndex = newShapes.length - 1;
    setSelectedShape(`${area}-${newIndex}`);
  };

  // Update the croppingShape handling to be simpler
  const handleCropStart = (e: React.MouseEvent, shape: PlacedShape, area: string, index: number) => {
    e.stopPropagation();
    setCroppingShape(`${area}-${index}`);
    setSelectedShape(`${area}-${index}`);
    
    // Initialize crop settings if they don't exist
    const [setShapes, shapes] = getShapeSetterForArea(area);
    const updatedShapes = shapes.map((s, i) => {
      if (i === index && !s.cropSettings) {
        return { 
          ...s, 
          cropSettings: { top: 0, right: 0, bottom: 0, left: 0 } 
        };
      }
      return s;
    });
    setShapes(updatedShapes);
  };

  // Update the handleCropEnd function to not save to history automatically
  const handleCropEnd = () => {
    setCroppingShape(null);
  };

  const handleCropChange = (edge: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    if (!croppingShape) return;
    
    const [area, indexStr] = croppingShape.split('-');
    const index = parseInt(indexStr);
    const [setShapes, shapes] = getShapeSetterForArea(area);
    
    if (!shapes[index]) return;
    
    // Ensure valid crop values (0-100)
    const validValue = Math.max(0, Math.min(100, value));
    
    // Create or update crop settings
    const updatedShapes = shapes.map((shape, i) => {
      if (i === index) {
        const cropSettings = {
          ...(shape.cropSettings || { top: 0, right: 0, bottom: 0, left: 0 }),
          [edge]: validValue
        };
        return { ...shape, cropSettings };
      }
      return shape;
    });
    
    setShapes(updatedShapes);
  };
  
  const handleCropReset = () => {
    if (!croppingShape) return;
    
    const [area, indexStr] = croppingShape.split('-');
    const index = parseInt(indexStr);
    const [setShapes, shapes] = getShapeSetterForArea(area);
    
    if (!shapes[index]) return;
    
    // Reset crop settings to zero (no cropping)
    const updatedShapes = shapes.map((shape, i) => {
      if (i === index) {
        return { 
          ...shape, 
          cropSettings: { top: 0, right: 0, bottom: 0, left: 0 } 
        };
      }
      return shape;
    });
    
    setShapes(updatedShapes);
  };

  const renderDraggableArea = (areaName: string) => {
    const [_, shapes] = getShapeSetterForArea(areaName);
    
    // Keep the rotation refs
    const isRotatingRef = useRef(false);
    const shapeCenterRef = useRef<{ x: number; y: number } | null>(null);
    const initialRotationRef = useRef(0);

    // Keep the angle calculation and rotation handling
    const calculateAngle = (centerX: number, centerY: number, mouseX: number, mouseY: number) => {
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      return angle;
    };

    const handleRotationStart = (e: React.MouseEvent, shape: PlacedShape, index: number) => {
      e.stopPropagation();
      e.preventDefault();

      isRotatingRef.current = true;

      // Get the shape's bounding box to calculate its center
      const shapeElement = e.currentTarget.closest('.react-draggable');
      if (!shapeElement) return;

      const rect = shapeElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      shapeCenterRef.current = { x: centerX, y: centerY };

      // Calculate the initial angle
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const initialAngle = calculateAngle(centerX, centerY, mouseX, mouseY);
      initialRotationRef.current = shape.rotation - initialAngle;

      // Add event listeners for mouse move and mouse up
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isRotatingRef.current || !shapeCenterRef.current) return;

        const { x: centerX, y: centerY } = shapeCenterRef.current;
        const mouseX = moveEvent.clientX;
        const mouseY = moveEvent.clientY;

        // Calculate the new angle
        const angle = calculateAngle(centerX, centerY, mouseX, mouseY);
        let newRotation = initialRotationRef.current + angle;

        // Normalize the rotation to be between 0 and 360 degrees
        newRotation = (newRotation + 360) % 360;
        if (newRotation < 0) newRotation += 360;

        // Update the shape's rotation in real-time
        const [setShapes, shapes] = getShapeSetterForArea(areaName);
        const updatedShapes = [...shapes];
        updatedShapes[index] = { ...shapes[index], rotation: newRotation };
        setShapes(updatedShapes);
      };

      const handleMouseUp = () => {
        isRotatingRef.current = false;
        shapeCenterRef.current = null;
        initialRotationRef.current = 0;

        // Save to history after rotation is complete
        saveToHistory();

        // Remove event listeners
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };
    
    return (
      <Box
        className={styles.draggableArea}
        data-draggable-area={areaName}
        onClick={handleBackgroundClick}
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          // Add fabric background if available (lowest z-index)
          ...(fabricImage && {
            backgroundImage: `url(${fabricImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }),
          // Add grid as an ::after pseudo-element (middle z-index)
          ...(isGridVisible && {
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(to right, rgba(221, 221, 221, 0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(221, 221, 221, 0.7) 1px, transparent 1px)',
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              pointerEvents: 'none',
              zIndex: 2,
            }
          }),
        }}
        onDrop={(e) => handleDrop(e, areaName)}
        onDragOver={handleDragOver}
      >
        {/* Add fabric info label */}
        {fabricImage && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              px: 1.5,
              py: 0.7,
              borderRadius: 1,
              fontSize: '0.75rem',
              zIndex: 5,
              pointerEvents: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
              {fabricCategory}
            </Typography>
          </Box>
        )}
        
        {shapes.map((shape, index) => (
          <Rnd
            key={`${shape.id}-${index}`}
            default={{
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
            }}
            position={{ x: shape.x, y: shape.y }}
            size={{ width: shape.width, height: shape.height }}
            style={{
              zIndex: selectedShape === `${areaName}-${index}` ? 10 : 3, // Design elements have highest z-index
              overflow: 'visible',
            }}
            enableResizing={!isLocked && selectedShape === `${areaName}-${index}` && {
              top: true,
              right: true,
              bottom: true,
              left: true,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true,
            }}
            disableDragging={isLocked}
            bounds="parent"
            dragGrid={[GRID_SIZE, GRID_SIZE]}
            resizeGrid={[GRID_SIZE, GRID_SIZE]}
            onDragStart={(e) => {
              e.stopPropagation();
              if (!isLocked) {
                handleDragStart(shape, areaName);
                setSelectedShape(`${areaName}-${index}`);
              }
            }}
            onDrag={(e, d) => {
              e.stopPropagation();
              if (isLocked) return;

              // Update position in real-time during drag
              const [setShapes, shapes] = getShapeSetterForArea(areaName);
              const updatedShapes = shapes.map((s, i) => 
                i === index ? { ...s, x: d.x, y: d.y } : s
              );
              setShapes(updatedShapes);
            }}
            onDragStop={(e, d) => {
              e.stopPropagation();
              if (isLocked) return;
              
              // Snap to grid on drag stop
              const snappedX = snapToGrid(d.x);
              const snappedY = snapToGrid(d.y);
              
              const [setShapes, shapes] = getShapeSetterForArea(areaName);
              const updatedShapes = shapes.map((s, i) => 
                i === index ? { ...s, x: snappedX, y: snappedY } : s
              );
              setShapes(updatedShapes);
              setSelectedShape(`${areaName}-${index}`);
              saveToHistory();
            }}
            onResizeStart={(e) => {
              e.stopPropagation();
              if (!isLocked) {
                setSelectedShape(`${areaName}-${index}`);
              }
            }}
            onResize={(e, direction, ref, delta, position) => {
              e.stopPropagation();
              if (isLocked) return;

              // Update size in real-time during resize
              const [setShapes, shapes] = getShapeSetterForArea(areaName);
              const updatedShapes = shapes.map((s, i) => 
                i === index ? {
                  ...s,
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height),
                  x: position.x,
                  y: position.y,
                } : s
              );
              setShapes(updatedShapes);
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              e.stopPropagation();
              if (isLocked) return;
              
              // Snap size and position to grid on resize stop
              const snappedWidth = snapToGrid(parseInt(ref.style.width));
              const snappedHeight = snapToGrid(parseInt(ref.style.height));
              const snappedX = snapToGrid(position.x);
              const snappedY = snapToGrid(position.y);
              
              const [setShapes, shapes] = getShapeSetterForArea(areaName);
              const updatedShapes = shapes.map((s, i) => 
                i === index ? {
                  ...s,
                  width: snappedWidth,
                  height: snappedHeight,
                  x: snappedX,
                  y: snappedY,
                } : s
              );
              setShapes(updatedShapes);
              saveToHistory();
            }}
            resizeHandleStyles={{
              top: { display: selectedShape === `${areaName}-${index}` ? 'block' : 'none' },
              right: { display: selectedShape === `${areaName}-${index}` ? 'block' : 'none' },
              bottom: { display: selectedShape === `${areaName}-${index}` ? 'block' : 'none' },
              left: { display: selectedShape === `${areaName}-${index}` ? 'block' : 'none' },
              topRight: { display: selectedShape === `${areaName}-${index}` ? 'block' : 'none' },
              bottomRight: { display: selectedShape === `${areaName}-${index}` ? 'block' : 'none' },
              bottomLeft: { display: selectedShape === `${areaName}-${index}` ? 'block' : 'none' },
              topLeft: { display: selectedShape === `${areaName}-${index}` ? 'block' : 'none' },
            }}
          >
            <Box 
              onClick={(e) => {
                e.stopPropagation();
                if (!isLocked) {
                  setSelectedShape(`${areaName}-${index}`);
                }
              }}
              sx={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative',
                cursor: isLocked ? 'default' : 'move',
                transform: `rotate(${shape.rotation}deg)`,
                transformOrigin: 'center center',
                '&:hover': {
                  '& > .shape-border': {
                    borderColor: '#2196f3'
                  }
                }
              }}
            >
              {selectedShape === `${areaName}-${index}` && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: '2px solid #2196f3',
                    borderRadius: '2px',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}
                />
              )}
              
              <Box
                className="shape-border"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: '2px solid transparent',
                  borderRadius: '2px',
                  pointerEvents: 'none',
                  zIndex: 5,
                  transition: 'border-color 0.2s'
                }}
              />
              
              {/* Design element container */}
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* The actual content that gets cropped */}
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                    right: 0,
                    bottom: 0,
                    ...(shape.cropSettings && {
                      clipPath: `inset(${shape.cropSettings.top}% ${shape.cropSettings.right}% ${shape.cropSettings.bottom}% ${shape.cropSettings.left}%)`,
                    }),
                }}
              >
                {shape.render(shape.color)}
              </Box>
              </Box>
              
              {/* Direct Crop Handles */}
              {croppingShape === `${areaName}-${index}` && (
                // Counter-rotating container for crop UI - rotates the entire UI back to align with the element
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    transform: `rotate(${shape.rotation}deg)`, // Apply the same rotation as the element
                    transformOrigin: 'center center',
                    zIndex: 1002,
                  }}
                >
                  {/* Now inside this rotated container, we need a counter-rotated UI */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      transform: `rotate(${-shape.rotation}deg)`, // Counter-rotate to make UI elements appear straight
                      transformOrigin: 'center center',
                    }}
                  >
                    {/* Cropping overlay to show cropped area */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                      }}
                    >
                      {/* Top cropped area */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${shape.cropSettings?.top || 0}%`,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        }}
                      />
                      {/* Right cropped area */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: `${shape.cropSettings?.top || 0}%`,
                          right: 0,
                          width: `${shape.cropSettings?.right || 0}%`,
                          height: `${100 - (shape.cropSettings?.top || 0) - (shape.cropSettings?.bottom || 0)}%`,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        }}
                      />
                      {/* Bottom cropped area */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '100%',
                          height: `${shape.cropSettings?.bottom || 0}%`,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        }}
                      />
                      {/* Left cropped area */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: `${shape.cropSettings?.top || 0}%`,
                          left: 0,
                          width: `${shape.cropSettings?.left || 0}%`,
                          height: `${100 - (shape.cropSettings?.top || 0) - (shape.cropSettings?.bottom || 0)}%`,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        }}
                      />
                    </Box>

                    {/* Crop handles */}
                    {/* Top crop handle */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: `${shape.cropSettings?.top || 0}%`,
                        left: 0,
                        right: 0,
                        height: '10px',
                        backgroundColor: 'rgba(33, 150, 243, 0.7)',
                        cursor: 'ns-resize',
                        pointerEvents: 'auto',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        
                        const startY = e.clientY;
                        const startTop = shape.cropSettings?.top || 0;
                        const elementHeight = e.currentTarget.parentElement?.parentElement?.parentElement?.offsetHeight || 100;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          moveEvent.preventDefault();
                          
                          const deltaY = moveEvent.clientY - startY;
                          const newTop = Math.max(0, Math.min(100, startTop + (deltaY / elementHeight * 100)));
                          
                          handleCropChange('top', newTop);
                        };
                        
                        const handleMouseUp = () => {
                          window.removeEventListener('mousemove', handleMouseMove);
                          window.removeEventListener('mouseup', handleMouseUp);
                          saveToHistory();
                          handleCropEnd();
                        };
                        
                        window.addEventListener('mousemove', handleMouseMove);
                        window.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                    
                    {/* Right crop handle */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: `${shape.cropSettings?.right || 0}%`,
                        bottom: 0,
                        width: '10px',
                        backgroundColor: 'rgba(33, 150, 243, 0.7)',
                        cursor: 'ew-resize',
                        pointerEvents: 'auto',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        
                        const startX = e.clientX;
                        const startRight = shape.cropSettings?.right || 0;
                        const elementWidth = e.currentTarget.parentElement?.parentElement?.parentElement?.offsetWidth || 100;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          moveEvent.preventDefault();
                          
                          const deltaX = startX - moveEvent.clientX;
                          const newRight = Math.max(0, Math.min(100, startRight + (deltaX / elementWidth * 100)));
                          
                          handleCropChange('right', newRight);
                        };
                        
                        const handleMouseUp = () => {
                          window.removeEventListener('mousemove', handleMouseMove);
                          window.removeEventListener('mouseup', handleMouseUp);
                          saveToHistory();
                          handleCropEnd();
                        };
                        
                        window.addEventListener('mousemove', handleMouseMove);
                        window.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                    
                    {/* Bottom crop handle */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: `${shape.cropSettings?.bottom || 0}%`,
                        left: 0,
                        right: 0,
                        height: '10px',
                        backgroundColor: 'rgba(33, 150, 243, 0.7)',
                        cursor: 'ns-resize',
                        pointerEvents: 'auto',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        
                        const startY = e.clientY;
                        const startBottom = shape.cropSettings?.bottom || 0;
                        const elementHeight = e.currentTarget.parentElement?.parentElement?.parentElement?.offsetHeight || 100;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          moveEvent.preventDefault();
                          
                          const deltaY = startY - moveEvent.clientY;
                          const newBottom = Math.max(0, Math.min(100, startBottom + (deltaY / elementHeight * 100)));
                          
                          handleCropChange('bottom', newBottom);
                        };
                        
                        const handleMouseUp = () => {
                          window.removeEventListener('mousemove', handleMouseMove);
                          window.removeEventListener('mouseup', handleMouseUp);
                          saveToHistory();
                          handleCropEnd();
                        };
                        
                        window.addEventListener('mousemove', handleMouseMove);
                        window.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                    
                    {/* Left crop handle */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: `${shape.cropSettings?.left || 0}%`,
                        bottom: 0,
                        width: '10px',
                        backgroundColor: 'rgba(33, 150, 243, 0.7)',
                        cursor: 'ew-resize',
                        pointerEvents: 'auto',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        
                        const startX = e.clientX;
                        const startLeft = shape.cropSettings?.left || 0;
                        const elementWidth = e.currentTarget.parentElement?.parentElement?.parentElement?.offsetWidth || 100;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          moveEvent.preventDefault();
                          
                          const deltaX = moveEvent.clientX - startX;
                          const newLeft = Math.max(0, Math.min(100, startLeft + (deltaX / elementWidth * 100)));
                          
                          handleCropChange('left', newLeft);
                        };
                        
                        const handleMouseUp = () => {
                          window.removeEventListener('mousemove', handleMouseMove);
                          window.removeEventListener('mouseup', handleMouseUp);
                          saveToHistory();
                          handleCropEnd();
                        };
                        
                        window.addEventListener('mousemove', handleMouseMove);
                        window.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                    
                    {/* Control buttons */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        zIndex: 1004,
                        display: 'flex',
                        gap: 1,
                      }}
                    >
                      {/* Reset crop button */}
                      <IconButton
                        size="small"
                        sx={{
                          backgroundColor: 'white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCropReset();
                          saveToHistory();
                        }}
                      >
                        <ResetIcon fontSize="small" />
                      </IconButton>
                      
                      {/* Close button to exit crop mode */}
                      <IconButton
                        size="small"
                        sx={{
                          backgroundColor: 'white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          saveToHistory();
                          handleCropEnd();
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              )}
              
              {selectedShape === `${areaName}-${index}` && !isLocked && (
                <Box sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  display: 'flex',
                  gap: 0.5,
                  bgcolor: 'white',
                  padding: '2px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  zIndex: 1001,
                  transform: `rotate(${-shape.rotation}deg)`,
                }}>
                  <IconButton
                    size="small"
                    onMouseDown={(e) => handleRotationStart(e, shape, index)}
                    sx={{
                      cursor: 'grab',
                      '&:active': {
                        cursor: 'grabbing',
                      },
                    }}
                  >
                    <RotateIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCropStart(e, shape, areaName, index);
                    }}
                  >
                    <CropIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShapeDuplicate(shape, areaName);
                    }}
                  >
                    <DuplicateIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShapeDelete(shape.id, areaName);
                    }}
                  >
                    <TrashIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Rnd>
        ))}
      </Box>
    );
  };

  // Update the design blocks section to use fetched elements
  const renderDesignBlocks = () => {
    const filteredShapes = designShapes.filter(shape => 
      shape.isActive && 
      (searchQuery === '' || 
        shape.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shape.artType.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <Box className={styles.designBlocks} sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', // Fixed 4 elements per row
        gap: 1.5,
        p: 2,
        overflowY: 'auto',
        maxHeight: 'calc(100% - 60px - 60px)', // Account for search bar and color palette
      }}>
        {filteredShapes.map((element) => (
          <Box
            key={element.id}
            sx={{
              width: '100%',
              aspectRatio: '1/1',
              cursor: 'grab',
              border: selectedShape === element.id ? '2px solid #1976d2' : '1px solid #eee',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                transform: 'scale(1.15)',
                zIndex: 10,
                boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
              },
            }}
            draggable
            onDragStart={(e) => handleDragStart(element)}
            onClick={() => setSelectedShape(element.id)}
          >
            <Box sx={{ width: '80%', height: '80%' }}>
              {element.render(selectedColor)}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  // Update color when a new color is selected for an existing shape
  useEffect(() => {
    if (selectedShape && selectedShape.includes('-')) {
      const [area, indexStr] = selectedShape.split('-');
      const index = parseInt(indexStr);
      const [setShapes, shapes] = getShapeSetterForArea(area);
      
      if (shapes[index]) {
        const updatedShapes = shapes.map((shape, i) => 
          i === index ? { ...shape, color: selectedColor } : shape
        );
        setShapes(updatedShapes);
      }
    }
  }, [selectedColor]);

  // Handle material change in dropdown
  const handleMaterialChange = (event: SelectChangeEvent<string>) => {
    const materialName = event.target.value;
    console.log("Material changed to:", materialName);
    setFabricCategory(materialName);
    
    // Find the material ID for the selected material name
    const material = materials.find(m => m.name === materialName);
    if (material) {
      console.log("Setting selected material ID:", material._id);
      setSelectedMaterialId(material._id);
      
      // Instead of clearing the selected product right away, 
      // check if any products in the carousel will match the new material
      const productsWithNewMaterial = diyProducts.filter(product => {
        const productMaterialId = typeof product.material === 'object' && product.material?._id
          ? product.material._id
          : product.material;
        
        const productCategoryId = typeof product.category === 'object' && product.category?._id
          ? product.category._id
          : product.category;
        
        return productMaterialId === material._id && 
               productCategoryId === productCategory &&
               product.showInDIY === true;
      });
      
      console.log(`Found ${productsWithNewMaterial.length} products with the new material`);
      
      if (productsWithNewMaterial.length > 0) {
        // If we have products with this material, select the first one
        const firstProduct = productsWithNewMaterial[0];
        console.log("Auto-selecting product with new material:", firstProduct.name);
        
        // Set the selected carousel product
        setSelectedCarouselProduct(firstProduct._id);
        
        // Update the fabric image
        if (firstProduct.images && firstProduct.images.length > 0) {
          const imagePath = firstProduct.images[0];
          const imageUrl = imagePath.startsWith('http')
            ? imagePath
            : `http://localhost:5173${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
          
          console.log("Setting fabric image to new product:", imageUrl);
          setFabricImage(imageUrl);
        }
      } else {
        // No products match the new material, clear the selected product and image
        console.log("No products match the new material, clearing design area");
        setSelectedCarouselProduct('');
        setFabricImage('');
      }
    } else {
      console.warn("Could not find material with name:", materialName);
    }
  };

  // Add state to track product category
  const [productCategory, setProductCategory] = useState<string>('');

  // Add useEffect to reset carousel page when filters change
  useEffect(() => {
    // Reset carousel page to 0 when product category or material changes
    setCurrentCarouselPage(0);
  }, [productCategory, selectedMaterialId]);

  // Add a helper function to get category name by ID
  const getCategoryNameById = (id: string): string => {
    const category = categories.find(c => c._id === id);
    return category ? category.name : id;
  };

  // Add this effect to ensure dropdowns get populated when materials and categories are loaded
  useEffect(() => {
    // If we have materials, categories, and project data loaded, update the dropdowns
    if (materials.length > 0 && categories.length > 0 && projectData) {
      console.log("Materials and categories loaded, updating dropdowns");
      
      // If we have a material ID but no name, try to find it
      if (selectedMaterialId && !fabricCategory) {
        const material = materials.find(m => m._id === selectedMaterialId);
        if (material) {
          console.log("Found material name from ID:", material.name);
          setFabricCategory(material.name);
        }
      }
      
      // If we have a category ID, check if we need to update the display value
      if (productCategory) {
        const category = categories.find(c => c._id === productCategory);
        if (category) {
          console.log("Found category name from ID:", category.name);
          // We might need to update the display value in the UI
          document.getElementById('product-category-field')?.setAttribute('data-display-value', category.name);
        }
      }
    }
  }, [materials, categories, projectData, selectedMaterialId, productCategory]);

  // Update the material filtering logic
  const filteredMaterials = useMemo(() => {
    console.log("Filtering materials for dropdown. Available materials:", materials);
    console.log("Current product category:", productCategory);
    console.log("Current selected material ID:", selectedMaterialId);
    console.log("Current fabric category (name):", fabricCategory);
    
    // If no product category is selected, show all materials
    if (!productCategory) {
      console.log("No product category selected, showing all materials");
      return materials;
    }
    
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(productCategory);
    if (!isMongoId) {
      console.log("Product category is not a valid MongoDB ID, showing all materials:", productCategory);
      return materials;
    }
    
    // For materials dropdown, we need to show ALL materials that belong to the selected category
    console.log("Filtering materials by product category ID:", productCategory);
    
    // Get all materials used by products in the selected category
    const categoryMaterials = materials.filter(material => {
      const materialUsedInCategory = diyProducts.some(product => {
        // Get category ID, handling both object and string cases
        const productCategoryId = 
          typeof product.category === 'object' && product.category !== null
            ? product.category._id
            : product.category;
        
        // Get material ID, handling both object and string cases
        const productMaterialId = 
          typeof product.material === 'object' && product.material !== null
            ? product.material._id
            : product.material;
        
        // Check if this product belongs to the selected category and uses this material
        const match = productCategoryId === productCategory && productMaterialId === material._id;
        console.log(`Checking product ${product.name} - category: ${productCategoryId} vs ${productCategory}, material: ${productMaterialId} vs ${material._id}, match: ${match}`);
        return match;
      });
      
      console.log(`Material ${material.name} used in category ${getCategoryNameById(productCategory)}: ${materialUsedInCategory}`);
      return materialUsedInCategory;
    });
    
    // Special case: if the selected material is not in the filtered list, add it
    if (selectedMaterialId && !categoryMaterials.some(m => m._id === selectedMaterialId)) {
      console.log("Adding selected material to the dropdown even though it's not in the filtered list");
      const selectedMaterial = materials.find(m => m._id === selectedMaterialId);
      if (selectedMaterial) {
        return [...categoryMaterials, selectedMaterial];
      }
    }
    
    console.log("Materials for selected category:", categoryMaterials.map(m => m.name));
    return categoryMaterials.length > 0 ? categoryMaterials : materials; // Fallback to all materials if none match
  }, [materials, productCategory, diyProducts, selectedMaterialId]);

  // Get a count of products matching the selected category and material
  useEffect(() => {
    if (!diyProducts.length) return;
    
    const productsForCategory = diyProducts.filter(product => {
      const productCategoryId = typeof product.category === 'object' && product.category !== null
        ? product.category._id
        : product.category;
      
      return productCategoryId === productCategory;
    });
    
    const productsForMaterial = diyProducts.filter(product => {
      const productMaterialId = typeof product.material === 'object' && product.material !== null
        ? product.material._id
        : product.material;
      
      return productMaterialId === selectedMaterialId;
    });
    
    const productsForBoth = diyProducts.filter(product => {
      const productCategoryId = typeof product.category === 'object' && product.category !== null
        ? product.category._id
        : product.category;
      
      const productMaterialId = typeof product.material === 'object' && product.material !== null
        ? product.material._id
        : product.material;
      
      return productCategoryId === productCategory && productMaterialId === selectedMaterialId;
    });
    
    console.log('Products matching filters:', {
      totalProducts: diyProducts.length,
      matchingCategory: productsForCategory.length,
      matchingMaterial: productsForMaterial.length,
      matchingBoth: productsForBoth.length,
      categoryProducts: productsForCategory.map(p => p.name),
      materialProducts: productsForMaterial.map(p => p.name),
      bothProducts: productsForBoth.map(p => p.name)
    });
  }, [diyProducts, productCategory, selectedMaterialId]);

  // Add this useEffect to ensure proper category ID conversion when categories load
  useEffect(() => {
    // This useEffect runs when categories are loaded and productCategory is set
    if (categories.length > 0 && productCategory) {
      // Check if the current productCategory is not in MongoDB ObjectId format
      // and might be a category name instead
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(productCategory);
      
      if (!isMongoId) {
        console.log("Current product category appears to be a name, converting to ID:", productCategory);
        // Find the matching category by name
        const category = categories.find(c => c.name.toLowerCase() === productCategory.toLowerCase());
        if (category) {
          console.log("Found matching category ID:", category._id);
          // Update the product category to the actual ID
          setProductCategory(category._id);
        }
      }
    }
  }, [categories, productCategory]);

  // Update the carousel filtering logic to handle category matching correctly
  const filteredCarouselProducts = useMemo(() => {
    if (!diyProducts.length) return [];
    
    console.log("Filtering carousel products with:", {
      productCategory,
      selectedMaterialId,
      selectedCarouselProduct
    });
    
    return diyProducts.filter(product => {
      // Extract product material ID
      const productMaterialId = product.material && typeof product.material === 'object' && product.material._id
        ? product.material._id 
        : typeof product.material === 'string' ? product.material : '';
      
      // Extract product category ID
      const productCategoryId = product.category && typeof product.category === 'object' && product.category._id
        ? product.category._id
        : typeof product.category === 'string' ? product.category : '';
      
      // Log product details for debugging
      console.log(`Filtering carousel product: ${product.name}`, {
        id: product._id,
        productCategoryId,
        selectedCategoryId: productCategory,
        categoryMatch: productCategoryId === productCategory,
        productMaterialId,
        selectedMaterialId,
        materialMatch: productMaterialId === selectedMaterialId,
        showInDIY: product.showInDIY
      });
      
      // For products to show in the carousel, they must:
      // 1. Have showInDIY set to true
      // 2. Match the selected category
      // 3. Match the selected material
      const matchesShowInDIY = product.showInDIY === true;
      const matchesCategory = productCategoryId === productCategory;
      const matchesMaterial = productMaterialId === selectedMaterialId;
      
      const shouldShow = matchesShowInDIY && matchesCategory && matchesMaterial;
      
      console.log(`Carousel product ${product.name} - showInDIY: ${matchesShowInDIY}, category match: ${matchesCategory}, material match: ${matchesMaterial}, should show: ${shouldShow}`);
      
      return shouldShow;
    });
  }, [diyProducts, productCategory, selectedMaterialId, selectedCarouselProduct]);

  // Add this useEffect to log key state changes for debugging
  useEffect(() => {
    console.log("Key state values updated:", {
      projectCategory: productCategory,
      categoryName: getCategoryNameById(productCategory),
      selectedMaterialId,
      materialName: fabricCategory,
      categoriesLoaded: categories.length,
      materialsLoaded: materials.length,
      productsLoaded: diyProducts.length
    });
  }, [productCategory, selectedMaterialId, fabricCategory, categories.length, materials.length, diyProducts.length]);

  // Add useEffect to monitor fabric image changes
  useEffect(() => {
    if (fabricImage) {
      console.log("Fabric image set:", fabricImage);
    } else {
      console.log("Fabric image is empty, trying to set from selected carousel product");
      
      // If we have a selected product but no image, try to get the image from it
      if (selectedCarouselProduct && diyProducts.length > 0) {
        const product = diyProducts.find(p => p._id === selectedCarouselProduct);
        if (product && product.images && product.images.length > 0) {
          const imagePath = product.images[0];
          const imageUrl = imagePath.startsWith('http')
            ? imagePath
            : `http://localhost:5173${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
          
          console.log("Setting fabric image from selected carousel product:", imageUrl);
          setFabricImage(imageUrl);
        }
      }
    }
  }, [fabricImage, selectedCarouselProduct, diyProducts]);

  // Add a debug helper to log when things are loaded
  useEffect(() => {
    console.log("Design page state:", {
      projectId,
      selectedCarouselProduct,
      fabricImage: fabricImage ? 'Set' : 'Not set',
      diyProductsCount: diyProducts.length,
      hasProject: !!projectData
    });
  }, [projectId, selectedCarouselProduct, fabricImage, diyProducts.length, projectData]);

  // Update the useEffect that runs when material or category changes to auto-select a product
  useEffect(() => {
    // Skip if no products loaded yet
    if (!diyProducts.length) return;
    // Skip if we already have a selected product that matches the current material
    if (selectedCarouselProduct) {
      const selectedProduct = diyProducts.find(p => p._id === selectedCarouselProduct);
      if (selectedProduct) {
        const productMaterialId = typeof selectedProduct.material === 'object' && selectedProduct.material?._id
          ? selectedProduct.material._id
          : selectedProduct.material;

        // If the selected product already matches the current material, keep it
        if (productMaterialId === selectedMaterialId) {
          console.log("Selected carousel product already matches current material, keeping it");
          return;
        }
      }
    }

    // Find products that match the current category and material
    const matchingProducts = diyProducts.filter(product => {
      const productMaterialId = typeof product.material === 'object' && product.material?._id
        ? product.material._id
        : product.material;
      
      const productCategoryId = typeof product.category === 'object' && product.category?._id
        ? product.category._id
        : product.category;
      
      return productMaterialId === selectedMaterialId && 
             productCategoryId === productCategory &&
             product.showInDIY === true;
    });

    console.log(`Found ${matchingProducts.length} products matching current material and category`);
    
    // If we have matching products but none selected, auto-select the first one
    if (matchingProducts.length > 0 && !selectedCarouselProduct) {
      const firstProduct = matchingProducts[0];
      console.log("Auto-selecting first matching product:", firstProduct.name);
      
      // Set the selected carousel product
      setSelectedCarouselProduct(firstProduct._id);
      
      // Update the fabric image
      if (firstProduct.images && firstProduct.images.length > 0) {
        const imagePath = firstProduct.images[0];
        const imageUrl = imagePath.startsWith('http')
          ? imagePath
          : `http://localhost:5173${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
        
        console.log("Setting fabric image to auto-selected product:", imageUrl);
        setFabricImage(imageUrl);
      }
    }
  }, [selectedMaterialId, productCategory, diyProducts, selectedCarouselProduct]);

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      px: 3,
      py: 2,
    }}>
      {/* Project Info Row */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 2,
      }}>
        <TextField
          fullWidth
          label="Project Name"
          variant="outlined"
          size="small"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <TextField
          fullWidth
          label="Description"
          variant="outlined"
          size="small"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
        />
        <TextField
          fullWidth
          id="product-category-field"
          label="Product Category"
          variant="outlined"
          size="small"
          value={productCategory ? getCategoryNameById(productCategory) : ""}
          InputProps={{
            readOnly: true,
          }}
          sx={{ mb: 1 }}
        />
        <FormControl 
          fullWidth 
          size="small"
          sx={{ mb: 1 }}
        >
          <InputLabel>Fabric Material</InputLabel>
          <Select
            value={fabricCategory}
            onChange={handleMaterialChange}
            label="Fabric Material"
            MenuProps={{ 
              style: { maxHeight: '300px' } 
            }}
          >
            {/* Use filteredMaterials or fallback to all materials if empty */}
            {(filteredMaterials.length > 0 ? filteredMaterials : materials).map(material => (
              <MenuItem key={material._id} value={material.name}>
                {material.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Toolbar */}
      <Paper 
        elevation={0}
        sx={{ 
          bgcolor: '#e3e8ed',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 0.5,
          px: 2,
          borderTop: '1px solid #ccc',
          borderBottom: '1px solid #ccc',
          mb: 0,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton size="small" onClick={handleReset}><ResetIcon /></IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton size="small" onClick={handleUndo} disabled={undoStack.length === 0}>
            <UndoIcon />
          </IconButton>
          <IconButton size="small" onClick={handleRedo} disabled={redoStack.length === 0}>
            <RedoIcon />
          </IconButton>
          <IconButton size="small" onClick={handleFullscreen}>
            <FullscreenIcon />
          </IconButton>
          <IconButton size="small" onClick={() => setIsGridVisible(!isGridVisible)}>
            <GridIcon color={isGridVisible ? 'primary' : 'inherit'} />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton size="small" onClick={handleSave}>
            <SaveIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => setIsLocked(!isLocked)}
          >
            <LockIcon color={isLocked ? 'primary' : 'inherit'} />
          </IconButton>
          <IconButton size="small" onClick={handleAddToCart}>
            <CartIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Simplified Grid Layout with thumbnails positioned above body */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: '280px 1fr', // Slightly narrower left column
        gridTemplateRows: 'auto 1fr',
        height: '75vh',
        border: '1px solid #ccc',
        borderTop: 'none',
        position: 'relative',
        overflow: 'hidden',
        width: '95vw',
        maxWidth: '1800px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        {/* Design Blocks - Takes full height on left column */}
        <Box sx={{ 
          borderRight: '1px solid #ccc',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'hidden', // Set to hidden since the inner content has overflow
          gridRow: '1 / span 2', // Make it span both rows
          height: '100%',
        }}>
          <Box sx={{ 
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
            borderBottom: '1px solid #eee',
            height: '60px', // Match the height of the carousel
        }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search Design"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
                sx: { height: '36px' }, // Consistent height
            }}
              sx={{ flex: 1 }}
          />
            <IconButton size="small">
          <ChevronLeftIcon />
            </IconButton>
        </Box>

          {/* Remove the Design Blocks title */}
          {renderDesignBlocks()}

          {/* Color Palette */}
        <Box sx={{ 
          p: 1.5,
            mt: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
            borderTop: '1px solid #ccc',
            height: '60px', // Consistent height
        }}>
          {colorPage > 0 && (
            <IconButton 
              size="small" 
              onClick={() => setColorPage(prev => prev - 1)}
            >
              <ChevronLeftIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          )}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 0.5,
            flex: 1,
          }}>
            {colorPalette.map((color) => (
              <Box
                key={color}
                onClick={() => setSelectedColor(color)}
                sx={{
                    height: '24px',
                  bgcolor: color,
                  cursor: 'pointer',
                    border: selectedColor === color ? '2px solid #000' : '1px solid #ccc',
                    borderRadius: '2px',
                    transition: 'transform 0.15s',
                    '&:hover': { 
                      opacity: 0.9,
                      transform: 'scale(1.1)',
                    },
                }}
              />
            ))}
          </Box>
          {colorPage < allColors.length - 1 && (
            <IconButton 
              size="small" 
              onClick={() => setColorPage(prev => prev + 1)}
            >
              <ChevronRightIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          )}
          </Box>
        </Box>

        {/* Saree Thumbnails Carousel - Updated to use real product data */}
        <Box sx={{ 
          borderBottom: '1px solid #eee',
          height: '60px',
          position: 'relative',
          bgcolor: '#fce4ec',
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
        }}>
          {/* Left Arrow - Fixed position */}
          <IconButton 
            onClick={handlePrevCarouselPage}
            disabled={currentCarouselPage === 0 || diyProducts.length === 0}
            sx={{ 
              position: 'absolute',
              left: 10,
              zIndex: 10,
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          {/* Thumbnails Container with Fixed Width */}
          <Box sx={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
            px: 4,
          }}>
            {loadingProducts ? (
              <Typography variant="body2">Loading products...</Typography>
            ) : diyProducts.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 1 
              }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No products with "Show in DIY" enabled found.
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.secondary' }}>
                  Enable "Show in DIY" flag for products in Admin &gt; Catalog &gt; Products
                </Typography>
              </Box>
            ) : (
              <Box sx={{
                display: 'flex',
                position: 'absolute',
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2.5,
              }}>
                {/* Filter products based on showInDIY, category ID, and material ID */}
                {filteredCarouselProducts
                  .slice(
                    currentCarouselPage * thumbnailsPerPage, 
                    (currentCarouselPage + 1) * thumbnailsPerPage
                  )
                  .map((product) => {
                    const imageUrl = product.images && product.images.length > 0 
                      ? (product.images[0].startsWith('http') 
                          ? product.images[0] 
                          : `http://localhost:5173${product.images[0].startsWith('/') ? product.images[0] : `/${product.images[0]}`}`)
                      : '';
                    
                    // Get material info to display in the tooltip
                    const materialInfo = product.material && typeof product.material === 'object' && 'name' in product.material ? product.material.name : 
                                        product.material || 
                                        product.materialType || 
                                        (product.materials && product.materials.length > 0 ? 
                                          (typeof product.materials[0] === 'object' && 'name' in product.materials[0] ? 
                                            product.materials[0].name : 
                                            typeof product.materials[0] === 'string' ? product.materials[0] : '') : '');
                    
                    return (
                      <Box 
                        key={product._id}
                        onClick={() => handleProductSelect(product)}
                        title={`${product.name}${materialInfo ? ` - ${materialInfo}` : ''}`}
                        sx={{
                          width: '120px',
                          height: '40px',
                          backgroundColor: '#f5f5f5',
                          backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          boxShadow: selectedCarouselProduct === product._id 
                            ? '0 0 0 3px #2196f3' 
                            : '0 2px 4px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          flexShrink: 0,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'scale(1.15)',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            zIndex: 5,
                          }
                        }}
                      >
                        {/* Dark overlay with product name */}
                        <Box sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          padding: '2px 4px',
                          color: 'white',
                          fontSize: '10px',
                          textAlign: 'center',
                        }}>
                          {product.name}
                        </Box>
                      </Box>
                    );
                  })}
              </Box>
            )}
          </Box>
          
          {/* Right Arrow - Fixed position */}
          <IconButton 
            onClick={handleNextCarouselPage}
            disabled={currentCarouselPage >= Math.ceil(diyProducts.length / thumbnailsPerPage) - 1 || diyProducts.length === 0}
            sx={{ 
              position: 'absolute',
              right: 10,
              zIndex: 10,
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Body Area - Takes the bottom row of right column */}
        <Box sx={{ 
          p: 1.5,
          position: 'relative',
          width: '100%', // Ensure full width
        }}>
          {renderDraggableArea('Body')}
        </Box>
      </Box>
      
      {/* snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Confirmation dialog for fabric change */}
      <Dialog
        open={showFabricChangeDialog}
        onClose={() => setShowFabricChangeDialog(false)}
        aria-labelledby="fabric-change-dialog-title"
        aria-describedby="fabric-change-dialog-description"
      >
        <DialogTitle id="fabric-change-dialog-title">
          Fabric Changed
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="fabric-change-dialog-description">
            You have changed the fabric from the original. Do you want to save with the new fabric?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowFabricChangeDialog(false);
            setPendingSaveAction(false);
          }} color="primary">
            Cancel
          </Button>
          <Button onClick={() => {
            setShowFabricChangeDialog(false);
            // Proceed with save using the new fabric
            if (pendingSaveAction) {
              saveProjectWithCurrentFabric();
            }
          }} color="primary" variant="contained" autoFocus>
            Save with New Fabric
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DesignPage; 