import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AdminLayout from '../../../components/admin/AdminLayout';
import TenantList from '../../../components/admin/TenantList';
import withAdminAuth from '../../../components/auth/withAdminAuth';
import { useRouter } from 'next/router';

const TenantsPage = () => {
  const router = useRouter();

  // Handle create tenant button click
  const handleCreateTenant = () => {
    router.push('/platform-admin/tenants/create');
  };

  return (
    <AdminLayout title="Tenant Management">
      <Box sx={{ mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Tenant Management
            </Typography>
            <Typography variant="body1" color="textSecondary">
              View, create, and manage all tenants in your SaaS platform.
            </Typography>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleCreateTenant}
            >
              New Tenant
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Tenant List Component */}
      <TenantList />
    </AdminLayout>
  );
};

// Wrap the component with the admin authentication HOC
export default withAdminAuth(TenantsPage);
