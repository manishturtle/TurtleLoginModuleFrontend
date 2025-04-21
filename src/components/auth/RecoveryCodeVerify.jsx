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
  Link
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import { verifyRecoveryCode } from '../../services/twoFactorService';

/**
 * RecoveryCodeVerify component for verifying recovery codes during login
 * when a user has lost access to their 2FA device
 * 
 * @param {Object} props - Component props
 * @param {string} props.email - The user's email address
 * @param {string} props.userId - The user's ID from the first login step
 * @param {function} props.onSuccess - Callback function to be called when verification is successful
 * @param {function} props.onBack - Callback function to go back to regular 2FA verification
 */
const RecoveryCodeVerify = ({ email, userId, onSuccess, onBack }) => {
  // State for recovery code input
  const [recoveryCode, setRecoveryCode] = useState('');
  const [codeError, setCodeError] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle recovery code input change
  const handleCodeChange = (e) => {
    const value = e.target.value;
    setRecoveryCode(value);
    setCodeError('');
    setError('');
  };
  
  // Handle form submission for recovery code verification
  const handleVerify = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!recoveryCode.trim()) {
      setCodeError('Please enter a recovery code');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Call the API to verify the recovery code
      const response = await verifyRecoveryCode(userId, recoveryCode);
      
      // Call the onSuccess callback with the response data
      onSuccess(response);
    } catch (err) {
      setError(err.message || 'Invalid recovery code. Please try again.');
      setCodeError('Invalid code');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Box display="flex" alignItems="center" mb={2}>
        <KeyIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h5" component="h1">
          Recovery Code Verification
        </Typography>
      </Box>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Enter one of your recovery codes to access your account.
      </Typography>
      
      <Typography variant="body2" fontWeight="medium" mb={2}>
        Logging in as: <strong>{email}</strong>
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleVerify}>
        <TextField
          fullWidth
          label="Recovery Code"
          variant="outlined"
          value={recoveryCode}
          onChange={handleCodeChange}
          error={!!codeError}
          helperText={codeError}
          placeholder="XXXX-XXXX-XXXX"
          margin="normal"
          autoFocus
        />
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading || !recoveryCode.trim()}
          sx={{ mt: 2, mb: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
        </Button>
      </Box>
      
      <Box textAlign="center" mt={2}>
        <Link 
          component="button" 
          variant="body2" 
          onClick={onBack}
          underline="hover"
        >
          Back to verification code
        </Link>
      </Box>
    </Paper>
  );
};

RecoveryCodeVerify.propTypes = {
  email: PropTypes.string.isRequired,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onSuccess: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired
};

export default RecoveryCodeVerify;
