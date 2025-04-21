import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Link as MuiLink
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { verifyTenantAdminOTP } from '../../../utils/api';
import Header from '../../../components/common/Header';

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
});

// Helper function to validate email format
const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

// Helper function to validate OTP format (6 digits)
const validateOTP = (otp) => {
  const re = /^\d{6}$/;
  return re.test(String(otp));
};

const VerifyOTPPage = () => {
  const router = useRouter();
  const { tenant, email: emailFromQuery } = router.query;
  
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOTPError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Set email from query parameter when router is ready
  useEffect(() => {
    if (router.isReady && emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [router.isReady, emailFromQuery]);

  // Check if we're in a valid tenant context
  useEffect(() => {
    if (router.isReady) {
      if (!tenant || tenant === '[tenant]') {
        console.error('Invalid tenant in URL:', tenant);
        setSnackbar({
          open: true,
          message: 'Invalid tenant URL. Please check the URL and try again.',
          severity: 'error'
        });
      } else {
        console.log('Valid tenant in URL:', tenant);
      }
    }
  }, [router.isReady, tenant]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handleOTPChange = (e) => {
    // Only allow numeric input for OTP
    const value = e.target.value.replace(/[^0-9]/g, '');
    setOTP(value);
    if (otpError) setOTPError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email) {
      setEmailError('Email is required');
      return;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Validate OTP
    if (!otp) {
      setOTPError('OTP is required');
      return;
    } else if (!validateOTP(otp)) {
      setOTPError('OTP must be 6 digits');
      return;
    }
    
    // Clear previous errors
    setEmailError('');
    setOTPError('');
    
    // Show loading state
    setIsLoading(true);
    
    try {
      console.log(`Verifying OTP for ${email} in tenant ${tenant}`);
      const response = await verifyTenantAdminOTP(email, otp, tenant);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'OTP verified successfully. You can now reset your password.',
        severity: 'success'
      });
      
      // Redirect to password reset page after a short delay
      setTimeout(() => {
        router.push({
          pathname: '/[tenant]/tenant-admin/reset-password',
          query: { 
            tenant, 
            email,
            verified: true,
            userId: response.user_id // Pass the user ID for the next step
          }
        });
      }, 2000);
      
    } catch (error) {
      console.error('OTP verification error:', error);
      
      setSnackbar({
        open: true,
        message: error.message || 'Invalid or expired OTP. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>Verify OTP | Tenant Admin</title>
        <meta name="description" content="Verify OTP for password reset" />
      </Head>
      
      <Header />
      
      <Container component="main" maxWidth="xs">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            sx={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Paper
              elevation={3}
              sx={{
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Typography component="h1" variant="h5" gutterBottom>
                Verify OTP
              </Typography>
              
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
                Enter the 6-digit OTP sent to your email address.
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  error={!!emailError}
                  helperText={emailError}
                  disabled={isLoading || !!emailFromQuery}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="otp"
                  label="One-Time Password (OTP)"
                  name="otp"
                  autoFocus
                  value={otp}
                  onChange={handleOTPChange}
                  error={!!otpError}
                  helperText={otpError}
                  disabled={isLoading}
                  inputProps={{ 
                    maxLength: 6,
                    pattern: '[0-9]*',
                    inputMode: 'numeric'
                  }}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Verify OTP'
                  )}
                </Button>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Link href={`/${tenant}/tenant-admin/forgot-password`} passHref>
                    <MuiLink variant="body2">
                      Didn't receive an OTP? Request again
                    </MuiLink>
                  </Link>
                </Box>
              </Box>
            </Paper>
          </Box>
        </motion.div>
        
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
      </Container>
    </ThemeProvider>
  );
};

export default VerifyOTPPage;

// Server-side props to handle tenant parameter
export async function getServerSideProps(context) {
  const { tenant } = context.params;
  
  // Validate tenant parameter
  if (!tenant || tenant === '[tenant]') {
    console.error('Invalid tenant parameter:', tenant);
    return {
      redirect: {
        destination: '/404',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      tenant,
    },
  };
}
