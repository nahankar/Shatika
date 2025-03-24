import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import DesignPage from './DesignPage';
import { projectsAPI } from '../../services/api';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

const DesignPageWrapper = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if we have project data passed via location state
  const projectDataFromState = location.state?.projectData;
  
  useEffect(() => {
    // If we have project data from state, use it directly
    if (projectDataFromState) {
      setProject(projectDataFromState);
      setLoading(false);
      return;
    }
    
    // If we have a projectId (and it's not a temp ID), fetch the project data
    if (projectId && !projectId.startsWith('temp-')) {
      fetchProject();
    } else {
      // No project data and no valid ID, set loading to false
      setLoading(false);
    }
  }, [projectId, projectDataFromState]);
  
  const fetchProject = async () => {
    try {
      const response = await projectsAPI.getById(projectId as string);
      if (response.data && response.data.success) {
        setProject(response.data.data);
      } else {
        setError('Failed to load project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('An error occurred while loading the project');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }
  
  return <DesignPage projectId={projectId} projectData={project} />;
};

export default DesignPageWrapper; 