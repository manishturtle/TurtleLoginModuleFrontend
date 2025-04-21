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
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import api, { loginUser, checkUserExists } from '../utils/api';
import Header from '../components/common/Header';
import TwoFactorVerify from '../components/auth/TwoFactorVerify';

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

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [needs2FASetup, setNeeds2FASetup] = useState(false);
  const [userId, setUserId] = useState(null);
  
  const router = useRouter();
  
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
    // Reset user exists state when email changes
    if (userExists) setUserExists(false);
  };
  
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError('');
  };

  const handlePlatformAdminChange = (e) => {
    setIsPlatformAdmin(e.target.checked);
    // If checked, we'll show the password field directly
    if (e.target.checked) {
      setUserExists(true);
    } else if (!userExists) {
      // Only reset if the user doesn't exist yet
      setUserExists(false);
    }
  };

  const handleCheckUser = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError('');
    
    // Validate email
    if (!email) {
      setEmailError('Email is required');
      return;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Check if user exists
    setIsLoading(true);
    try {
      console.log('Checking if user exists:', email, isPlatformAdmin ? '(as platform admin)' : '');
      
      let userData;
      if (isPlatformAdmin) {
        // For platform admin, we'll check directly with the login endpoint later
        userData = { user_exists: true };
      } else {
        // For regular users, check if they exist
        userData = await checkUserExists(email);
      }
      
      console.log('Check user response:', userData);
      
      if (userData.user_exists) {
        setUserExists(true);
      } else {
        setEmailError('User does not exist');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      
      setEmailError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setPasswordError('');
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    
    // Submit the login
    setIsLoading(true);
    try {
      console.log('Submitting login with:', { email, password, isPlatformAdmin });
      
      // Use the loginUser function from the API utility
      const loginData = await loginUser({ email, password }, isPlatformAdmin);
      
      console.log('Login response:', loginData);
      
      // Check if there was an error
      if (loginData.success === false) {
        setPasswordError(loginData.message || 'Invalid credentials');
        setIsLoading(false);
        return;
      }
      
      // Check if 2FA is required
      if (loginData.requires_2fa) {
        console.log('2FA required, setting requires2FA state to true');
        setRequires2FA(true);
        setUserId(loginData.user_id);
        setIsLoading(false);
        return;
      }
      
      // Check if 2FA setup is needed
      if (loginData.needs_2fa_setup) {
        console.log('2FA setup needed, storing temp token and user ID:', {
          temp_token: loginData.temp_token,
          user_id: loginData.user_id
        });
        
        // Store the temporary token and user ID for 2FA setup
        localStorage.setItem('temp_token', loginData.temp_token);
        localStorage.setItem('temp_user_id', loginData.user_id.toString());
        
        // Show message about 2FA setup requirement
        setSnackbar({
          open: true,
          message: '2FA setup is required for your account security',
          severity: 'info'
        });
        
        // Redirect to 2FA setup page
        setTimeout(() => {
          router.push('/security/two-factor-setup');
        }, 1500);
        
        return;
      }
      
      // Store the token in localStorage
      localStorage.setItem('token', loginData.token);
      
      // Store user data if available
      if (loginData.user) {
        localStorage.setItem('user', JSON.stringify(loginData.user));
      }
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Login successful! Redirecting to dashboard...',
        severity: 'success'
      });
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        // If platform admin is checked, redirect to platform admin dashboard
        if (isPlatformAdmin) {
          router.push('/platform-admin');
        } else {
          router.push('/dashboard');
        }
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
      
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'An error occurred during login',
        severity: 'error'
      });
      
      setIsLoading(false);
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  const handleTenantAdminLogin = () => {
    // Prompt for tenant name
    const tenant = prompt("Please enter your tenant name (e.g., 'qa'):");
    if (tenant) {
      // Navigate to the tenant-specific admin login page
      router.push(`/${tenant}/tenant-admin/login`);
    }
  };

  // If 2FA verification is required
  if (requires2FA) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Header />
        <Container component="main" maxWidth="xs">
          <Box sx={{ mt: 8 }}>
            <TwoFactorVerify 
              userId={userId} 
              onSuccess={(token) => {
                // Store the token
                localStorage.setItem('token', token);
                
                // Show success message
                setSnackbar({
                  open: true,
                  message: 'Login successful! Redirecting to dashboard...',
                  severity: 'success'
                });
                
                // Redirect to dashboard
                setTimeout(() => {
                  // If platform admin is checked, redirect to platform admin dashboard
                  if (isPlatformAdmin) {
                    router.push('/platform-admin');
                  } else {
                    router.push('/dashboard');
                  }
                }, 1500);
              }}
            />
          </Box>
        </Container>
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>Login | ERP System</title>
        <meta name="description" content="Login to access your ERP dashboard" />
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
              mt: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                width: '100%',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Typography component="h1" variant="h4" gutterBottom>
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {userExists ? 'Enter your password to continue' : 'Enter your email to continue'}
              </Typography>
              
              <Box component="form" sx={{ mt: 2, width: '100%' }} noValidate>
                {!userExists ? (
                  // Email input step
                  <>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={handleEmailChange}
                      error={Boolean(emailError)}
                      helperText={emailError}
                      disabled={isLoading}
                    />
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isPlatformAdmin}
                          onChange={handlePlatformAdminChange}
                          name="isPlatformAdmin"
                          color="primary"
                        />
                      }
                      label="I am a platform administrator"
                      sx={{ mt: 1 }}
                    />
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2, py: 1.5 }}
                      onClick={handleCheckUser}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Continue'}
                    </Button>
                    
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography variant="body2">
                        Don't have an account?{' '}
                        <Link href="/signup" passHref>
                          <MuiLink variant="body2">
                            Sign up
                          </MuiLink>
                        </Link>
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Are you a tenant administrator?{' '}
                        <MuiLink 
                          variant="body2" 
                          component="button"
                          onClick={handleTenantAdminLogin}
                          sx={{ 
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontFamily: 'inherit',
                            padding: 0
                          }}
                        >
                          Tenant Admin Login
                        </MuiLink>
                      </Typography>
                    </Box>
                  </>
                ) : (
                  // Password input step
                  <>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type="password"
                      id="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={handlePasswordChange}
                      error={Boolean(passwordError)}
                      helperText={passwordError}
                      disabled={isLoading}
                      autoFocus
                    />
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2, py: 1.5 }}
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Login'}
                    </Button>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 1 }}>
                      <Button
                        variant="text"
                        onClick={() => {
                          setUserExists(false);
                          setPassword('');
                          setPasswordError('');
                        }}
                        disabled={isLoading}
                      >
                        Back
                      </Button>
                      
                      <Link href="/forgot-password" passHref>
                        <MuiLink variant="body2">
                          Forgot password?
                        </MuiLink>
                      </Link>
                    </Box>
                  </>
                )}
              </Box>
            </Paper>
          </Box>
        </motion.div>
      </Container>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

// Email validation function
const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export default LoginPage;
