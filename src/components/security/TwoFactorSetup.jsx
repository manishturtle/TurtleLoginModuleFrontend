import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress, 
  Alert, 
  Snackbar, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useRouter } from 'next/router';
import { startTwoFactorSetup, confirmTwoFactorSetup, verifyAndCompleteSignup } from '../../services/twoFactorService';
import { TOTP } from 'otpauth';

/**
 * TwoFactorSetup component for setting up 2FA authentication
 * 
 * This component handles the entire 2FA setup flow:
 * 1. Initiates the setup process by fetching a QR code and secret key
 * 2. Allows the user to scan the QR code with an authenticator app
 * 3. Verifies the code entered by the user
 * 4. Displays recovery codes upon successful verification
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isForcedSetup - Whether this is a forced setup from login
 * @param {boolean} props.isFromSignup - Whether this is coming from the signup flow
 */
const TwoFactorSetup = ({ isForcedSetup = false, isFromSignup = false }) => {
  const router = useRouter();
  
  // State for QR code and secret key
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [uri, setUri] = useState(null);
  
  // State for user input
  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  
  // State for recovery codes
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // State for forced setup
  const [userId, setUserId] = useState(null);
  const [tempToken, setTempToken] = useState(null);
  
  // Initialize setup
  useEffect(() => {
    const initSetup = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get user ID from localStorage if not provided
        const storedUserId = localStorage.getItem('temp_user_id');
        const storedTempToken = localStorage.getItem('temp_token');
        
        console.log('Initializing 2FA setup with:', {
          userId: userId || storedUserId,
          tempToken: tempToken || storedTempToken,
          isSignupFlow: isFromSignup,
          isForcedSetup
        });
        
        // Call the API to start the 2FA setup
        const setupData = await startTwoFactorSetup({
          userId: userId || storedUserId,
          tempToken: tempToken || storedTempToken,
          isForcedSetup: isForcedSetup,
          isSignupFlow: isFromSignup
        });
        
        // Store the QR code and secret
        setQrCode(setupData.qr_code);
        setSecret(setupData.secret);
        setUri(setupData.uri);
        
        // Store the secret in localStorage as a backup
        if (isFromSignup) {
          localStorage.setItem('signup_2fa_secret', setupData.secret);
        }
        
      } catch (error) {
        console.error('Error initializing 2FA setup:', error);
        setError('Failed to initialize 2FA setup. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    initSetup();
  }, [userId, tempToken, isForcedSetup, isFromSignup]);
  
  // Helper function to show snackbar notifications
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Handle verification code input change
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\s/g, ''); // Remove spaces
    
    // Only allow digits and limit to 6 characters
    if (/^\d*$/.test(value) && value.length <= 6) {
      setVerificationCode(value);
      setCodeError('');
    }
  };
  
  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!verificationCode) {
      setError('Please enter the verification code from your authenticator app');
      return;
    }
    
    try {
      setVerifying(true);
      setError('');
      
      console.log('Submitting verification code:', {
        verificationCode,
        userId,
        tempToken,
        isSignupFlow: isFromSignup,
        isForcedSetup
      });
      
      if (isFromSignup) {
        // For signup flow, use the verifyAndCompleteSignup function
        const email = localStorage.getItem('signup_email');
        const storedUserId = localStorage.getItem('temp_user_id');
        
        try {
          const response = await verifyAndCompleteSignup({
            email,
            userId: userId || storedUserId,
            verificationCode
          });
          
          console.log('Signup 2FA verification completed:', response);
          
          // Show success message
          setSnackbar({
            open: true,
            message: 'Two-factor authentication has been successfully verified!',
            severity: 'success'
          });
          
          // Mark setup as complete
          setSetupComplete(true);
          
          // Clean up localStorage
          localStorage.removeItem('signup_2fa_secret');
          
          // No need to store tokens as they're already stored in the verifyAndCompleteSignup function
        } catch (signupError) {
          console.error('Error verifying signup 2FA:', signupError);
          
          // If the verification fails, try using the backup secret from localStorage
          const backupSecret = localStorage.getItem('signup_2fa_secret');
          
          if (backupSecret && backupSecret !== secret) {
            console.log('Trying verification with backup secret');
            
            try {
              // Try the API call again with the backup secret
              const response = await verifyAndCompleteSignup({
                email,
                userId: userId || storedUserId,
                verificationCode,
                backupSecret // Pass the backup secret to the API
              });
              
              console.log('Signup 2FA verification completed with backup secret:', response);
              
              // Show success message
              setSnackbar({
                open: true,
                message: 'Two-factor authentication has been successfully verified!',
                severity: 'success'
              });
              
              // Mark setup as complete
              setSetupComplete(true);
              
              // Clean up localStorage
              localStorage.removeItem('signup_2fa_secret');
              
              return;
            } catch (retryError) {
              console.error('Error retrying signup verification:', retryError);
            }
          }
          
          // If we get here, both attempts failed
          setError(signupError.message || 'Failed to verify and complete signup. Please try again.');
        }
      } else {
        // For regular or forced setup flow, use the confirmTwoFactorSetup function
        const response = await confirmTwoFactorSetup({
          verificationCode,
          userId: userId || localStorage.getItem('temp_user_id'),
          tempToken: tempToken || localStorage.getItem('temp_token'),
          isForcedSetup: isForcedSetup,
          isSignupFlow: isFromSignup
        });
        
        console.log('2FA setup confirmed:', response);
        
        // Show success message
        setSnackbar({
          open: true,
          message: 'Two-factor authentication has been successfully enabled!',
          severity: 'success'
        });
        
        // Store the recovery codes
        setRecoveryCodes(response.recovery_codes);
        
        // Mark setup as complete
        setSetupComplete(true);
        
        // If we got a token back (signup or forced flow), store it
        if (response.token) {
          console.log('Storing authentication token');
          localStorage.setItem('auth_token', response.token.access);
          localStorage.setItem('refresh_token', response.token.refresh);
          
          // Clean up temporary tokens
          localStorage.removeItem('temp_token');
          localStorage.removeItem('temp_user_id');
        }
      }
      
    } catch (error) {
      console.error('Error confirming 2FA setup:', error);
      
      // Show error message
      setError(error.response?.data?.message || error.message || 'Failed to confirm 2FA setup. Please try again.');
    } finally {
      setVerifying(false);
    }
  };
  
  // Copy recovery codes to clipboard
  const copyRecoveryCodes = () => {
    const codesText = recoveryCodes.join('\n');
    navigator.clipboard.writeText(codesText)
      .then(() => showSnackbar('Recovery codes copied to clipboard', 'success'))
      .catch(() => showSnackbar('Failed to copy recovery codes', 'error'));
  };
  
  // Download recovery codes as a text file
  const downloadRecoveryCodes = () => {
    const codesText = recoveryCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSnackbar('Recovery codes downloaded', 'success');
  };
  
  // Handle completion
  const handleComplete = () => {
    // Determine where to redirect based on the flow
    if (isFromSignup) {
      // For signup flow, redirect to dashboard
      console.log('Redirecting to dashboard after signup 2FA setup');
      
      // Show a message about being redirected to the dashboard
      setSnackbar({
        open: true,
        message: 'Setup complete! Redirecting to dashboard...',
        severity: 'success'
      });
      
      // Delay the redirect slightly to show the message
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else if (isForcedSetup) {
      // For forced setup flow, redirect to dashboard
      console.log('Redirecting to dashboard after forced 2FA setup');
      router.push('/dashboard');
    } else {
      // For regular setup flow, redirect to security settings
      console.log('Redirecting to security settings after regular 2FA setup');
      router.push('/security');
    }
  };
  
  // Determine the appropriate title and message based on the setup context
  const getSetupContext = () => {
    if (isFromSignup) {
      return {
        title: 'Complete Your Account Setup',
        message: 'Two-factor authentication is required for all accounts. Please set up 2FA to continue.',
        buttonText: 'Complete Setup'
      };
    } else if (isForcedSetup) {
      return {
        title: 'Security Requirement',
        message: 'Your account requires two-factor authentication. Please set up 2FA to continue.',
        buttonText: 'Enable 2FA'
      };
    } else {
      return {
        title: 'Set Up Two-Factor Authentication',
        message: 'Enhance your account security by enabling two-factor authentication.',
        buttonText: 'Enable 2FA'
      };
    }
  };

  const { title, message, buttonText } = getSetupContext();
  
  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error && !qrCode) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }
  
  // Render setup complete state with recovery codes
  if (setupComplete) {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Box textAlign="center" mb={3}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
          <Typography variant="h5" gutterBottom>
            Two-Factor Authentication Enabled
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Your account is now more secure with two-factor authentication.
          </Typography>
        </Box>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            Important: Save Your Recovery Codes
          </Typography>
          <Typography variant="body2">
            If you lose access to your authentication app, you'll need these codes to log in.
            Each code can only be used once.
          </Typography>
        </Alert>
        
        <Card variant="outlined" sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                Recovery Codes
              </Typography>
              <Box>
                <Tooltip title="Copy codes">
                  <IconButton onClick={copyRecoveryCodes} size="small">
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download codes">
                  <IconButton onClick={downloadRecoveryCodes} size="small">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={1}>
              {recoveryCodes.map((code, index) => (
                <Grid item xs={6} key={index}>
                  <Typography variant="mono" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {code}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
        
        <Box mt={3} textAlign="center">
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            onClick={handleComplete}
          >
            Continue to Dashboard
          </Button>
        </Box>
      </Paper>
    );
  }
  
  // Render setup form
  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {isForcedSetup && (
        <Alert severity="info" sx={{ mb: 3 }}>
          For security reasons, your account requires two-factor authentication. Please complete the setup to continue.
        </Alert>
      )}
      
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body1" paragraph>
        {message}
      </Typography>
      
      <Typography variant="body1" paragraph>
        Scan the QR code below with your authenticator app (such as Google Authenticator, Microsoft Authenticator, or Authy).
      </Typography>
      
      {qrCode ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
          <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1, bgcolor: '#f9f9f9', mb: 2 }}>
            {uri ? (
              <QRCodeSVG value={uri} size={200} />
            ) : (
              <QRCodeSVG value={qrCode} size={200} />
            )}
          </Box>
          
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            Can't scan the QR code?
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            width: '100%',
            maxWidth: '400px',
            mb: 2
          }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
              {secret}
            </Typography>
            <Tooltip title="Copy secret key">
              <IconButton 
                size="small" 
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  showSnackbar('Secret key copied to clipboard', 'success');
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Enter this code manually in your authenticator app if you can't scan the QR code.
          </Typography>
        </Box>
      ) : null}
      
      <Box my={3}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Step 2: Enter verification code
        </Typography>
        <Typography variant="body2" paragraph>
          Enter the 6-digit code from your authenticator app to verify the setup.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="6-digit verification code"
            variant="outlined"
            value={verificationCode}
            onChange={handleCodeChange}
            error={!!codeError}
            helperText={codeError}
            placeholder="000000"
            inputProps={{ 
              maxLength: 6,
              inputMode: 'numeric',
              pattern: '[0-9]*'
            }}
            sx={{ mb: 2 }}
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={verifying}
          >
            {verifying ? <CircularProgress size={24} /> : buttonText}
          </Button>
        </form>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default TwoFactorSetup;
