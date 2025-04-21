import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Button,
  ThemeProvider, 
  createTheme, 
  CssBaseline 
} from '@mui/material';
import Header from '../../components/common/Header';
import { isAuthenticated } from '../../services/authService';

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

export default function DashboardPage() {
  const router = useRouter();
  
  // Check if user is authenticated
  useEffect(() => {
    // Check authentication status
    if (!isAuthenticated()) {
      // Redirect to login page if not authenticated
      router.push('/login');
    }
  }, [router]);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>Dashboard | Turtle ERP</title>
        <meta name="description" content="Turtle ERP Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Header />
      
      <Container component="main" maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Welcome to Your Dashboard
          </Typography>
          
          <Typography variant="body1" align="center" sx={{ mt: 2, mb: 4 }}>
            Your account has been successfully created and verified. You can now start using the Turtle ERP platform.
          </Typography>
          
          <Box sx={{ mt: 2, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              sx={{ minWidth: 200 }}
            >
              Get Started
            </Button>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
