import React, { useState, useRef, useEffect } from 'react';
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
import { designElementsAPI, projectsAPI, productsAPI } from '../../services/api';

interface ProductThumbnail {
  _id: string;
  name: string;
  images: string[];
  description?: string;
  price?: number;
  category?: string;
  material?: string;
  materialType?: string;
  materials?: Array<{name: string} | string>;
  materialInfo?: string;
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

  useEffect(() => {
    // Fetch design elements as soon as component mounts
    fetchDesignElements();
  }, []);

  // Separate useEffect to handle project data loading
  useEffect(() => {
    if (projectData) {
      console.log("Project data loaded:", projectData);
      setProjectName(projectData.name || '');
      setProjectDescription(projectData.description || '');
      setFabricCategory(projectData.fabricCategory || '');
      
      // If there's design data, save it for later processing once design elements are loaded
      if (projectData.designData) {
        console.log("Found design data, saving for restoration:", projectData.designData);
        setPendingDesignData(projectData.designData);
      }
      
      // Process selected product ID and fabric image
      console.log("Selected product ID:", projectData.selectedProductId);
      
      // Store the original product ID for checking if fabric changed later
      if (projectData.selectedProductId) {
        const originalId = typeof projectData.selectedProductId === 'object' 
          ? projectData.selectedProductId._id 
          : projectData.selectedProductId;
        
        console.log("Storing original product ID:", originalId);
        setOriginalProductId(originalId);
        setSelectedCarouselProduct(originalId);
      }
      
      // Check for populated selectedProductId (which will be an object with the product data)
      if (projectData.selectedProductId) {
        // Check if it's a populated object or just an ID string
        if (typeof projectData.selectedProductId === 'object') {
          console.log("Found populated product data:", projectData.selectedProductId);
          // Get the first image from the product
          if (projectData.selectedProductId.images && projectData.selectedProductId.images.length > 0) {
            const productImage = projectData.selectedProductId.images[0];
            // Construct URL for the image
            if (productImage.startsWith('http')) {
              setFabricImage(productImage);
            } else {
              // Make sure we don't duplicate slashes
              const imagePath = productImage.startsWith('/') 
                ? productImage 
                : `/${productImage}`;
                
              const imageUrl = `http://localhost:5173${imagePath}`;
              console.log("Constructed product image URL from populated object:", imageUrl);
              setFabricImage(imageUrl);
            }
          }
        } else if (typeof projectData.selectedProductId === 'string') {
          // We have just the ID, need to fetch the product data
          console.log("Found product ID, need to fetch product data:", projectData.selectedProductId);
          
          // Create an async function inside the useEffect
          const loadProductData = async () => {
            const productData = await fetchProductData(projectData.selectedProductId as string);
            
            if (productData && productData.images && productData.images.length > 0) {
              const productImage = productData.images[0];
              
              // Construct URL for the image
              if (productImage.startsWith('http')) {
                setFabricImage(productImage);
              } else {
                // Make sure we don't duplicate slashes
                const imagePath = productImage.startsWith('/') 
                  ? productImage 
                  : `/${productImage}`;
                  
                const imageUrl = `http://localhost:5173${imagePath}`;
                console.log("Constructed product image URL from fetched product:", imageUrl);
                setFabricImage(imageUrl);
              }
            }
          };
          
          // Call the async function
          loadProductData();
        }
      }
      // Fall back to fabricImage if selectedProductId doesn't have image data
      else if (projectData.fabricImage) {
        console.log("Found fabric image:", projectData.fabricImage);
        // If it's already a full URL
        if (projectData.fabricImage.startsWith('http')) {
          setFabricImage(projectData.fabricImage);
        } else {
          // Make sure we don't duplicate slashes
          const imagePath = projectData.fabricImage.startsWith('/') 
            ? projectData.fabricImage 
            : `/${projectData.fabricImage}`;
            
          // Use a direct hard-coded URL for debugging purposes
          const imageUrl = `http://localhost:5173${imagePath}`;
          console.log("Constructed image URL:", imageUrl);
          setFabricImage(imageUrl);
        }
      } else {
        console.log("No fabric image or selectedProduct found in project data");
      }
    }
  }, [projectData]);

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
  }, [designShapes, pendingDesignData]);

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

  // Apply the selected fabric from carousel
  const handleProductSelect = async (product: ProductThumbnail) => {
    setSelectedCarouselProduct(product._id);
    
    // Log product information for debugging
    const materialInfo = product.material || 
                         product.materialType || 
                         (product.materials && product.materials.length > 0 ? 
                           (typeof product.materials[0] === 'object' && 'name' in product.materials[0] ? 
                             product.materials[0].name : product.materials[0]) : '');
    
    console.log("Selected product:", {
      id: product._id,
      name: product.name,
      materialInfo,
      category: product.category
    });
    
    // Set the fabric image from the product
    if (product.images && product.images.length > 0) {
      const productImage = product.images[0];
      
      // Set fabric image using the same logic as before
      if (productImage.startsWith('http')) {
        setFabricImage(productImage);
      } else {
        const imagePath = productImage.startsWith('/') ? productImage : `/${productImage}`;
        const imageUrl = `http://localhost:5173${imagePath}`;
        console.log("Selected product image:", imageUrl);
        setFabricImage(imageUrl);
      }
    }
    
    // Save this selection on next save
    // Note: this doesn't save immediately, but will be included in the next handleSave call
  };

  // The save function that actually performs the save operation
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
      formData.append('fabricCategory', fabricCategory);
      
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
            {/* Only show Material Type */}
            {(() => {
              // Try to get the product info from different sources
              let materialType = '';
              
              // Check if we have a populated product object
              if (projectData && typeof projectData.selectedProductId === 'object' && projectData.selectedProductId) {
                const product = projectData.selectedProductId;
                
                // First try standard material fields
                if (typeof product.material === 'string') {
                  materialType = product.material;
                } else if (typeof product.materialType === 'string') {
                  materialType = product.materialType;
                } 
                // Then check other possible fields
                else if (product.materials && product.materials.length > 0) {
                  if (typeof product.materials[0] === 'object' && 'name' in product.materials[0]) {
                    materialType = product.materials[0].name.toString();
                  } else if (typeof product.materials[0] === 'string') {
                    materialType = product.materials[0];
                  }
                } else if (typeof product.materialInfo === 'string') {
                  materialType = product.materialInfo;
                }
                
                // If we still don't have material type, check the product name
                if (!materialType && product.name) {
                  // Extract material from product name
                  if (product.name.includes('Khadi Cotton')) {
                    materialType = 'Khadi Cotton';
                  } else if (product.name.includes('Pure Cotton')) {
                    materialType = 'Pure Cotton';
                  } else if (product.name.includes('Cotton')) {
                    materialType = 'Cotton';
                  } else if (product.name.includes('Silk')) {
                    materialType = 'Silk';
                  }
                }
              } 
              // Check if we have a selected product in carousel
              else if (selectedCarouselProduct && diyProducts.length > 0) {
                const product = diyProducts.find(p => p._id === selectedCarouselProduct);
                if (product) {
                  // First try standard material fields
                  if (typeof product.material === 'string') {
                    materialType = product.material;
                  } else if (typeof product.materialType === 'string') {
                    materialType = product.materialType;
                  }
                  
                  // If we still don't have material type, check the product name
                  if (!materialType && product.name) {
                    // Extract material from product name
                    if (product.name.includes('Khadi Cotton')) {
                      materialType = 'Khadi Cotton';
                    } else if (product.name.includes('Pure Cotton')) {
                      materialType = 'Pure Cotton';
                    } else if (product.name.includes('Cotton')) {
                      materialType = 'Cotton';
                    } else if (product.name.includes('Silk')) {
                      materialType = 'Silk';
                    }
                  }
                }
              }
              
              // Fallback to looking at product ID directly if needed
              if (!materialType && typeof projectData?.selectedProductId === 'string') {
                const productId = projectData.selectedProductId;
                
                // Hard-coded mapping for the products in the screenshots
                if (productId.includes('67e134')) {
                  materialType = 'Khadi Cotton'; // Plain Green
                } else if (productId.includes('67e137')) {
                  materialType = 'Pure Cotton'; // Plain Pink
                }
              }
              
              // If all else fails, check project data directly
              if (!materialType && projectData) {
                const fabricInfo = projectData.fabricCategory;
                if (fabricInfo === 'Sarees') {
                  materialType = 'Cotton'; // Default assumption for sarees
                }
              }
              
              // Ensure materialType is a valid display string
              const safeString = typeof materialType === 'string' && materialType && 
                !materialType.includes('67d') // Exclude ID-like strings
                ? materialType 
                : 'Cotton'; // Default fallback
              
              console.log("Material type for label:", safeString);
              
              return safeString ? (
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                  {safeString}
                </Typography>
              ) : null;
            })()}
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
          select
          label="Fabric Category"
          variant="outlined"
          size="small"
          value={fabricCategory}
          onChange={(e) => setFabricCategory(e.target.value)}
        >
          <MenuItem value="Bags">Bags</MenuItem>
          <MenuItem value="Blouses">Blouses</MenuItem>
          <MenuItem value="Sarees">Sarees</MenuItem>
          <MenuItem value="Scarfs / Chunni / Dupatta">Scarfs / Chunni / Dupatta</MenuItem>
        </TextField>
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
          <IconButton size="small" onClick={handleDeleteSelected}><DeleteIcon /></IconButton>
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
          <IconButton 
            size="small" 
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <FavoriteIcon color={isFavorite ? 'error' : 'inherit'} />
          </IconButton>
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
          px: 1.5, // Match the padding of the search box
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
            px: 4, // Add horizontal padding to account for arrows
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
                {/* Render all thumbnails for the current page */}
                {diyProducts
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
                    const materialInfo = product.material || 
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