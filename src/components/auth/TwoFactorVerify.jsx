import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress, 
  Alert, 
  Link,
  InputAdornment,
  IconButton
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { verifyTwoFactorLogin } from '../../services/twoFactorService';

/**
 * TwoFactorVerify component for verifying 2FA codes during login
 * 
 * This component is displayed after successful username/password authentication
 * for users who have 2FA enabled.
 * 
 * @param {Object} props - Component props
 * @param {string} props.email - The user's email address
 * @param {string} props.userId - The user's ID from the first login step
 * @param {function} props.onSuccess - Callback function to be called when 2FA verification is successful
 * @param {function} props.onUseRecoveryCode - Callback function to switch to recovery code verification
 * @param {function} props.customVerifyFunction - Optional custom function to use for verification
 */
const TwoFactorVerify = ({ email, userId, onSuccess, onUseRecoveryCode, customVerifyFunction }) => {
  // State for verification code input
  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  
  // Handle verification code input change
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\s/g, ''); // Remove spaces
    
    // Only allow digits and limit to 6 characters
    if (/^\d*$/.test(value) && value.length <= 6) {
      setVerificationCode(value);
      setCodeError('');
      setError('');
    }
  };
  
  // Toggle code visibility
  const handleToggleCodeVisibility = () => {
    setShowCode(!showCode);
  };
  
  // Handle form submission for code verification
  const handleVerify = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!verificationCode || verificationCode.length !== 6) {
      setCodeError('Please enter a valid 6-digit verification code');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Use custom verification function if provided, otherwise use the default
      let response;
      if (customVerifyFunction) {
        response = await customVerifyFunction(verificationCode);
      } else {
        response = await verifyTwoFactorLogin(userId, verificationCode);
      }
      
      // Call the onSuccess callback with the response data
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      onSuccess(response.token || response);
    } catch (err) {
      console.error('2FA verification error:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
      setCodeError('Invalid code');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Box display="flex" alignItems="center" mb={2}>
        <LockIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h5" component="h1">
          Two-Factor Verification
        </Typography>
      </Box>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Please enter the 6-digit verification code from your authenticator app to complete login.
      </Typography>
      
      {email && (
        <Typography variant="body2" fontWeight="medium" mb={2}>
          Logging in as: <strong>{email}</strong>
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleVerify}>
        <TextField
          fullWidth
          label="6-digit verification code"
          variant="outlined"
          value={verificationCode}
          onChange={handleCodeChange}
          error={!!codeError}
          helperText={codeError}
          placeholder="123456"
          margin="normal"
          autoFocus
          type={showCode ? 'text' : 'password'}
          inputProps={{ 
            maxLength: 6,
            inputMode: 'numeric',
            pattern: '[0-9]*'
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle code visibility"
                  onClick={handleToggleCodeVisibility}
                  edge="end"
                >
                  {showCode ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading || verificationCode.length !== 6}
          sx={{ mt: 2, mb: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
        </Button>
      </Box>
      
      {onUseRecoveryCode && (
        <Box textAlign="center" mt={2}>
          <Link 
            component="button" 
            variant="body2" 
            onClick={onUseRecoveryCode}
            underline="hover"
          >
            Lost your device? Use a recovery code
          </Link>
        </Box>
      )}
    </Paper>
  );
};

TwoFactorVerify.propTypes = {
  email: PropTypes.string,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onSuccess: PropTypes.func.isRequired,
  onUseRecoveryCode: PropTypes.func,
  customVerifyFunction: PropTypes.func
};

export default TwoFactorVerify;
