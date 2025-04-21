import React from 'react';
import { 
  Typography, 
  Box,
  Breadcrumbs,
  Link as MuiLink,
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/admin/AdminLayout';
import CrmClientForm from '../../../../components/admin/CrmClientForm';
import withAdminAuth from '../../../../components/auth/withAdminAuth';

const EditCrmClientPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  if (!id) {
    return (
      <AdminLayout title="Edit CRM Client">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit CRM Client">
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link href="/platform-admin" passHref>
            <MuiLink underline="hover" color="inherit">Dashboard</MuiLink>
          </Link>
          <Link href="/platform-admin/crmclients" passHref>
            <MuiLink underline="hover" color="inherit">CRM Clients</MuiLink>
          </Link>
          <Typography color="text.primary">Edit Client</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Edit CRM Client
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Update the CRM client information.
        </Typography>
      </Box>

      <CrmClientForm clientId={id} isEdit={true} />
    </AdminLayout>
  );
};

// Wrap the component with the admin authentication HOC
export default withAdminAuth(EditCrmClientPage);
