import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Typography,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Tooltip,
  Link
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import LaunchIcon from '@mui/icons-material/Launch';
import { format } from 'date-fns';
import { fetchTenants, deleteTenant } from '../../services/adminApiService';

/**
 * Component for displaying a list of tenants with edit and delete functionality
 */
const TenantList = () => {
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch tenants from the API
  const loadTenants = async () => {
    try {
      setLoading(true);
      console.log('Loading tenants...');
      const data = await fetchTenants();
      console.log('Tenants loaded successfully:', data);
      setTenants(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setError(err.message || 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  // Load tenants on component mount
  useEffect(() => {
    console.log('TenantList component mounted');
    loadTenants();
  }, []);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle edit tenant
  const handleEditTenant = (id) => {
    router.push(`/platform-admin/tenants/edit/${id}`);
  };

  // Handle delete tenant dialog open
  const handleDeleteDialogOpen = (tenant) => {
    setTenantToDelete(tenant);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setTenantToDelete(null);
    setDeleteError(null);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!tenantToDelete) return;
    
    try {
      setDeleteLoading(true);
      await deleteTenant(tenantToDelete.id);
      // Refresh the tenant list
      await loadTenants();
      handleDeleteDialogClose();
    } catch (err) {
      console.error('Failed to delete tenant:', err);
      setDeleteError(err.message || 'Failed to delete tenant');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Get tenant status chip
  const getStatusChip = (status) => {
    const statusMap = {
      'active': { label: 'Active', color: 'success' },
      'trial': { label: 'Trial', color: 'warning' },
      'suspended': { label: 'Suspended', color: 'error' },
      'inactive': { label: 'Inactive', color: 'default' }
    };
    
    return statusMap[status] || { label: status || 'Unknown', color: 'default' };
  };

  // Get environment chip
  const getEnvironmentChip = (environment) => {
    const envMap = {
      'production': { label: 'Production', color: 'primary' },
      'staging': { label: 'Staging', color: 'secondary' },
      'testing': { label: 'Testing', color: 'info' },
      'development': { label: 'Development', color: 'default' }
    };
    
    return envMap[environment] || { label: environment || 'Unknown', color: 'default' };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Get tenant URL
  const getTenantUrl = (tenant) => {
    if (!tenant) return '#';
    
    if (tenant.url_suffix) {
      const baseUrl = process.env.NEXT_PUBLIC_TENANT_BASE_URL || 'https://app.example.com';
      return `${baseUrl}/${tenant.url_suffix}`;
    }
    
    return '#';
  };

  // Show loading state
  if (loading && (!tenants || tenants.length === 0)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error && (!tenants || tenants.length === 0)) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  // Show empty state
  if (!tenants || tenants.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No tenants found
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Create your first tenant to get started.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => router.push('/platform-admin/tenants/create')}
        >
          Create Tenant
        </Button>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="tenant table">
          <TableHead>
            <TableRow>
              <TableCell>Tenant Name</TableCell>
              <TableCell>URL Suffix</TableCell>
              <TableCell>Environment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Trial End</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tenants || [])
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((tenant) => {
                const statusChip = getStatusChip(tenant?.status);
                const envChip = getEnvironmentChip(tenant?.environment);
                const tenantUrl = getTenantUrl(tenant);
                
                return (
                  <TableRow key={tenant?.id || 'unknown'}>
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {tenant?.name || 'Unknown'}
                        {tenant?.logo_url && (
                          <Tooltip title="Has logo">
                            <InfoIcon fontSize="small" color="action" sx={{ ml: 1, opacity: 0.6 }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {tenant?.url_suffix || tenant?.schema_name || 'N/A'}
                        {tenantUrl !== '#' && (
                          <Tooltip title="Open tenant URL">
                            <IconButton size="small" href={tenantUrl} target="_blank" rel="noopener noreferrer">
                              <LaunchIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={envChip.label} 
                        color={envChip.color} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={statusChip.label} 
                        color={statusChip.color} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {tenant?.contact_email ? (
                        <Tooltip title={tenant.contact_email}>
                          <Link 
                            href={`mailto:${tenant.contact_email}`}
                            underline="hover"
                            sx={{ display: 'block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {tenant.contact_email}
                          </Link>
                        </Tooltip>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {tenant?.on_trial ? (
                        formatDate(tenant?.trial_end_date)
                      ) : (
                        <Chip label="Not on trial" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>{formatDate(tenant?.created_at)}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        aria-label="edit" 
                        color="primary"
                        onClick={() => handleEditTenant(tenant?.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        aria-label="delete" 
                        color="error"
                        onClick={() => handleDeleteDialogOpen(tenant)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={tenants?.length || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Tenant?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete tenant "{tenantToDelete?.name}"? 
            This action cannot be undone and will permanently delete all data associated with this tenant.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteDialogClose} 
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            autoFocus
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TenantList;
