import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';

const AddProject = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fabricCategory: '',
    fabricImage: null as File | null,
  });

  // Placeholder fabric categories
  const fabricCategories = [
    'Cotton',
    'Silk',
    'Wool',
    'Linen',
    'Synthetic',
    // Add more categories as needed
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: any) => {
    setFormData((prev) => ({
      ...prev,
      fabricCategory: e.target.value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        fabricImage: e.target.files![0],
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement project creation logic
    console.log('Form submitted:', formData);
    
    // For now, navigate to design page with a temporary ID
    // Later, this will be replaced with the actual project ID from the backend
    const tempProjectId = 'temp-' + Date.now();
    navigate(`/diy/design/${tempProjectId}`, { 
      state: { 
        projectData: {
          name: formData.name,
          description: formData.description,
          category: formData.fabricCategory,
        }
      }
    });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Add Project
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Fabric Category</InputLabel>
                <Select
                  value={formData.fabricCategory}
                  label="Select Fabric Category"
                  onChange={handleSelectChange}
                >
                  {fabricCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="fabric-image-upload"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="fabric-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  fullWidth
                >
                  Select Actual Pic of Plain Fabric
                </Button>
              </label>
            </Grid>

            {formData.fabricImage && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Selected Fabric Image:
                  </Typography>
                  <Box
                    component="img"
                    src={URL.createObjectURL(formData.fabricImage)}
                    alt="Selected fabric"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                type="submit"
              >
                Start Designing
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AddProject; 