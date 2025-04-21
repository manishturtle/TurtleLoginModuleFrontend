import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import SettingsIcon from '@mui/icons-material/Settings';
import { fetchTenantUsers } from '../../../services/tenantAdminApiService';

// Tenant Admin Dashboard
export default function TenantAdminDashboard({ tenant }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    totalDepartments: 0
  });

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
        // Use direct URL to avoid interpolation issues
        window.location.href = `/${tenant}/tenant-admin/login`;
        return;
      }
      
      // Fetch dashboard data
      fetchDashboardData(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push(`/${tenant}/tenant-admin/login`);
    }
  }, [router, tenant]);

  const fetchDashboardData = async (token) => {
    try {
      // Fetch real user data from the API
      const usersData = await fetchTenantUsers();
      
      // Calculate statistics from the API response
      const totalUsers = usersData.count || usersData.results?.length || 0;
      const activeUsers = usersData.results?.filter(user => user.is_active).length || 0;
      
      setStats({
        totalUsers,
        activeUsers,
        pendingApprovals: totalUsers - activeUsers,
        totalDepartments: 5 // This could be fetched from another API endpoint
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values in case of error
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        pendingApprovals: 0,
        totalDepartments: 0
      });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const tenantSlug = router.query.tenant;
    router.push({
      pathname: '/[tenant]/tenant-admin/login',
      query: { tenant: tenantSlug }
    });
  };

  if (loading || !tenant) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {tenant.charAt(0).toUpperCase() + tenant.slice(1)} Admin Dashboard
        </Typography>
        <Button variant="outlined" color="primary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Welcome Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" component="h2">
              Welcome, {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              You are logged in as a Tenant Administrator
            </Typography>
          </Paper>
        </Grid>
        
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="Total Users" avatar={<PeopleIcon color="primary" />} />
            <CardContent>
              <Typography variant="h3" component="div" align="center">
                {stats.totalUsers}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  size="small"
                  onClick={() => {
                    const tenantSlug = router.query.tenant;
                    router.push({
                      pathname: '/[tenant]/tenant-admin/users',
                      query: { tenant: tenantSlug }
                    });
                  }}
                >
                  Manage Users
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="Active Users" avatar={<PeopleIcon color="success" />} />
            <CardContent>
              <Typography variant="h3" component="div" align="center">
                {stats.activeUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="Pending Approvals" avatar={<PeopleIcon color="warning" />} />
            <CardContent>
              <Typography variant="h3" component="div" align="center">
                {stats.pendingApprovals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="Departments" avatar={<BusinessIcon color="primary" />} />
            <CardContent>
              <Typography variant="h3" component="div" align="center">
                {stats.totalDepartments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  startIcon={<PeopleIcon />}
                  onClick={() => {
                    const tenantSlug = router.query.tenant;
                    router.push({
                      pathname: '/[tenant]/tenant-admin/users',
                      query: { tenant: tenantSlug }
                    });
                  }}
                >
                  Manage Users
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  startIcon={<BusinessIcon />}
                >
                  Departments
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  startIcon={<SettingsIcon />}
                >
                  Tenant Settings
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  startIcon={<DashboardIcon />}
                >
                  Reports
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

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
