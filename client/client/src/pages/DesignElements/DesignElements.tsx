import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Grid,
  CircularProgress,
  FormControlLabel,
  Stack,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { artsAPI, designElementsAPI } from '../../services/api';

interface DesignElement {
  _id: string;
  name: string;
  artType: string;
  image: string;
  isActive: boolean;
}

interface Art {
  _id: string;
  name: string;
}

interface DialogState {
  open: boolean;
  mode: 'add' | 'edit';
  data: {
    _id?: string;
    name: string;
    artType: string;
    image: string;
    isActive: boolean;
  };
  imagePreview: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const DesignElements: React.FC = () => {
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [arts, setArts] = useState<Art[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    mode: 'add',
    data: {
      name: '',
      artType: '',
      image: '',
      isActive: true
    },
    imagePreview: ''
  });
  const { enqueueSnackbar } = useSnackbar();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchElements();
    fetchArts();
  }, []);

  const fetchElements = async () => {
    try {
      setLoading(true);
      const response = await designElementsAPI.getAll();
      console.log('Design Elements API Response:', response);
      if (response.data && response.data.success) {
        console.log('Setting elements data:', response.data.data);
        setElements(response.data.data);
      } else {
        console.log('No design elements found or invalid response format');
        setElements([]);
      }
    } catch (error) {
      console.error('Error fetching design elements:', error);
      enqueueSnackbar('Failed to fetch design elements', { variant: 'error' });
      setElements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArts = async () => {
    try {
      const response = await artsAPI.getAll();
      console.log('Arts API Response:', response);
      if (response.data && response.data.success) {
        console.log('Setting arts data:', response.data.data);
        setArts(response.data.data);
      } else {
        console.log('No arts found or invalid response format');
        setArts([]);
      }
    } catch (error) {
      console.error('Error fetching arts:', error);
      enqueueSnackbar('Failed to fetch arts', { variant: 'error' });
      setArts([]);
    }
  };

  const handleOpen = (mode: 'add' | 'edit', element?: DesignElement) => {
    setSelectedFile(null);
    setDialog({
      open: true,
      mode,
      data: element ? { ...element } : {
        name: '',
        artType: '',
        image: '',
        isActive: true
      },
      imagePreview: element ? getImageUrl(element.image) : ''
    });
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDialog({
      open: false,
      mode: 'add',
      data: {
        name: '',
        artType: '',
        image: '',
        isActive: true
      },
      imagePreview: ''
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create a preview URL for the selected file
      const previewUrl = URL.createObjectURL(file);
      setDialog(prev => ({
        ...prev,
        imagePreview: previewUrl
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!dialog.data.name || !dialog.data.artType) {
        enqueueSnackbar('Please enter a name and select an art type', { variant: 'error' });
        return;
      }

      if (dialog.mode === 'add' && !selectedFile) {
        enqueueSnackbar('Please select an image', { variant: 'error' });
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('name', dialog.data.name);
      formData.append('artType', dialog.data.artType);
      formData.append('isActive', String(dialog.data.isActive));
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      if (dialog.mode === 'add') {
        const response = await designElementsAPI.create(formData);
        if (response.data && response.data.success) {
          enqueueSnackbar('Design element created successfully', { variant: 'success' });
          handleClose();
          fetchElements();
        }
      } else if (dialog.mode === 'edit' && dialog.data._id) {
        const response = await designElementsAPI.update(dialog.data._id, formData);
        if (response.data && response.data.success) {
          enqueueSnackbar('Design element updated successfully', { variant: 'success' });
          handleClose();
          fetchElements();
        }
      }
    } catch (error) {
      console.error('Error submitting design element:', error);
      enqueueSnackbar('Failed to save design element', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await designElementsAPI.delete(id);
      enqueueSnackbar('Design element deleted successfully', { variant: 'success' });
      fetchElements();
    } catch (error) {
      console.error('Error deleting design element:', error);
      enqueueSnackbar('Failed to delete design element', { variant: 'error' });
    }
  };

  const handleToggleActive = async (element: DesignElement) => {
    try {
      await designElementsAPI.toggleStatus(element._id, !element.isActive);
      enqueueSnackbar('Design element status updated successfully', { variant: 'success' });
      fetchElements();
    } catch (error) {
      console.error('Error toggling design element status:', error);
      enqueueSnackbar('Failed to update design element status', { variant: 'error' });
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Design Elements</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen('add')}
        >
          Add Design Element
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Art Type</TableCell>
                <TableCell>Image</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {elements.length > 0 ? (
                elements.map((element) => (
                  <TableRow key={element._id}>
                    <TableCell>{element.name}</TableCell>
                    <TableCell>{element.artType}</TableCell>
                    <TableCell>
                      {element.image && (
                        <Box
                          component="img"
                          src={getImageUrl(element.image)}
                          alt={element.name}
                          sx={{ width: 100, height: 100, objectFit: 'contain' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={element.isActive}
                            onChange={() => handleToggleActive(element)}
                            color="primary"
                          />
                        }
                        label={element.isActive ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpen('edit', element)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(element._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body1" py={2}>
                      No design elements found. Click the "Add Design Element" button to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={dialog.open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'add' ? 'Add Design Element' : 'Edit Design Element'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={2}>
            <TextField
              label="Name"
              value={dialog.data.name}
              onChange={(e) => setDialog(prev => ({
                ...prev,
                data: { ...prev.data, name: e.target.value }
              }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Art Type</InputLabel>
              <Select
                value={dialog.data.artType}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, artType: e.target.value }
                }))}
                label="Art Type"
              >
                {arts.map((art) => (
                  <MenuItem key={art._id} value={art.name}>
                    {art.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="image-upload">
                <Button variant="outlined" component="span">
                  Upload Image
                </Button>
              </label>
              {dialog.imagePreview && (
                <Box mt={2}>
                  <img
                    src={dialog.imagePreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                  />
                </Box>
              )}
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={dialog.data.isActive}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, isActive: e.target.checked }
                  }))}
                  color="primary"
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {dialog.mode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DesignElements; 