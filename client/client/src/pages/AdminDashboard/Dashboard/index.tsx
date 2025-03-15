import React from 'react';
import { Box, Typography, Grid, Card, CardContent, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    { title: 'Products', path: 'products' },
    { title: 'Categories', path: 'categories' },
    { title: 'Materials', path: 'materials' },
    { title: 'Arts', path: 'arts' },
    { title: 'Users', path: 'users' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {sections.map((section) => (
          <Grid item xs={12} sm={6} md={4} key={section.path}>
            <Card>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{section.title}</Typography>
                <IconButton 
                  color="primary"
                  onClick={() => navigate(section.path)}
                  sx={{ 
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    width: 40,
                    height: 40,
                  }}
                >
                  <AddIcon />
                </IconButton>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 