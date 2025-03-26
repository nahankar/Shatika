import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Menu,
  CardMedia,
  CardActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { projectsAPI, categoriesAPI } from '../../services/api';

// Define interface for project data
interface Project {
  _id: string;
  name: string;
  description: string;
  fabricCategory: string;
  materialName?: string;
  materialId?: string;
  fabricImage?: string;
  createdAt: string;
  updatedAt: string;
}

// Define interface for category data
interface Category {
  _id: string;
  name: string;
}

const DIYPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Function to get API base URL
  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || '';
  };

  // Function to get proper image URL
  const getImageUrl = (path: string | undefined) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${getApiUrl()}${path}`;
  };

  // Function to get category name by ID
  const getCategoryNameById = (id: string): string => {
    if (!id) return '';
    
    // Check if it's a valid MongoDB ObjectId format
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isMongoId) {
      // If it's not an ID format, return it as is (it might be a name already)
      return id;
    }
    
    // Find the category with matching ID
    const category = categories.find(cat => cat._id === id);
    return category ? category.name : id; // Return ID as fallback if category not found
  };

  // Fetch projects and categories on component mount
  useEffect(() => {
    fetchCategories();
    fetchProjects();
  }, [sortBy]);

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.data && response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Function to fetch projects
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectsAPI.getAll();
      if (response.data && response.data.success) {
        let fetchedProjects = response.data.data;
        
        // Sort projects based on selected criteria
        if (sortBy === 'newest') {
          fetchedProjects = fetchedProjects.sort((a: Project, b: Project) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else if (sortBy === 'oldest') {
          fetchedProjects = fetchedProjects.sort((a: Project, b: Project) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        } else if (sortBy === 'name') {
          fetchedProjects = fetchedProjects.sort((a: Project, b: Project) => 
            a.name.localeCompare(b.name)
          );
        }
        
        setProjects(fetchedProjects);
      } else {
        setError('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('An error occurred while fetching projects');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle project deletion
  const handleDeleteProject = async (id: string) => {
    try {
      const response = await projectsAPI.delete(id);
      if (response.data && response.data.success) {
        // Remove deleted project from state
        setProjects(projects.filter(project => project._id !== id));
      } else {
        setError('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('An error occurred while deleting the project');
    } finally {
      handleMenuClose();
    }
  };

  // Functions for menu handling
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedProjectId(projectId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProjectId(null);
  };

  const handleAddProject = () => {
    navigate('/diy/add');
  };

  const handleEditProject = (id: string) => {
    navigate(`/diy/design/${id}`);
    handleMenuClose();
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'list' | 'grid') => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Filter projects based on search query - update to use category name for searching
  const filteredProjects = projects.filter(project => {
    const categoryName = getCategoryNameById(project.fabricCategory);
    return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          DIY Projects
        </Typography>
      </Box>

      {/* Search and Filter Section */}
      <Box sx={{ mb: 4, width: '100%' }}>
        <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              size="medium"
              sx={{ height: '100%' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="medium">
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="name">Name</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProject}
              size="large"
              sx={{ 
                height: '56px', // Match height of MUI TextField/Select
                textTransform: 'none'
              }}
            >
              Add Project
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', height: '56px' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                sx={{ height: '100%' }}
              >
                <ToggleButton value="list" aria-label="list view" sx={{ height: '100%' }}>
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="grid" aria-label="grid view" sx={{ height: '100%' }}>
                  <ViewModuleIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        // Projects Grid/List
        <>
          {filteredProjects.length === 0 ? (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No projects found. Create your first project!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredProjects.map((project) => (
                <Grid 
                  item 
                  key={project._id} 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  lg={3}
                  sx={{ 
                    display: 'flex',
                    height: '100%'
                  }}
                >
                  <Card sx={{ 
                    height: '100%', 
                    width: '100%',
                    minWidth: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                    }
                  }}>
                    {project.fabricImage && viewMode === 'grid' && (
                      <CardMedia
                        component="img"
                        height={viewMode === 'grid' ? '160px' : '200px'}
                        image={getImageUrl(project.fabricImage)}
                        alt={project.name}
                        sx={{ width: '100%', objectFit: 'cover' }}
                      />
                    )}
                    <CardContent sx={{ 
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      p: 2,
                      pb: 1,
                      height: viewMode === 'grid' ? '140px' : 'auto',
                      overflow: 'hidden',
                      width: '100%'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        width: '100%'
                      }}>
                        <Typography variant="h6" component="div" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 'calc(100% - 40px)'
                        }}>
                          {project.name}
                        </Typography>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, project._id)}>
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mt: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        height: '40px',
                        width: '100%'
                      }}>
                        {project.description}
                      </Typography>
                      
                      <Box sx={{ 
                        mt: 'auto',
                        width: '100%'
                      }}>
                        <Typography variant="body2" color="primary" sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%'
                        }}>
                          Category: {getCategoryNameById(project.fabricCategory)}
                        </Typography>

                        {project.materialName && (
                          <Typography variant="body2" color="primary" sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%'
                          }}>
                            Material: {project.materialName}
                          </Typography>
                        )}
                      </Box>
                      
                      {project.fabricImage && viewMode === 'list' && (
                        <Box sx={{ mt: 2 }}>
                          <img
                            src={getImageUrl(project.fabricImage)}
                            alt={project.name}
                            style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                          />
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ 
                      width: '100%',
                      padding: '8px 16px',
                      borderTop: '1px solid rgba(0, 0, 0, 0.08)'
                    }}>
                      <Button size="small" onClick={() => handleEditProject(project._id)}>
                        Edit Design
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedProjectId && handleEditProject(selectedProjectId)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Design
        </MenuItem>
        <MenuItem onClick={() => selectedProjectId && handleDeleteProject(selectedProjectId)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Project
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DIYPage; 