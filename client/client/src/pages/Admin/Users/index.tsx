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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { usersAPI, authAPI } from '../../../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

const UsersManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        enqueueSnackbar(response.data.message || 'Error fetching users', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar('Error fetching users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      role: e.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim() || !formData.email.trim()) {
        enqueueSnackbar('Name and email are required', { variant: 'error' });
        return;
      }

      let response;
      if (editingUser) {
        response = await usersAPI.update(editingUser._id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
      } else {
        if (!formData.password.trim()) {
          enqueueSnackbar('Password is required for new users', { variant: 'error' });
          return;
        }
        response = await authAPI.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }

      if (response.data.success) {
        enqueueSnackbar(
          editingUser ? 'User updated successfully' : 'User created successfully',
          { variant: 'success' }
        );
        handleCloseDialog();
        fetchUsers();
      } else {
        enqueueSnackbar(response.data.message || 'Operation failed', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error submitting user:', error);
      enqueueSnackbar('Operation failed', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await usersAPI.delete(id);
      if (response.data.success) {
        enqueueSnackbar('User deleted successfully', { variant: 'success' });
        fetchUsers();
      } else {
        enqueueSnackbar(response.data.message || 'Failed to delete user', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      enqueueSnackbar('Failed to delete user', { variant: 'error' });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Users Management</Typography>
        <IconButton
          color="primary"
          onClick={() => handleOpenDialog()}
          sx={{ 
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    key={`edit-${user._id}`}
                    onClick={() => handleOpenDialog(user)} 
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    key={`delete-${user._id}`}
                    onClick={() => handleDelete(user._id)} 
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              name="name"
              label="Name"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            {!editingUser && (
              <TextField
                name="password"
                label="Password"
                type="password"
                fullWidth
                value={formData.password}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
            )}
            <FormControl fullWidth>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                value={formData.role}
                label="Role"
                onChange={handleRoleChange}
              >
                <MenuItem key="user-role" value="user">User</MenuItem>
                <MenuItem key="admin-role" value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersManagement; 