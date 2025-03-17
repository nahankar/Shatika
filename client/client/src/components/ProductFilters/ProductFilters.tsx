import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  Slider,
  Button,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { RootState, useAppDispatch } from '../../redux/store';
import { setFilters } from '../../redux/slices/productsSlice';
import { categoriesAPI, materialsAPI, artsAPI } from '../../services/api';
import { API_BASE_URL } from '../../config';

interface Category {
  _id: string;
  name: string;
}

interface Material {
  _id: string;
  name: string;
}

interface Art {
  _id: string;
  name: string;
}

const ProductFilters = () => {
  const dispatch = useAppDispatch();
  const { filters } = useSelector((state: RootState) => state.products);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(filters.categories);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(filters.materials || []);
  const [selectedArts, setSelectedArts] = useState<string[]>(filters.arts || []);
  const [priceRange, setPriceRange] = useState<[number, number]>(filters.priceRange || [0, 50000]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [arts, setArts] = useState<Art[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll();
        if (response.data.success) {
          setCategories(response.data.data);
        } else {
          console.error('Failed to fetch categories:', response.data.message);
          setCategories([]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      }
    };

    const fetchMaterials = async () => {
      try {
        const response = await materialsAPI.getAll();
        if (response.data.success) {
          setMaterials(response.data.data);
        } else {
          console.error('Failed to fetch materials:', response.data.message);
          setMaterials([]);
        }
      } catch (error) {
        console.error('Failed to fetch materials:', error);
        setMaterials([]);
      }
    };

    const fetchArts = async () => {
      try {
        const response = await artsAPI.getAll();
        if (response.data.success) {
          setArts(response.data.data);
        } else {
          console.error('Failed to fetch arts:', response.data.message);
          setArts([]);
        }
      } catch (error) {
        console.error('Failed to fetch arts:', error);
        setArts([]);
      }
    };

    fetchCategories();
    fetchMaterials();
    fetchArts();
  }, []);

  const handleCategoryChange = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newCategories);
    dispatch(setFilters({ categories: newCategories }));
  };

  const handleMaterialChange = (material: string) => {
    const newMaterials = selectedMaterials.includes(material)
      ? selectedMaterials.filter(m => m !== material)
      : [...selectedMaterials, material];
    
    setSelectedMaterials(newMaterials);
    dispatch(setFilters({ materials: newMaterials }));
  };

  const handleArtChange = (art: string) => {
    const newArts = selectedArts.includes(art)
      ? selectedArts.filter(a => a !== art)
      : [...selectedArts, art];
    
    setSelectedArts(newArts);
    dispatch(setFilters({ arts: newArts }));
  };

  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue) && newValue.length === 2) {
      const [min, max] = newValue;
      setPriceRange([min, max]);
      dispatch(setFilters({ priceRange: [min, max] }));
    }
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedMaterials([]);
    setSelectedArts([]);
    setPriceRange([0, 50000]);
    dispatch(setFilters({
      categories: [],
      materials: [],
      arts: [],
      priceRange: null,
      tags: [],
    }));
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 280 }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Filters</Typography>
        <Button color="primary" onClick={handleClearFilters}>
          Clear All
        </Button>
      </Box>
      
      <Divider />

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Categories</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {categories.map((category) => (
              <FormControlLabel
                key={category._id}
                control={
                  <Checkbox
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => handleCategoryChange(category.name)}
                  />
                }
                label={category.name}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Materials</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {materials.map((material) => (
              <FormControlLabel
                key={material._id}
                control={
                  <Checkbox
                    checked={selectedMaterials.includes(material.name)}
                    onChange={() => handleMaterialChange(material.name)}
                  />
                }
                label={material.name}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Arts</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {arts.map((art) => (
              <FormControlLabel
                key={art._id}
                control={
                  <Checkbox
                    checked={selectedArts.includes(art.name)}
                    onChange={() => handleArtChange(art.name)}
                  />
                }
                label={art.name}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Price Range</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 2 }}>
            <Slider
              value={priceRange}
              onChange={handlePriceChange}
              valueLabelDisplay="auto"
              min={0}
              max={50000}
              step={1000}
              marks={[
                { value: 0, label: '₹0' },
                { value: 50000, label: '₹50k' }
              ]}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2">₹{priceRange[0].toLocaleString()}</Typography>
              <Typography variant="body2">₹{priceRange[1].toLocaleString()}</Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ProductFilters; 