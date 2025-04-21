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
import OtpVerificationScreen from '@/components/signup/OtpVerificationScreen';
import Header from '@/components/common/Header';
import api, { verifyOtp, resendOtp } from '@/utils/api';

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

export default function VerifyPage() {
  const router = useRouter();
  const { email, userId } = router.query;
  
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Redirect to signup page if email or userId is not provided
  useEffect(() => {
    if (router.isReady && (!email || !userId)) {
      router.push('/signup');
    }
  }, [email, userId, router]);

  // Handle OTP verification
  const handleVerificationComplete = async (otp) => {
    setIsLoading(true);
    try {
      const response = await verifyOtp(email, userId, otp);
      
      console.log('OTP verification response:', response);
      
      // Show success message
      setSnackbar({
        open: true,
        message: response.message || 'Email verified successfully!',
        severity: 'success'
      });
      
      // Check if 2FA setup is required
      if (response.needs_2fa_setup) {
        console.log('2FA setup required, redirecting to setup page');
        
        // Store temporary token and user ID for 2FA setup
        localStorage.setItem('temp_token', response.temp_token);
        localStorage.setItem('temp_user_id', response.user_id);
        
        // Redirect to 2FA setup page after a delay
        setTimeout(() => {
          router.push('/security/two-factor-setup');
        }, 2000);
      } else {
        // Redirect to dashboard after a delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
      
    } catch (error) {
      console.error('OTP verification error:', error);
      
      // Show error message
      const errorMessage = error.response?.data?.message || 'Invalid OTP. Please try again.';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        // User already exists error
        console.log('User already exists, redirecting to signup page');
        
        // Redirect to signup page after a delay
        setTimeout(() => {
          router.push('/signup');
        }, 3000);
      }
      
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Handle OTP resend
  const handleResendOtp = async () => {
    try {
      const response = await resendOtp(email, userId);
      
      console.log('OTP resend response:', response);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Verification code resent successfully!',
        severity: 'success'
      });
      
      return response;
    } catch (error) {
      console.error('OTP resend error:', error);
      
      // Show error message
      const errorMessage = error.response?.data?.message || 'Failed to resend verification code. Please try again.';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      
      throw new Error(errorMessage);
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
        <title>Verify Email | SaaS ERP</title>
        <meta name="description" content="Verify your email for SaaS ERP" />
      </Head>
      <Header />
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          {email && userId && (
            <OtpVerificationScreen 
              email={email} 
              onVerificationComplete={handleVerificationComplete}
              onResendOtp={handleResendOtp}
              router={router}
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
