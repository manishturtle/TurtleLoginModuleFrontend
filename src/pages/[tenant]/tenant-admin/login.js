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
import api, { checkUserExists, loginTenantAdmin, verifyTenantAdminTwoFactor } from '../../../utils/api';
import Header from '../../../components/common/Header';
import TwoFactorVerify from '../../../components/auth/TwoFactorVerify';

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

const TenantAdminLoginPage = ({ tenant: initialTenant }) => {
  const router = useRouter();
  
  // Get the tenant from router.query if available, otherwise use the initialTenant from props
  // Ensure we never use the literal string '[tenant]'
  let tenant = router.query.tenant || initialTenant;
  
  // If tenant is still not available or is '[tenant]', try to extract it from the URL path
  if (!tenant || tenant === '[tenant]') {
    // Extract tenant from URL path if we're on the client side
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      // The first part after the leading slash should be the tenant
      if (pathParts.length > 1 && pathParts[1]) {
        tenant = pathParts[1];
        console.log('Extracted tenant from URL path:', tenant);
      } else {
        tenant = 'qa'; // Default to 'qa' for testing if tenant is not valid
        console.log('Could not extract tenant from URL, using default:', tenant);
      }
    } else {
      tenant = 'qa'; // Default to 'qa' for testing if tenant is not valid
      console.log('Server-side rendering with no tenant, using default:', tenant);
    }
  }
  
  // Add debugging logs for tenant parameter
  console.log('TenantAdminLoginPage rendered with tenant:', {
    initialTenant,
    routerQueryTenant: router.query.tenant,
    finalTenant: tenant
  });
  
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
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  
  // Log tenant parameter on component mount
  useEffect(() => {
    console.log('Component mounted with tenant:', tenant);
    
    // If we're on the client side and the URL contains [tenant], redirect to the correct URL
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      
      if (path.includes('[tenant]')) {
        console.log('Detected [tenant] in URL, redirecting to the correct URL');
        const correctPath = path.replace('[tenant]', tenant);
        router.replace(correctPath);
      }
      
      // Also check if we're at the literal path with [tenant] (happens with direct navigation)
      if (path === '/[tenant]/tenant-admin/login') {
        console.log('Detected literal [tenant] path, redirecting to the correct URL');
        router.replace(`/${tenant}/tenant-admin/login`);
      }
    }
  }, [tenant, router]);
  
  useEffect(() => {
    // Validate tenant is provided
    if (!tenant) {
      setSnackbar({
        open: true,
        message: 'Tenant name is required. Please ensure you are accessing from the correct URL.',
        severity: 'error'
      });
      return;
    }
    
    console.log(`Tenant from URL: ${tenant}`);
    
    // Set email from URL query parameter if available
    if (router.query.email && !email) {
      setEmail(router.query.email);
      // If email is in URL, automatically check if user exists
      if (validateEmail(router.query.email)) {
        const checkUser = async () => {
          setIsLoading(true);
          try {
            const response = await checkUserExists(router.query.email, tenant);
            setUserExists(response.user_exists);
            setIsLoading(false);
          } catch (error) {
            console.error('Error checking user from URL parameter:', error);
            setIsLoading(false);
            setSnackbar({
              open: true,
              message: error.message || 'Error checking user. Please try again.',
              severity: 'error'
            });
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

  const handleCheckUser = async () => {
    // Validate email
    if (!email || !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Clear previous errors
    setEmailError('');
    
    // Check if user exists
    setIsLoading(true);
    try {
      // This will check if the user exists in the tenant-specific schema
      // The backend will look up the tenant in public.authentication_client using url_suffix
      // Then switch to the associated schema_name to check if the user exists
      console.log(`Making API call to check if user ${email} exists in tenant ${tenant}`);
      const response = await checkUserExists(email, tenant);
      console.log('User existence check response:', response);
      
      setIsLoading(false);
      
      if (response && response.user_exists) {
        console.log(`User ${email} exists in tenant ${tenant}`);
        setUserExists(true);
        
        // Update URL with email parameter without navigation
        const url = new URL(window.location.href);
        url.searchParams.set('email', email);
        window.history.replaceState({}, '', url.toString());
      } else {
        // User doesn't exist
        console.log(`User ${email} does NOT exist in tenant ${tenant}`);
        setUserExists(false);
        setEmailError(response.message || `User not found in tenant "${tenant}"`);
        
        setSnackbar({
          open: true,
          message: response.message || `User not found in tenant "${tenant}". Please check your email or contact support.`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
      setIsLoading(false);
      setUserExists(false);
      
      // Extract error message from response if available
      let errorMessage = 'Error checking user. Please try again.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      setEmailError(errorMessage);
      
      setSnackbar({
        open: true,
        message: errorMessage,
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
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    
    setIsLoading(true);
    try {
      // Authenticate with the backend
      // The backend will:
      // 1. Look up the tenant in public.authentication_client table using url_suffix
      // 2. Get the schema_name associated with that tenant
      // 3. Switch to that schema to authenticate the user
      // 4. Return the result and switch back to public schema
      console.log(`Attempting to login user ${email} for tenant ${tenant}`);
      const response = await loginTenantAdmin(email, password, tenant);
      
      // Check if there was an error returned from the API
      if (response.error) {
        console.error('Login error returned from API:', response);
        
        // Show error message
        setSnackbar({
          open: true,
          message: response.message || 'Login failed. Please check your credentials.',
          severity: 'error'
        });
        
        setIsLoading(false);
        return;
      }
      
      console.log('Login response:', response);
      
      // Check if 2FA is required
      if (response.requires_2fa) {
        console.log('2FA is required');
        setUserId(response.user_id);
        setRequires2FA(true);
        setIsLoading(false);
        return;
      }
      
      // Check if 2FA setup is needed
      if (response.needs_2fa_setup) {
        console.log('2FA setup is needed');
        setUserId(response.user_id);
        setTempToken(response.temp_token);
        setNeeds2FASetup(true);
        setIsLoading(false);
        return;
      }
      
      // Store authentication data in localStorage
      try {
        // Handle different token formats (JWT vs regular)
        if (typeof response.token === 'object' && response.token.access) {
          // JWT token format for tenant admins
          console.log('Storing JWT token in localStorage');
          localStorage.setItem('token', JSON.stringify(response.token));
        } else {
          // Regular token format
          console.log('Storing regular token in localStorage');
          localStorage.setItem('token', response.token);
        }
        
        localStorage.setItem('user', JSON.stringify(response.user));
        
        if (response.tenant) {
          localStorage.setItem('tenant', JSON.stringify(response.tenant));
        }
      } catch (error) {
        console.error('Error storing data in localStorage:', error);
        throw new Error('Failed to store authentication data: ' + error.message);
      }
      
      // Redirect to tenant-admin/index.js using the router.push with query params
      router.push({
        pathname: '/[tenant]/tenant-admin/dashboard',
        query: { tenant }
      });
    } catch (error) {
      console.error('Login error:', error);
      
      // Show error message
      setSnackbar({
        open: true,
        message: error.message || 'Login failed. Please check your credentials.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerify2FA = async (code) => {
    setIsLoading(true);
    try {
      // Verify 2FA code
      // The backend will:
      // 1. Look up the tenant in public.authentication_client table using url_suffix
      // 2. Get the schema_name associated with that tenant
      // 3. Switch to that schema to verify the 2FA code
      // 4. Return the result and switch back to public schema
      const response = await verifyTenantAdminTwoFactor(userId, code, tenant);
      
      // Store authentication data in localStorage
      try {
        // Handle different token formats (JWT vs regular)
        if (typeof response.token === 'object' && response.token.access) {
          // JWT token format for tenant admins
          console.log('Storing JWT token in localStorage');
          localStorage.setItem('token', JSON.stringify(response.token));
        } else {
          // Regular token format
          console.log('Storing regular token in localStorage');
          localStorage.setItem('token', response.token);
        }
        
        localStorage.setItem('user', JSON.stringify(response.user));
        
        if (response.tenant) {
          localStorage.setItem('tenant', JSON.stringify(response.tenant));
        }
      } catch (error) {
        console.error('Error storing data in localStorage:', error);
        throw new Error('Failed to store authentication data: ' + error.message);
      }
      
      // Redirect to tenant-admin/index.js using the router.push with query params
      router.push({
        pathname: '/[tenant]/tenant-admin/dashboard',
        query: { tenant }
      });
    } catch (error) {
      console.error('2FA verification error:', error);
      setIsLoading(false);
      
      // Show error message
      setSnackbar({
        open: true,
        message: error.message || 'Verification failed. Please try again.',
        severity: 'error'
      });
    }
  };
  
  const handleVerifyRecoveryCode = async (recoveryCode) => {
    setIsLoading(true);
    try {
      const response = await verifyTenantAdminTwoFactorLogin(userId, null, recoveryCode);
      
      // Store authentication data in localStorage
      try {
        // Handle different token formats (JWT vs regular)
        if (typeof response.token === 'object' && response.token.access) {
          // JWT token format for tenant admins
          console.log('Storing JWT token in localStorage');
          localStorage.setItem('token', JSON.stringify(response.token));
        } else {
          // Regular token format
          console.log('Storing regular token in localStorage');
          localStorage.setItem('token', response.token);
        }
        
        localStorage.setItem('user', JSON.stringify(response.user));
        
        if (response.tenant) {
          localStorage.setItem('tenant', JSON.stringify(response.tenant));
        }
      } catch (error) {
        console.error('Error storing data in localStorage:', error);
        throw new Error('Failed to store authentication data: ' + error.message);
      }
      
      // Redirect to tenant-admin/index.js using the router.push with query params
      router.push({
        pathname: '/[tenant]/tenant-admin/dashboard',
        query: { tenant }
      });
    } catch (error) {
      console.error('Recovery code verification error:', error);
      setIsLoading(false);
      
      // Show error message
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
  
  // Render 2FA verification screen if required
  if (requires2FA) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Head>
          <title>Two-Factor Authentication | Tenant Admin</title>
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
            <TwoFactorVerify
              onVerify={handleVerify2FA}
              onVerifyRecoveryCode={handleVerifyRecoveryCode}
              isLoading={isLoading}
              needs2FASetup={needs2FASetup}
              userId={userId}
              tenantInfo={tenantInfo}
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
        <title>{tenant ? `${tenant.toUpperCase()} Tenant Admin Login` : 'Tenant Admin Login'}</title>
        <meta name="description" content="Login to your tenant admin account" />
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
          <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            elevation={3}
            sx={{ p: 4, width: '100%', borderRadius: 2 }}
          >
            <Typography component="h1" variant="h4" align="center" gutterBottom>
              {tenant ? `${tenant.toUpperCase()}` : 'Tenant'} Admin Login
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
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Link
                      href={{
                        pathname: '/[tenant]/tenant-admin/forgot-password',
                        query: { tenant }
                      }}
                      passHref
                    >
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
      </Container>
    </ThemeProvider>
  );
};

// Email validation function
function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export default TenantAdminLoginPage;

// Server-side props to get the tenant from the URL
export async function getServerSideProps(context) {
  const { tenant } = context.params;
  
  console.log('Server-side props - tenant from params:', tenant);
  
  // Validate that tenant is provided
  if (!tenant) {
    console.log('No tenant provided, redirecting to home');
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  // If tenant is the literal string '[tenant]', use a default tenant instead of redirecting
  let actualTenant = tenant;
  if (tenant === '[tenant]') {
    console.log('Literal [tenant] detected in server-side props, using default tenant "qa"');
    //actualTenant = 'qa';
  }
  
  console.log('Server-side props - tenant to use:', actualTenant);
  
  // Return tenant as props
  return {
    props: {
      tenant: actualTenant,
    },
  };
}
