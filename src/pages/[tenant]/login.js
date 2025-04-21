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
import api, { checkUserExists, loginUser, verifyTwoFactorLogin } from '../../utils/api';
import Header from '../../components/common/Header';
import TwoFactorVerify from '../../components/auth/TwoFactorVerify';

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

const TenantLoginPage = ({ tenant }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [needs2FASetup, setNeeds2FASetup] = useState(false);
  const [userId, setUserId] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  
  const router = useRouter();
  
  useEffect(() => {
    // Log tenant information
    if (tenant) {
      console.log(`Tenant from props: ${tenant}`);
    }
    
    // Set email from URL query parameter if available
    if (router.query.email && !email) {
      setEmail(router.query.email);
      // If email is in URL, automatically check if user exists
      if (validateEmail(router.query.email)) {
        const checkUser = async () => {
          setIsLoading(true);
          try {
            const response = await checkUserExists(router.query.email, tenant);
            setUserExists(response.exists);
            setIsLoading(false);
          } catch (error) {
            console.error('Error checking user from URL parameter:', error);
            setIsLoading(false);
          }
        };
        checkUser();
      }
    }
  }, [router.query.email, email, tenant]);
  
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
  
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
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
      const response = await checkUserExists(email, tenant);
      console.log('User check response:', response);
      
      if (response.exists) {
        setUserExists(true);
        
        // Check if user has a role
        if (!response.has_role) {
          setSnackbar({
            open: true,
            message: 'Your account exists but does not have any assigned roles. Please contact your administrator.',
            severity: 'warning'
          });
        }
        
        // Update URL with email parameter without navigation
        const url = new URL(window.location.href);
        url.searchParams.set('email', email);
        window.history.replaceState({}, '', url.toString());
      } else {
        // User doesn't exist
        setSnackbar({
          open: true,
          message: 'User not found. Please check your email or contact support.',
          severity: 'error'
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      setIsLoading(false);
      setSnackbar({
        open: true,
        message: 'Error checking user. Please try again.',
        severity: 'error'
      });
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError('');
    setPasswordError('');
    
    // Validate inputs
    let hasError = false;
    
    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }
    
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }
    
    if (hasError) return;
    
    // Attempt login
    setIsLoading(true);
    try {
      const response = await loginUser({ email, password }, tenant);
      
      // Handle 2FA if required
      if (response.requires_2fa) {
        setRequires2FA(true);
        setNeeds2FASetup(response.needs_2fa_setup);
        setUserId(response.user_id);
        setTenantInfo(response.tenant_info);
        setIsLoading(false);
        return;
      }
      
      // Login successful, redirect to dashboard
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect to the tenant dashboard
      router.push(`/${tenant}/dashboard`);
      
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      setSnackbar({
        open: true,
        message: error.message || 'Login failed. Please check your credentials and try again.',
        severity: 'error'
      });
    }
  };
  
  const handleVerify2FA = async (code) => {
    setIsLoading(true);
    try {
      const response = await verifyTwoFactorLogin(userId, code);
      
      // Login successful, save token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect to the tenant dashboard
      router.push(`/${tenant}/dashboard`);
      
    } catch (error) {
      console.error('2FA verification error:', error);
      setIsLoading(false);
      setSnackbar({
        open: true,
        message: error.message || 'Verification failed. Please try again.',
        severity: 'error'
      });
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>{tenant ? `${tenant.toUpperCase()} Login` : 'Tenant Login'}</title>
        <meta name="description" content="Login to your tenant account" />
      </Head>
      
      <Header tenant={tenant} />
      
      <Container component="main" maxWidth="xs">
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
        
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {requires2FA ? (
            <TwoFactorVerify
              onVerify={handleVerify2FA}
              isLoading={isLoading}
              needs2FASetup={needs2FASetup}
              userId={userId}
              tenantInfo={tenantInfo}
            />
          ) : (
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              elevation={3}
              sx={{ p: 4, width: '100%', borderRadius: 2 }}
            >
              <Typography component="h1" variant="h4" align="center" gutterBottom>
                {tenant ? `${tenant.toUpperCase()}` : 'Tenant'} Login
              </Typography>
              
              <Box component="form" noValidate sx={{ mt: 1 }}>
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
                  error={!!emailError}
                  helperText={emailError}
                  disabled={userExists || isLoading}
                />
                
                {!userExists ? (
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
                ) : (
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
                      error={!!passwordError}
                      helperText={passwordError}
                      disabled={isLoading}
                    />
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2, py: 1.5 }}
                      onClick={handleLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
                    </Button>
                  </>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <MuiLink component={Link} href={`/${tenant}/forgot-password`} variant="body2">
                    Forgot password?
                  </MuiLink>
                  
                  <MuiLink component={Link} href={`/${tenant}/signup`} variant="body2">
                    {"Don't have an account? Sign Up"}
                  </MuiLink>
                </Box>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <MuiLink component={Link} href={`/${tenant}/tenant-admin/login`} variant="body2">
                    Tenant Admin Login
                  </MuiLink>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export async function getServerSideProps(context) {
  const { tenant } = context.params;
  
  return {
    props: {
      tenant,
    },
  };
}

export default TenantLoginPage;
