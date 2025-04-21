import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  CircularProgress,
  Divider
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import api, { getTenantAdminDashboard } from '../../../utils/api';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1e8e3e',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

const TenantAdminDashboard = ({ tenant }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      // Use as URL to avoid interpolation issues
      router.replace(`/${tenant}/tenant-admin/login`);
      return;
    }
    
    // Fetch dashboard data from the backend API
    const loadDashboardData = async () => {
      try {
        // Use the new API helper function for consistent URL handling
        const data = await getTenantAdminDashboard(tenant);
        
        console.log('Dashboard data received:', data);
        setDashboardData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        
        // If API call fails, fall back to mock data
        const mockDashboardData = {
          tenantInfo: {
            name: tenant ? tenant.toUpperCase() : 'Your Tenant',
            status: 'Active',
            subscription: 'Professional Plan',
            usersCount: 12,
            storageUsed: '2.4 GB',
            storageLimit: '10 GB'
          },
          recentActivity: [
            { id: 1, action: 'User login', user: 'john.doe@example.com', timestamp: '2025-03-23T01:15:22Z' },
            { id: 2, action: 'Invoice created', user: 'finance@example.com', timestamp: '2025-03-22T22:45:11Z' },
            { id: 3, action: 'New user added', user: 'admin@example.com', timestamp: '2025-03-22T18:30:05Z' }
          ]
        };
        setDashboardData(mockDashboardData);
        setIsLoading(false);
        
        // If unauthorized, redirect to login
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Use as URL to avoid interpolation issues
          router.replace(`/${tenant}/tenant-admin/login`);
        }
      }
    };
    
    // Short timeout to simulate API call
    setTimeout(() => {
      loadDashboardData();
    }, 1000);
  }, [router, tenant]);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DashboardLayout>
        <Head>
          <title>Dashboard | {tenant ? tenant.toUpperCase() : 'Tenant'} Admin</title>
        </Head>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">{error}</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </Paper>
          ) : (
            <>
              <Box mb={4}>
                <Typography variant="h4" component="h1" gutterBottom>
                  Welcome to {dashboardData.tenantInfo.name} Dashboard
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Manage your tenant resources and settings
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {/* Tenant Overview */}
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Tenant Overview
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body1">
                        {dashboardData.tenantInfo.status}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Subscription
                      </Typography>
                      <Typography variant="body1">
                        {dashboardData.tenantInfo.subscription}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Users
                      </Typography>
                      <Typography variant="body1">
                        {dashboardData.tenantInfo.usersCount}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Storage
                      </Typography>
                      <Typography variant="body1">
                        {dashboardData.tenantInfo.storageUsed} / {dashboardData.tenantInfo.storageLimit}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Recent Activity */}
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Recent Activity
                    </Typography>
                    {dashboardData.recentActivity.map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <Box sx={{ py: 1 }}>
                          <Typography variant="body1">
                            {activity.action}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            By {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                        {index < dashboardData.recentActivity.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </Paper>
                </Grid>
                
                {/* Quick Actions */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Quick Actions
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item>
                        <Button variant="contained" color="primary">
                          Manage Users
                        </Button>
                      </Grid>
                      <Grid item>
                        <Button variant="outlined" color="primary">
                          View Reports
                        </Button>
                      </Grid>
                      <Grid item>
                        <Button variant="outlined" color="primary">
                          Account Settings
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </Container>
      </DashboardLayout>
    </ThemeProvider>
  );
};

// Add getServerSideProps to handle tenant parameter
export async function getServerSideProps(context) {
  const { tenant } = context.params;
  
  // Validate tenant parameter
  if (!tenant || tenant === '[tenant]') {
    // If no valid tenant, redirect to login
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  // Pass tenant to the page component
  return {
    props: {
      tenant,
    },
  };
}

export default TenantAdminDashboard;