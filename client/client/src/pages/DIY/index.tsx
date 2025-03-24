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
import { projectsAPI } from '../../services/api';

// Define interface for project data
interface Project {
  _id: string;
  name: string;
  description: string;
  fabricCategory: string;
  fabricImage?: string;
  createdAt: string;
  updatedAt: string;
}

const DIYPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [projects, setProjects] = useState<Project[]>([]);
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

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, [sortBy]);

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

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.fabricCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          DIY Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProject}
          sx={{ mb: 2 }}
        >
          Add Project
        </Button>
      </Box>

      {/* Search and Filter Section */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
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
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
              >
                <ToggleButton value="list" aria-label="list view">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="grid" aria-label="grid view">
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
                <Grid item key={project._id} xs={12} sm={viewMode === 'grid' ? 6 : 12} md={viewMode === 'grid' ? 4 : 12}>
                  <Card>
                    {project.fabricImage && viewMode === 'grid' && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={getImageUrl(project.fabricImage)}
                        alt={project.name}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="div">
                          {project.name}
                        </Typography>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, project._id)}>
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {project.description}
                      </Typography>
                      
                      <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                        Category: {project.fabricCategory}
                      </Typography>
                      
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
                    <CardActions>
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