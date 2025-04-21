import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper,
  Button
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

export default function DashboardPage() {
  const router = useRouter();
  
  const handleLogout = () => {
    // In a real application, you would call your logout API
    router.push('/login');
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" fontWeight={600}>
              SaaS ERP Dashboard
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
          
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              mb: 4
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom fontWeight={500}>
              Welcome to your SaaS ERP Dashboard
            </Typography>
            <Typography variant="body1" paragraph>
              This is a placeholder dashboard page. In a real application, this would display your company's ERP data and functionality.
            </Typography>
            <Typography variant="body1">
              Your account has been successfully created and you're now logged in to the system.
            </Typography>
          </Paper>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
            {['Finance', 'Inventory', 'HR', 'Sales', 'Reporting', 'Settings'].map((module) => (
              <Paper
                key={module}
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  textAlign: 'center',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <Typography variant="h6" component="h3" gutterBottom>
                  {module}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Access your {module.toLowerCase()} module
                </Typography>
              </Paper>
            ))}
          </Box>
        </motion.div>
      </Container>
    </ThemeProvider>
  );
}
