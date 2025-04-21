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
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SettingsIcon from '@mui/icons-material/Settings';

// Tenant User Dashboard
export default function TenantDashboard() {
  const router = useRouter();
  const { tenant } = router.query;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalInvoices: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData || !tenant) {
      // Redirect to login if not logged in or tenant not available
      if (tenant) {
        router.push(`/${tenant}/login`);
      } else {
        router.push('/');
      }
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Fetch dashboard data
      fetchDashboardData(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push(`/${tenant}/login`);
    }
  }, [router, tenant]);

  const fetchDashboardData = async (token) => {
    // This would be replaced with actual API calls
    // For now, just simulate loading
    setTimeout(() => {
      setStats({
        totalOrders: 24,
        pendingOrders: 5,
        totalInvoices: 18,
        pendingPayments: 3
      });
      setLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push(`/${tenant}/login`);
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
          {tenant.charAt(0).toUpperCase() + tenant.slice(1)} Dashboard
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
              You are logged in as a Tenant User
            </Typography>
          </Paper>
        </Grid>
        
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="Total Orders" avatar={<ShoppingCartIcon color="primary" />} />
            <CardContent>
              <Typography variant="h3" component="div" align="center">
                {stats.totalOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="Pending Orders" avatar={<ShoppingCartIcon color="warning" />} />
            <CardContent>
              <Typography variant="h3" component="div" align="center">
                {stats.pendingOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="Total Invoices" avatar={<ReceiptIcon color="primary" />} />
            <CardContent>
              <Typography variant="h3" component="div" align="center">
                {stats.totalInvoices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader title="Pending Payments" avatar={<ReceiptIcon color="error" />} />
            <CardContent>
              <Typography variant="h3" component="div" align="center">
                {stats.pendingPayments}
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
                  startIcon={<ShoppingCartIcon />}
                >
                  New Order
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  startIcon={<ReceiptIcon />}
                >
                  View Invoices
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  startIcon={<SettingsIcon />}
                >
                  Account Settings
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
