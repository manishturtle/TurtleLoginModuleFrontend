import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Box,
  Alert,
  Typography
} from '@mui/material';
import { createTenantUser, fetchTenantRoles, createTenantUserWithLogin } from '../services/tenantAdminApiService';

const AddTenantUserForm = ({ open, onClose, onUserCreated }) => {
  const router = useRouter();
  const { tenant } = router.query;
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role_id: '',
    user_type: 'external', // Default to external user
    generate_password: true, // Default to auto-generate password
    password: '',
    password_confirm: ''
  });
  
  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);  
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Only load roles when the dialog is open and tenant is available
  useEffect(() => {
    if (open && tenant) {
      loadRoles();
    }
  }, [open, tenant]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role_id: '',
        user_type: 'external',
        generate_password: true,
        password: '',
        password_confirm: ''
      });
      setErrors({});
      setSubmitError('');
      setSuccess(false);
      setGeneratedPassword('');
    }
  }, [open]);

  const loadRoles = async () => {
    if (!tenant) return;
    
    setRolesLoading(true);
    try {
      // First try the regular API endpoint
      try {
        const rolesData = await fetchTenantRoles(tenant);
        console.log('Loaded roles from API:', rolesData);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
        setRolesLoading(false);
        return;
      } catch (apiError) {
        console.error('Error fetching roles from API:', apiError);
      }
      
      // If the API fails, try the debug endpoint directly
      console.log('Trying debug endpoint directly...');
      const response = await fetch(`http://localhost:8000/api/${tenant}/tenant-admin/debug-roles/`);
      if (response.ok) {
        const debugRolesData = await response.json();
        console.log('Loaded roles from debug endpoint:', debugRolesData);
        setRoles(Array.isArray(debugRolesData) ? debugRolesData : []);
      } else {
        console.error('Debug endpoint failed with status:', response.status);
        setSubmitError('Failed to load roles. Please try again.');
        setRoles([]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setSubmitError('Failed to load roles. Please try again.');
      setRoles([]); 
    } finally {
      setRolesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.user_type) {
      newErrors.user_type = 'User type is required';
    }
    
    if (!formData.role_id) {
      newErrors.role_id = 'Role is required';
    }
    
    if (!formData.generate_password) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
      if (!formData.password_confirm) {
        newErrors.password_confirm = 'Confirm password is required';
      }
      if (formData.password !== formData.password_confirm) {
        newErrors.password_confirm = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !tenant) {
      return;
    }
    
    setLoading(true);
    setSubmitError('');
    
    try {
      // Use the createTenantUser function which uses the current user's token
      const response = await createTenantUser(formData, tenant);
      
      setSuccess(true);
      
      // If a password was generated, show it to the user
      if (response.generated_password) {
        setGeneratedPassword(response.generated_password);
      }
      
      // Notify parent component that a user was created
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle specific validation errors
      if (error.response?.data?.email) {
        // Email-specific error (like duplicate email)
        setErrors(prev => ({
          ...prev,
          email: Array.isArray(error.response.data.email) 
            ? error.response.data.email[0] 
            : error.response.data.email
        }));
        setSubmitError('Please correct the errors and try again.');
      } else if (error.response?.data?.password) {
        // Password-specific error
        setErrors(prev => ({
          ...prev,
          password: Array.isArray(error.response.data.password) 
            ? error.response.data.password[0] 
            : error.response.data.password
        }));
        setSubmitError('Please correct the errors and try again.');
      } else if (error.response?.data?.non_field_errors) {
        // General validation errors
        setSubmitError(
          Array.isArray(error.response.data.non_field_errors)
            ? error.response.data.non_field_errors[0]
            : error.response.data.non_field_errors
        );
      } else {
        // General error message
        setSubmitError(
          error.response?.data?.detail || 
          error.message ||
          'Failed to create user. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Don't render the form if tenant is not available
  if (!tenant && open) {
    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            Tenant information is not available. Please try again.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {success ? 'User Created Successfully' : 'Add New Tenant User'}
      </DialogTitle>
      <DialogContent>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        
        {success ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              User created successfully!
            </Alert>
            {generatedPassword && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Generated Password:
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: 'monospace',
                    p: 1,
                    bgcolor: 'grey.100',
                    borderRadius: 1
                  }}
                >
                  {generatedPassword}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Please save this password or share it with the user securely. It cannot be retrieved later.
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box component="form" noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="first_name"
              label="First Name"
              name="first_name"
              autoComplete="given-name"
              value={formData.first_name}
              onChange={handleChange}
              error={!!errors.first_name}
              helperText={errors.first_name}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="last_name"
              label="Last Name"
              name="last_name"
              autoComplete="family-name"
              value={formData.last_name}
              onChange={handleChange}
              error={!!errors.last_name}
              helperText={errors.last_name}
              disabled={loading}
            />
            
            <FormControl 
              fullWidth 
              margin="normal"
              required
              error={!!errors.user_type}
            >
              <InputLabel id="user-type-label">User Type</InputLabel>
              <Select
                labelId="user-type-label"
                id="user_type"
                name="user_type"
                value={formData.user_type}
                label="User Type"
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="internal">Internal User (Staff)</MenuItem>
                <MenuItem value="external">External User (Non-Staff)</MenuItem>
              </Select>
              {errors.user_type && (
                <FormHelperText>{errors.user_type}</FormHelperText>
              )}
            </FormControl>
            
            <FormControl 
              fullWidth 
              margin="normal"
              required
              error={!!errors.role_id}
            >
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                id="role_id"
                name="role_id"
                value={formData.role_id}
                label="Role"
                onChange={handleChange}
                disabled={loading || rolesLoading}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.role_id && (
                <FormHelperText>{errors.role_id}</FormHelperText>
              )}
              {rolesLoading && (
                <FormHelperText>Loading roles...</FormHelperText>
              )}
            </FormControl>
            
            <FormControl 
              fullWidth 
              margin="normal"
              error={!!errors.generate_password}
            >
              <InputLabel id="generate-password-label">Password Options</InputLabel>
              <Select
                labelId="generate-password-label"
                id="generate_password"
                name="generate_password"
                value={formData.generate_password}
                label="Password Options"
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value={true}>Auto-generate password</MenuItem>
                <MenuItem value={false}>Set custom password</MenuItem>
              </Select>
              {errors.generate_password && (
                <FormHelperText>{errors.generate_password}</FormHelperText>
              )}
            </FormControl>
            
            {!formData.generate_password && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="password"
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  disabled={loading}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="password_confirm"
                  label="Confirm Password"
                  name="password_confirm"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  error={!!errors.password_confirm}
                  helperText={errors.password_confirm}
                  disabled={loading}
                />
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {success ? (
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              color="primary" 
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddTenantUserForm;
