import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, CircularProgress, Typography } from '@mui/material';
import { isTenantAdmin } from '../../services/authService';

/**
 * Higher-order component that wraps pages that should only be accessible to tenant admins
 * Redirects to the tenant admin login page if the user is not authenticated as a tenant admin
 */
const withTenantAdminAuth = (WrappedComponent) => {
  const WithTenantAdminAuth = (props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const authorized = await isTenantAdmin();
          
          if (!authorized) {
            // Redirect to login page if not authorized
            router.push('/tenant-admin/login');
            return;
          }
          
          setIsAuthorized(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          router.push('/tenant-admin/login');
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    // Show loading state while checking authentication
    if (isLoading) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
          }}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Verifying authentication...
          </Typography>
        </Box>
      );
    }

    // Only render the wrapped component if the user is authorized
    return isAuthorized ? <WrappedComponent {...props} /> : null;
  };

  // Copy getInitialProps from the wrapped component if it exists
  if (WrappedComponent.getInitialProps) {
    WithTenantAdminAuth.getInitialProps = WrappedComponent.getInitialProps;
  }

  return WithTenantAdminAuth;
};

export default withTenantAdminAuth;
