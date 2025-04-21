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
  Link as MuiLink,
  InputAdornment,
  IconButton
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { resetTenantAdminPassword } from '../../../utils/api';
import Header from '../../../components/common/Header';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

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

// Password validation function
const validatePassword = (password) => {
  // Minimum 8 characters
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  // At least one number
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  // At least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  
  return '';
};

const ResetPasswordPage = () => {
  const router = useRouter();
  const { tenant, email: emailFromQuery, otp: otpFromQuery, verified } = router.query;
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Set email and OTP from query parameters when router is ready
  useEffect(() => {
    if (router.isReady) {
      if (emailFromQuery) setEmail(emailFromQuery);
      if (otpFromQuery) setOtp(otpFromQuery);
      
      // Check if we have the required parameters
      if (!emailFromQuery || !otpFromQuery || verified !== 'true') {
        console.error('Missing required parameters for password reset');
        setSnackbar({
          open: true,
          message: 'Invalid request. Please start the password reset process again.',
          severity: 'error'
        });
      }
    }
  }, [router.isReady, emailFromQuery, otpFromQuery, verified]);

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

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Validate password
    const error = validatePassword(newPassword);
    setPasswordError(error);
    
    // If confirm password is not empty, check if passwords match
    if (confirmPassword) {
      if (newPassword !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    // Check if passwords match
    if (password !== newConfirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }
    
    // Clear previous errors
    setPasswordError('');
    setConfirmPasswordError('');
    
    // Show loading state
    setIsLoading(true);
    
    try {
      console.log(`Resetting password for ${email} in tenant ${tenant}`);
      const response = await resetTenantAdminPassword(email, otp, password, tenant);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Password reset successfully. You will be redirected to the login page.',
        severity: 'success'
      });
      
      // Clear the form
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push({
          pathname: '/[tenant]/tenant-admin/login',
          query: { tenant }
        });
      }, 3000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      
      setSnackbar({
        open: true,
        message: error.message || 'Failed to reset password. Please try again.',
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
        <title>Reset Password | Tenant Admin</title>
        <meta name="description" content="Reset your tenant admin password" />
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
                Reset Password
              </Typography>
              
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
                Enter your new password below.
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={handlePasswordChange}
                  error={!!passwordError}
                  helperText={passwordError}
                  disabled={isLoading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={togglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  error={!!confirmPasswordError}
                  helperText={confirmPasswordError}
                  disabled={isLoading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={toggleConfirmPasswordVisibility}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isLoading || !!passwordError || !!confirmPasswordError}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Reset Password'
                  )}
                </Button>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Link href={`/${tenant}/tenant-admin/login`} passHref>
                    <MuiLink variant="body2">
                      Remember your password? Sign in
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

export default ResetPasswordPage;

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
