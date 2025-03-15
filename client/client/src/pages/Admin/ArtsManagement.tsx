import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';

interface Art {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
}

const ArtsManagement = () => {
  const [arts, setArts] = useState<Art[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedArt, setSelectedArt] = useState<Art | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    price: '',
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchArts();
  }, []);

  const fetchArts = async () => {
    try {
      const response = await fetch('/api/arts');
      if (!response.ok) throw new Error('Failed to fetch arts');
      const data = await response.json();
      setArts(data);
    } catch (error) {
      enqueueSnackbar('Failed to fetch arts', { variant: 'error' });
    }
  };

  const handleOpen = (art?: Art) => {
    if (art) {
      setSelectedArt(art);
      setFormData({
        name: art.name,
        description: art.description,
        imageUrl: art.imageUrl,
        price: art.price.toString(),
      });
    } else {
      setSelectedArt(null);
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        price: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedArt(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      price: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = selectedArt ? 'PUT' : 'POST';
      const url = selectedArt ? `/api/arts/${selectedArt.id}` : '/api/arts';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      if (!response.ok) throw new Error('Failed to save art');
      
      enqueueSnackbar(`Art ${selectedArt ? 'updated' : 'created'} successfully`, {
        variant: 'success',
      });
      handleClose();
      fetchArts();
    } catch (error) {
      enqueueSnackbar('Failed to save art', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this art?')) return;
    
    try {
      const response = await fetch(`/api/arts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete art');
      
      enqueueSnackbar('Art deleted successfully', { variant: 'success' });
      fetchArts();
    } catch (error) {
      enqueueSnackbar('Failed to delete art', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Arts Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add New Art
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Image URL</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {arts.map((art) => (
              <TableRow key={art.id}>
                <TableCell>{art.name}</TableCell>
                <TableCell>{art.description}</TableCell>
                <TableCell>{art.imageUrl}</TableCell>
                <TableCell>${art.price.toFixed(2)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(art)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(art.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedArt ? 'Edit Art' : 'Add New Art'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={4}
              required
            />
            <TextField
              fullWidth
              label="Image URL"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedArt ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArtsManagement; 