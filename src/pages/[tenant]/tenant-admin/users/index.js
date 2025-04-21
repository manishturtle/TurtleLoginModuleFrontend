import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  Paper,
  Breadcrumbs,
  Link,
  CircularProgress
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TenantUserList from '../../../../components/TenantUserList';

export default function TenantUserManagement() {
  const router = useRouter();
  const { tenant } = router.query;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData || !tenant) {
      // Redirect to login if not logged in or tenant not available
      if (tenant) {
        router.push(`/${tenant}/tenant-admin/login`);
      } else {
        router.push('/');
      }
      return;
    }
    
    try {
      // Check if userData exists before parsing
      if (!userData) {
        console.error('User data is undefined or null');
        // Redirect to login if user data is missing
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push(`/${tenant}/tenant-admin/login`);
        return;
      }
      
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Check if user is tenant admin
      if (!parsedUser.is_tenant_admin) {
        // Redirect to login if not a tenant admin
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = `/${tenant}/tenant-admin/login`;
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push(`/${tenant}/tenant-admin/login`);
    }
  }, [router, tenant]);

  if (loading || !tenant) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link 
          color="inherit" 
          href="#"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/${tenant}/tenant-admin/dashboard`);
          }}
        >
          Dashboard
        </Link>
        <Typography color="text.primary">User Management</Typography>
      </Breadcrumbs>
      
      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
      </Box>
      
      {/* User list component */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <TenantUserList />
      </Paper>
    </Container>
  );
}

export async function getServerSideProps(context) {
  const { tenant } = context.params;
  
  return {
    props: {
      tenant,
    },
  };
}
