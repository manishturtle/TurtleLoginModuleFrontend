import React from 'react';
import { 
  Typography, 
  Box,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import CrmClientForm from '../../../components/admin/CrmClientForm';
import withAdminAuth from '../../../components/auth/withAdminAuth';

const CreateCrmClientPage = () => {
  return (
    <AdminLayout title="Create CRM Client">
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link href="/platform-admin" passHref>
            <MuiLink underline="hover" color="inherit">Dashboard</MuiLink>
          </Link>
          <Link href="/platform-admin/crmclients" passHref>
            <MuiLink underline="hover" color="inherit">CRM Clients</MuiLink>
          </Link>
          <Typography color="text.primary">Create</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Create New CRM Client
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Add a new CRM client to your platform.
        </Typography>
      </Box>

      <CrmClientForm />
    </AdminLayout>
  );
};

// Wrap the component with the admin authentication HOC
export default withAdminAuth(CreateCrmClientPage);
