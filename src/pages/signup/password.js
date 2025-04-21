import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Container, 
  Box, 
  Snackbar, 
  Alert, 
  ThemeProvider, 
  createTheme, 
  CssBaseline
} from '@mui/material';
import SignupPasswordScreen from '@/components/signup/SignupPasswordScreen';
import Header from '@/components/common/Header';
import api from '@/utils/api';

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

export default function PasswordPage() {
  const router = useRouter();
  const { email, firstName, lastName, nationality } = router.query;
  
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Redirect to email page if email is not provided
  useEffect(() => {
    if (!email && router.isReady) {
      router.push('/signup');
    }
  }, [email, router]);

  const handlePasswordSet = async (password) => {
    setIsLoading(true);
    try {
      console.log('Submitting registration with:', { email, password, firstName, lastName, nationality });
      const response = await api.post('/auth/register/', {
        email,
        password,
        password_confirm: password,
        first_name: firstName,
        last_name: lastName,
        nationality: nationality
      });
      
      console.log('Registration response:', response.data);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Account created successfully! Redirecting to verification...',
        severity: 'success'
      });
      
      // Redirect to OTP verification page after a delay
      setTimeout(() => {
        router.push({
          pathname: '/signup/verify',
          query: { 
            email,
            userId: response.data.id
          }
        });
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Show error message
      const errorMessage = error.response?.data?.message || 'An error occurred during registration. Please try again.';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>Create Password | SaaS ERP</title>
        <meta name="description" content="Create your password for SaaS ERP" />
      </Head>
      <Header />
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          {email && (
            <SignupPasswordScreen 
              email={email} 
              onPasswordSet={handlePasswordSet} 
            />
          )}
        </Box>
      </Container>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
