import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import {
  Box,
  IconButton,
  TextField,
  Typography,
  Paper,
  InputAdornment,
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
  BorderOuter as BorderIcon,
} from '@mui/icons-material';
import styles from './DesignPage.module.css';
import { designElementsAPI } from '../../services/api';

interface DesignPageProps {
  projectId?: string;
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
}

interface DesignState {
  'Body': PlacedShape[];
  'Pallu': PlacedShape[];
  'Border 1': PlacedShape[];
  'Border 2': PlacedShape[];
}

interface DragItem {
  shape: PlacedShape;
  fromArea: string;
}

const DesignPage: React.FC<DesignPageProps> = ({ projectId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('#666666');
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [colorPage, setColorPage] = useState(0);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isBordersVisible, setIsBordersVisible] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [undoStack, setUndoStack] = useState<DesignState[]>([]);
  const [redoStack, setRedoStack] = useState<DesignState[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const dragItemRef = useRef<DragItem | null>(null);

  // Separate placed shapes for each area
  const [bodyShapes, setBodyShapes] = useState<PlacedShape[]>([]);
  const [palluShapes, setPalluShapes] = useState<PlacedShape[]>([]);
  const [border1Shapes, setBorder1Shapes] = useState<PlacedShape[]>([]);
  const [border2Shapes, setBorder2Shapes] = useState<PlacedShape[]>([]);
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

  useEffect(() => {
    fetchDesignElements();
  }, []);

  const fetchDesignElements = async () => {
    try {
      const response = await designElementsAPI.getAll();
      if (response.data && response.data.success) {
        const elements = response.data.data.map((element: any) => ({
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
        setDesignShapes(elements);
      } else {
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
    switch (area) {
      case 'Body':
        return [setBodyShapes, bodyShapes];
      case 'Pallu':
        return [setPalluShapes, palluShapes];
      case 'Border 1':
        return [setBorder1Shapes, border1Shapes];
      case 'Border 2':
        return [setBorder2Shapes, border2Shapes];
      default:
        return [setBodyShapes, bodyShapes];
    }
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
  }, [selectedShape, isLocked, bodyShapes, palluShapes, border1Shapes, border2Shapes]);

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
      'Pallu': [...palluShapes],
      'Border 1': [...border1Shapes],
      'Border 2': [...border2Shapes],
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
      'Pallu': [...palluShapes],
      'Border 1': [...border1Shapes],
      'Border 2': [...border2Shapes],
    };
    
    setRedoStack([...redoStack, currentState]);
    setBodyShapes(previousState['Body']);
    setPalluShapes(previousState['Pallu']);
    setBorder1Shapes(previousState['Border 1']);
    setBorder2Shapes(previousState['Border 2']);
    setUndoStack(undoStack.slice(0, -1));
  };

  // Redo function
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    const currentState: DesignState = {
      'Body': [...bodyShapes],
      'Pallu': [...palluShapes],
      'Border 1': [...border1Shapes],
      'Border 2': [...border2Shapes],
    };
    
    setUndoStack([...undoStack, currentState]);
    setBodyShapes(nextState['Body']);
    setPalluShapes(nextState['Pallu']);
    setBorder1Shapes(nextState['Border 1']);
    setBorder2Shapes(nextState['Border 2']);
    setRedoStack(redoStack.slice(0, -1));
  };

  // Reset function
  const handleReset = () => {
    saveToHistory();
    setBodyShapes([]);
    setPalluShapes([]);
    setBorder1Shapes([]);
    setBorder2Shapes([]);
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

  // Save design
  const handleSave = () => {
    const design = {
      body: bodyShapes,
      pallu: palluShapes,
      border1: border1Shapes,
      border2: border2Shapes,
      isLocked,
      isFavorite,
    };
    // TODO: Implement actual save functionality
    console.log('Saving design:', design);
  };

  // Add to cart
  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Adding to cart');
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
          ...(isGridVisible && {
            backgroundImage: 'linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px)',
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          }),
        }}
        onDrop={(e) => handleDrop(e, areaName)}
        onDragOver={handleDragOver}
      >
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
              zIndex: selectedShape === `${areaName}-${index}` ? 1000 : 1,
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
              
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              >
                {shape.render(shape.color)}
              </Box>
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
        gap: 1,
        p: 1,
      }}>
        {filteredShapes.map((element) => (
          <Box
            key={element.id}
            sx={{
              width: '100%',
              aspectRatio: '1/1',
              cursor: 'grab',
              border: selectedShape === element.id ? '2px solid #1976d2' : '1px solid #ccc',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                borderColor: 'primary.main',
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
        width: '150%', // Increased from 125% to 150%
        transform: 'translateX(-16.5%)', // Adjusted for new width
      }}>
        <TextField
          fullWidth
          placeholder="Project Name :"
          variant="outlined"
          size="small"
        />
        <TextField
          fullWidth
          placeholder="Description"
          variant="outlined"
          size="small"
        />
        <TextField
          fullWidth
          placeholder="Project Category"
          variant="outlined"
          size="small"
        />
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
          width: '150%',
          transform: 'translateX(-16.5%)',
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
          <IconButton size="small" onClick={() => setIsBordersVisible(!isBordersVisible)}>
            <BorderIcon color={isBordersVisible ? 'primary' : 'inherit'} />
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

      {/* Main Content Grid */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: '250px 4fr 1fr',
        gridTemplateRows: '80px 1fr 80px', // Increased height for borders
        height: '70vh',
        border: '1px solid #ccc', // Always keep the outer border
        width: '150%',
        transform: 'translateX(-16.5%)',
        borderTop: 'none',
      }}>
        {/* First Row: Search and Border 1 */}
        <Box sx={{ 
          borderRight: '1px solid #ccc',
          borderBottom: '1px solid #ccc',
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          height: '80px', // Match border height
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
            }}
          />
          <ChevronLeftIcon />
        </Box>

        <Box sx={{ 
          gridColumn: '2/4',
          borderBottom: isBordersVisible ? '1px solid #ccc' : 'none', // Border 1 to Body border
          p: 1.5,
          height: '80px', // Match border height
          position: 'relative',
        }}>
          {renderDraggableArea('Border 1')}
        </Box>

        {/* Second Row: Design Blocks */}
        <Box sx={{ 
          borderRight: '1px solid #ccc',
          borderBottom: '1px solid #ccc',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <Typography variant="subtitle1" sx={{ p: 1.5, pb: 0.5 }}>
            Design Blocks
          </Typography>
          {renderDesignBlocks()}
        </Box>

        {/* Body Area */}
        <Box sx={{ 
          borderRight: isBordersVisible ? '1px solid #ccc' : 'none', // Body to Pallu border
          borderBottom: isBordersVisible ? '1px solid #ccc' : 'none', // Body to Border 2 border
          p: 1.5,
          position: 'relative',
        }}>
          {renderDraggableArea('Body')}
        </Box>

        {/* Pallu Area */}
        <Box sx={{ 
          borderBottom: isBordersVisible ? '1px solid #ccc' : 'none', // Pallu to Border 2 border
          p: 1.5,
          position: 'relative',
        }}>
          {renderDraggableArea('Pallu')}
        </Box>

        {/* Color Palette with Navigation */}
        <Box sx={{ 
          borderRight: '1px solid #ccc',
          p: 1.5,
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
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
                  height: '20px',
                  bgcolor: color,
                  cursor: 'pointer',
                  border: selectedColor === color ? '2px solid #000' : 'none',
                  '&:hover': { opacity: 0.8 },
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

        {/* Border 2 Area */}
        <Box sx={{ 
          gridColumn: '2/4',
          p: 1.5,
          height: '80px', // Match border height
          position: 'relative',
        }}>
          {renderDraggableArea('Border 2')}
        </Box>
      </Box>
    </Box>
  );
};

export default DesignPage; 