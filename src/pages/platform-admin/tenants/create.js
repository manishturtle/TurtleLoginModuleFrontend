import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import TenantForm from '../../../components/admin/TenantForm';
import withAdminAuth from '../../../components/auth/withAdminAuth';
import { createTenant } from '../../../services/adminApiService';

/**
 * Page for creating a new tenant
 */
const CreateTenantPage = () => {
  const router = useRouter();
  
  // Handle form submission
  const handleSubmit = async (tenant) => {
    try {
      // The actual API call is handled in the TenantForm component
      // Navigate back to tenants list after successful creation
      router.push('/platform-admin/tenants');
    } catch (error) {
      console.error('Error creating tenant:', error);
      // Error is handled in the form component
    }
  };
  
  // Handle cancel button
  const handleCancel = () => {
    router.push('/platform-admin/tenants');
  };
  
  return (
    <AdminLayout title="Create Tenant">
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Tenant
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Create a new tenant for your SaaS platform. The tenant will have its own isolated database schema.
          </Typography>
        </Box>
        
        <TenantForm 
          onSubmit={handleSubmit} 
          onCancel={handleCancel}
        />
      </Container>
    </AdminLayout>
  );
};

export default withAdminAuth(CreateTenantPage);
