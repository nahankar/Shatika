import React, { useState, useRef } from 'react';
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
} from '@mui/icons-material';

interface DesignPageProps {
  projectId?: string;
}

interface DesignShape {
  id: string;
  type: string;
  category: string;
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

const DesignPage: React.FC<DesignPageProps> = ({ projectId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('#666666');
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [colorPage, setColorPage] = useState(0);
  const dragItemRef = useRef<DesignShape | null>(null);

  // Separate placed shapes for each area
  const [bodyShapes, setBodyShapes] = useState<PlacedShape[]>([]);
  const [palluShapes, setPalluShapes] = useState<PlacedShape[]>([]);
  const [border1Shapes, setBorder1Shapes] = useState<PlacedShape[]>([]);
  const [border2Shapes, setBorder2Shapes] = useState<PlacedShape[]>([]);

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
  const designShapes: DesignShape[] = [
    // General Shapes
    {
      id: 'circle',
      type: 'Circle',
      category: 'General',
      render: (color) => (
        <Box sx={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          bgcolor: color,
        }} />
      )
    },
    {
      id: 'square',
      type: 'Square',
      category: 'General',
      render: (color) => (
        <Box sx={{
          width: '100%',
          height: '100%',
          bgcolor: color,
        }} />
      )
    },
    {
      id: 'triangle',
      type: 'Triangle',
      category: 'General',
      render: (color) => (
        <Box sx={{
          width: '100%',
          height: '100%',
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          bgcolor: color,
        }} />
      )
    },
    {
      id: 'rectangle',
      type: 'Rectangle',
      category: 'General',
      render: (color) => (
        <Box sx={{
          width: '100%',
          height: '60%',
          bgcolor: color,
        }} />
      )
    },
    {
      id: 'pentagon',
      type: 'Pentagon',
      category: 'General',
      render: (color) => (
        <Box sx={{
          width: '100%',
          height: '100%',
          clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
          bgcolor: color,
        }} />
      )
    },
    {
      id: 'star',
      type: 'Star',
      category: 'General',
      render: (color) => (
        <Box sx={{
          width: '100%',
          height: '100%',
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
          bgcolor: color,
        }} />
      )
    },
    // Spiritual Symbols
    {
      id: 'om',
      type: 'OM',
      category: 'Spiritual',
      render: (color) => (
        <Box sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'transparent',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='${encodeURIComponent(color)}' d='M50 5C25.2 5 5 25.2 5 50s20.2 45 45 45 45-20.2 45-45S74.8 5 50 5zm25 45c0 13.8-11.2 25-25 25s-25-11.2-25-25 11.2-25 25-25 25 11.2 25 25zm-25-15c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15z'/%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }} />
      )
    },
    {
      id: 'swastik',
      type: 'Swastik',
      category: 'Spiritual',
      render: (color) => (
        <Box sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'transparent',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='${encodeURIComponent(color)}' d='M40 20H60V40H80V60H60V80H40V60H20V40H40V20z'/%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }} />
      )
    },
    // Warli Art
    {
      id: 'warli-human',
      type: 'Warli Human',
      category: 'Warli',
      render: (color) => (
        <Box sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'transparent',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle fill='${encodeURIComponent(color)}' cx='50' cy='30' r='15'/%3E%3Cline stroke='${encodeURIComponent(color)}' stroke-width='4' x1='50' y1='45' x2='50' y2='80'/%3E%3Cline stroke='${encodeURIComponent(color)}' stroke-width='4' x1='50' y1='60' x2='20' y2='40'/%3E%3Cline stroke='${encodeURIComponent(color)}' stroke-width='4' x1='50' y1='60' x2='80' y2='40'/%3E%3Cline stroke='${encodeURIComponent(color)}' stroke-width='4' x1='50' y1='80' x2='20' y2='100'/%3E%3Cline stroke='${encodeURIComponent(color)}' stroke-width='4' x1='50' y1='80' x2='80' y2='100'/%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }} />
      )
    },
    // Kolam Art
    {
      id: 'kolam-basic',
      type: 'Basic Kolam',
      category: 'Kolam',
      render: (color) => (
        <Box sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'transparent',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='none' stroke='${encodeURIComponent(color)}' stroke-width='2' d='M10,50 C10,30 30,10 50,10 C70,10 90,30 90,50 C90,70 70,90 50,90 C30,90 10,70 10,50 Z M30,50 C30,40 40,30 50,30 C60,30 70,40 70,50 C70,60 60,70 50,70 C40,70 30,60 30,50 Z'/%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }} />
      )
    },
    // Mandala Art
    {
      id: 'mandala-simple',
      type: 'Simple Mandala',
      category: 'Mandala',
      render: (color) => (
        <Box sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'transparent',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='${encodeURIComponent(color)}' stroke-width='2'%3E%3Ccircle cx='50' cy='50' r='40'/%3E%3Ccircle cx='50' cy='50' r='30'/%3E%3Ccircle cx='50' cy='50' r='20'/%3E%3Cpath d='M50,10 L50,90 M10,50 L90,50 M22,22 L78,78 M22,78 L78,22'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }} />
      )
    },
  ];

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

  const handleDragStart = (shape: DesignShape) => {
    dragItemRef.current = shape;
  };

  const handleDrop = (e: React.DragEvent, targetArea: string) => {
    e.preventDefault();
    const shape = dragItemRef.current;
    if (!shape) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left - 25; // Center the shape
    const y = e.clientY - rect.top - 25;  // Center the shape

    const newShape: PlacedShape = {
      ...shape,
      x,
      y,
      width: 50,
      height: 50,
      rotation: 0,
      color: selectedColor,
    };

    const [setShapes, shapes] = getShapeSetterForArea(targetArea);
    setShapes([...shapes, newShape]);
    dragItemRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleShapeDelete = (shapeId: string, area: string) => {
    const [setShapes, shapes] = getShapeSetterForArea(area);
    setShapes(shapes.filter(shape => shape.id !== shapeId));
    setSelectedShape(null);
  };

  // Add click handler to deselect shape when clicking outside
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('draggable-area')) {
      setSelectedShape(null);
    }
  };

  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [undoStack, setUndoStack] = useState<DesignState[]>([]);
  const [redoStack, setRedoStack] = useState<DesignState[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

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

  // Add keyboard movement amount
  const KEYBOARD_MOVE_AMOUNT = 5;

  // Handle keyboard movement
  const handleKeyDown = (e: React.KeyboardEvent, areaName: string, index: number) => {
    if (!selectedShape) return;
    
    const [setShapes, shapes] = getShapeSetterForArea(areaName);
    const shape = shapes[index];
    let newX = shape.x;
    let newY = shape.y;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newX -= KEYBOARD_MOVE_AMOUNT;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newX += KEYBOARD_MOVE_AMOUNT;
        break;
      case 'ArrowUp':
        e.preventDefault();
        newY -= KEYBOARD_MOVE_AMOUNT;
        break;
      case 'ArrowDown':
        e.preventDefault();
        newY += KEYBOARD_MOVE_AMOUNT;
        break;
    }

    if (newX !== shape.x || newY !== shape.y) {
      saveToHistory();
      const updatedShapes = [...shapes];
      updatedShapes[index] = { ...shape, x: newX, y: newY };
      setShapes(updatedShapes);
    }
  };

  const renderDraggableArea = (areaName: string) => {
    const [_, shapes] = getShapeSetterForArea(areaName);
    
    return (
      <Box
        className="draggable-area"
        onClick={handleBackgroundClick}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).classList.contains('draggable-area')) {
            setSelectedShape(null);
          }
        }}
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          ...(isGridVisible && {
            backgroundImage: 'linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px)',
            backgroundSize: '20px 20px',
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
              transform: `rotate(${shape.rotation}deg)`,
              zIndex: selectedShape === `${areaName}-${index}` ? 1000 : 1,
            }}
            enableResizing={!isLocked}
            draggable={!isLocked}
            onDragStart={() => !isLocked && setSelectedShape(`${areaName}-${index}`)}
            onDragStop={(e, d) => {
              if (isLocked) return;
              saveToHistory();
              const [setShapes, shapes] = getShapeSetterForArea(areaName);
              const updatedShapes = [...shapes];
              updatedShapes[index] = { ...shape, x: d.x, y: d.y };
              setShapes(updatedShapes);
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              if (isLocked) return;
              saveToHistory();
              const [setShapes, shapes] = getShapeSetterForArea(areaName);
              const updatedShapes = [...shapes];
              updatedShapes[index] = {
                ...shape,
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                x: position.x,
                y: position.y,
              };
              setShapes(updatedShapes);
            }}
          >
            <Box 
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, areaName, index)}
              sx={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative',
                cursor: isLocked ? 'default' : 'move',
                outline: selectedShape === `${areaName}-${index}` ? '2px solid #2196f3' : 'none',
                '&:focus': {
                  outline: '2px solid #2196f3',
                },
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (!isLocked) {
                  setSelectedShape(`${areaName}-${index}`);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isLocked) {
                  setSelectedShape(`${areaName}-${index}`);
                }
              }}
            >
              {shape.render(shape.color)}
              {selectedShape === `${areaName}-${index}` && !isLocked && (
                <Box sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  display: 'none', // Hide by default
                  '.selected-element:hover &, .selected-element:focus &': {
                    display: 'flex', // Show on hover/focus
                  },
                  gap: 0.5,
                  bgcolor: 'white',
                  padding: '2px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveToHistory();
                      const [setShapes, shapes] = getShapeSetterForArea(areaName);
                      const updatedShapes = [...shapes];
                      updatedShapes[index] = {
                        ...shape,
                        rotation: (shape.rotation + 45) % 360,
                      };
                      setShapes(updatedShapes);
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
        border: '1px solid #ccc',
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
          borderBottom: '1px solid #ccc',
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
          p: 1.5,
          overflowY: 'auto',
        }}>
          <Typography variant="subtitle1" gutterBottom>
            Design Blocks
          </Typography>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)', // Changed to 4 columns
            gap: 0.5,
          }}>
            {designShapes.map((shape) => (
              <Box
                key={shape.id}
                draggable
                onDragStart={() => handleDragStart(shape)}
                sx={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  '&:active': {
                    cursor: 'grabbing',
                  },
                }}
              >
                <Box sx={{ 
                  width: '40px', // Kept original size
                  height: '40px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {shape.render(selectedColor)}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Body Area */}
        <Box sx={{ 
          borderRight: '1px solid #ccc',
          borderBottom: '1px solid #ccc',
          p: 1.5,
          position: 'relative',
        }}>
          {renderDraggableArea('Body')}
        </Box>

        {/* Pallu Area */}
        <Box sx={{ 
          borderBottom: '1px solid #ccc',
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