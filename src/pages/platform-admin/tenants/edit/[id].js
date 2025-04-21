import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, CircularProgress, Alert } from '@mui/material';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/admin/AdminLayout';
import TenantForm from '../../../../components/admin/TenantForm';
import withAdminAuth from '../../../../components/auth/withAdminAuth';
import { fetchTenantById, updateTenant } from '../../../../services/adminApiService';

/**
 * Page for editing an existing tenant
 */
const EditTenantPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch tenant data when the component mounts
  useEffect(() => {
    const getTenant = async () => {
      // Only fetch if we have an ID
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await fetchTenantById(id);
        setTenant(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch tenant:', err);
        setError(err.message || 'Failed to fetch tenant');
      } finally {
        setLoading(false);
      }
    };
    
    getTenant();
  }, [id]);
  
  // Handle form submission
  const handleSubmit = async (updatedTenant) => {
    try {
      // The actual API call is handled in the TenantForm component
      // Navigate back to tenants list after successful update
      router.push('/platform-admin/tenants');
    } catch (error) {
      console.error('Error updating tenant:', error);
      // Error is handled in the form component
    }
  };
  
  // Handle cancel button
  const handleCancel = () => {
    router.push('/platform-admin/tenants');
  };
  
  // Show loading state
  if (loading) {
    return (
      <AdminLayout title="Edit Tenant">
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </AdminLayout>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <AdminLayout title="Edit Tenant">
        <Container maxWidth="md">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Edit Tenant
            </Typography>
          </Box>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Container>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title={`Edit Tenant: ${tenant?.name || ''}`}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Tenant
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Update tenant information. Note that some fields may not be editable after tenant creation.
          </Typography>
        </Box>
        
        {tenant && (
          <TenantForm 
            tenant={tenant}
            onSubmit={handleSubmit} 
            onCancel={handleCancel}
          />
        )}
      </Container>
    </AdminLayout>
  );
};

export default withAdminAuth(EditTenantPage);
