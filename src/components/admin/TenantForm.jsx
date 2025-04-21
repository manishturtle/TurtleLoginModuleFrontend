import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  IconButton,
  InputAdornment,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { createTenant, updateTenant, fetchCrmClients } from '../../services/adminApiService';
import { addMonths } from 'date-fns';

/**
 * Form component for creating and editing tenants
 * @param {Object} props - Component props
 * @param {Object} props.tenant - Tenant data for editing (optional)
 * @param {Function} props.onSubmit - Function to call on successful form submission
 * @param {Function} props.onCancel - Function to call when cancel button is clicked
 */
const TenantForm = ({ tenant, onSubmit, onCancel }) => {
  const isEditing = Boolean(tenant?.id);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    schema_name: '',
    url_suffix: '',
    status: 'trial',
    environment: 'production',
    trial_end_date: addMonths(new Date(), 1), // Default to 1 month from today
    contact_email: '',
    is_active: true,
    client_id: '',
    // Admin user fields
    admin_email: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_password: '',
  });
  
  // CRM clients state
  const [crmClients, setCrmClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  
  // Form validation state
  const [errors, setErrors] = useState({});
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch CRM clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        const clients = await fetchCrmClients();
        setCrmClients(clients);
      } catch (err) {
        console.error('Error fetching CRM clients:', err);
        setError('Failed to load CRM clients. Please try again.');
      } finally {
        setLoadingClients(false);
      }
    };
    
    fetchClients();
  }, []);
  
  // Initialize form with tenant data if editing
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        schema_name: tenant.schema_name || '',
        url_suffix: tenant.url_suffix || '',
        status: tenant.status || 'trial',
        environment: tenant.environment || 'production',
        trial_end_date: tenant.trial_end_date ? new Date(tenant.trial_end_date) : addMonths(new Date(), 1),
        contact_email: tenant.contact_email || '',
        is_active: tenant.is_active !== undefined ? tenant.is_active : true,
        client_id: tenant.client_id || '',
        // Admin fields are only used for creation, not editing
        admin_email: '',
        admin_first_name: '',
        admin_last_name: '',
        admin_password: '',
      });
    }
  }, [tenant]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox/switch inputs
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // Clear validation error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };
  
  // Handle date picker changes
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date,
    });
    
    // Clear validation error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };
  
  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Tenant validation
    if (!formData.name.trim()) {
      newErrors.name = 'Tenant name is required';
    }
    
    if (!formData.url_suffix?.trim()) {
      newErrors.url_suffix = 'URL suffix is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.url_suffix)) {
      newErrors.url_suffix = 'URL suffix can only contain lowercase letters, numbers, and hyphens';
    }
    
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }
    
    // Admin user validation (only for new tenants)
    if (!isEditing) {
      if (!formData.admin_email?.trim()) {
        newErrors.admin_email = 'Admin email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
        newErrors.admin_email = 'Please enter a valid email address';
      }
      
      if (!formData.admin_first_name?.trim()) {
        newErrors.admin_first_name = 'Admin first name is required';
      }
      
      if (!formData.admin_last_name?.trim()) {
        newErrors.admin_last_name = 'Admin last name is required';
      }
      
      // Password is optional (will be auto-generated if not provided)
      if (formData.admin_password && formData.admin_password.length < 8) {
        newErrors.admin_password = 'Password must be at least 8 characters long';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Log the form data being sent
      console.log('Submitting form data:', formData);
      
      let result;
      
      if (isEditing) {
        // Update existing tenant - exclude admin fields
        const { admin_email, admin_first_name, admin_last_name, admin_password, ...tenantData } = formData;
        result = await updateTenant(tenant.id, tenantData);
        setSuccessMessage('Tenant updated successfully');
      } else {
        // Create new tenant
        result = await createTenant(formData);
        setSuccessMessage('Tenant created successfully');
        
        // Reset form after successful creation
        setFormData({
          name: '',
          schema_name: '',
          url_suffix: '',
          status: 'trial',
          environment: 'production',
          trial_end_date: addMonths(new Date(), 1),
          contact_email: '',
          is_active: true,
          client_id: '',
          admin_email: '',
          admin_first_name: '',
          admin_last_name: '',
          admin_password: '',
        });
      }
      
      // Call onSubmit callback with the result
      if (onSubmit) {
        onSubmit(result);
      }
    } catch (err) {
      console.error('Form submission error:', err);
      
      // Try to extract more detailed error information
      let errorMessage = err.message || `Failed to ${isEditing ? 'update' : 'create'} tenant`;
      
      // Check if the error message contains a JSON string
      try {
        if (typeof errorMessage === 'string' && errorMessage.includes('{')) {
          const jsonStart = errorMessage.indexOf('{');
          const jsonPart = errorMessage.substring(jsonStart);
          const errorData = JSON.parse(jsonPart);
          
          // Format validation errors if present
          if (errorData.errors) {
            errorMessage = Object.entries(errorData.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('\n');
          }
        }
      } catch (parseErr) {
        console.error('Error parsing error message:', parseErr);
      }
      
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSuccessMessage('');
  };
  
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {isEditing ? 'Edit Tenant' : 'Create New Tenant'}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Tenant Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Tenant Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              id="name"
              name="name"
              label="Tenant Name"
              value={formData.name}
              onChange={handleChange}
              error={Boolean(errors.name)}
              helperText={errors.name || 'Enter the name of the tenant organization'}
              disabled={loading}
              autoFocus
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              id="url_suffix"
              name="url_suffix"
              label="URL Suffix"
              value={formData.url_suffix}
              onChange={handleChange}
              error={Boolean(errors.url_suffix)}
              helperText={errors.url_suffix || 'This will be used in the tenant URL (e.g., example.com/{suffix})'}
              disabled={loading || (isEditing && !tenant.url_suffix_editable)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(errors.client_id)} disabled={loading || loadingClients}>
              <InputLabel id="client-label">CRM Client</InputLabel>
              <Select
                labelId="client-label"
                id="client_id"
                name="client_id"
                value={formData.client_id}
                label="CRM Client"
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {crmClients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.client_name}
                  </MenuItem>
                ))}
              </Select>
              {loadingClients && <FormHelperText>Loading clients...</FormHelperText>}
              {errors.client_id && <FormHelperText>{errors.client_id}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(errors.status)}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="trial">Trial</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
              {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(errors.environment)}>
              <InputLabel id="environment-label">Environment</InputLabel>
              <Select
                labelId="environment-label"
                id="environment"
                name="environment"
                value={formData.environment}
                label="Environment"
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="development">Development</MenuItem>
                <MenuItem value="testing">Testing</MenuItem>
                <MenuItem value="staging">Staging</MenuItem>
                <MenuItem value="production">Production</MenuItem>
              </Select>
              {errors.environment && <FormHelperText>{errors.environment}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Trial End Date"
                value={formData.trial_end_date}
                onChange={(date) => handleDateChange('trial_end_date', date)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={Boolean(errors.trial_end_date)}
                    helperText={errors.trial_end_date || 'Default: 1 month from today'}
                    disabled={loading || formData.status !== 'trial'}
                  />
                )}
                disabled={loading || formData.status !== 'trial'}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="contact_email"
              name="contact_email"
              label="Contact Email"
              value={formData.contact_email}
              onChange={handleChange}
              error={Boolean(errors.contact_email)}
              helperText={errors.contact_email || 'Primary contact email for this tenant'}
              disabled={loading}
              type="email"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={handleChange}
                  name="is_active"
                  color="primary"
                  disabled={loading}
                />
              }
              label="Active"
            />
          </Grid>
          
          {/* Initial Admin User Section - Only show when creating a new tenant */}
          {!isEditing && (
            <>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Initial Admin User
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="admin_email"
                  name="admin_email"
                  label="Admin Email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  error={Boolean(errors.admin_email)}
                  helperText={errors.admin_email || 'Email address for the initial admin user'}
                  disabled={loading}
                  type="email"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="admin_first_name"
                  name="admin_first_name"
                  label="Admin First Name"
                  value={formData.admin_first_name}
                  onChange={handleChange}
                  error={Boolean(errors.admin_first_name)}
                  helperText={errors.admin_first_name}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="admin_last_name"
                  name="admin_last_name"
                  label="Admin Last Name"
                  value={formData.admin_last_name}
                  onChange={handleChange}
                  error={Boolean(errors.admin_last_name)}
                  helperText={errors.admin_last_name}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="admin_password"
                  name="admin_password"
                  label="Admin Password (Optional)"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.admin_password}
                  onChange={handleChange}
                  error={Boolean(errors.admin_password)}
                  helperText={errors.admin_password || 'Leave blank to auto-generate a secure password'}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </>
          )}
          
          {/* Form Actions */}
          <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{ mr: 2 }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : isEditing ? 'Update Tenant' : 'Create Tenant'}
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={successMessage}
      />
    </Paper>
  );
};

TenantForm.propTypes = {
  tenant: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    schema_name: PropTypes.string,
    url_suffix: PropTypes.string,
    url_suffix_editable: PropTypes.bool,
    status: PropTypes.string,
    environment: PropTypes.string,
    trial_end_date: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    contact_email: PropTypes.string,
    is_active: PropTypes.bool,
    client_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default TenantForm;
