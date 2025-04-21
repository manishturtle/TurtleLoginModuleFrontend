import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const OtpVerificationScreen = ({ email, onVerificationComplete, onResendOtp, router }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Set up countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle OTP input change
  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      return;
    }
    
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1); // Only take the first character
    setOtp(newOtp);
    
    // If a digit was entered and we're not at the last input, focus the next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle key down events for backspace navigation
  const handleKeyDown = (e, index) => {
    // If backspace is pressed and current field is empty, focus previous field
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle paste event for OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // If pasted data is not a number or not 6 digits, return
    if (!/^\d+$/.test(pastedData) || pastedData.length !== 6) {
      return;
    }
    
    // Update OTP array with pasted digits
    const newOtp = pastedData.split('').slice(0, 6);
    setOtp(newOtp);
    
    // Focus the last input
    inputRefs.current[5].focus();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if OTP is complete
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call the verification complete callback with the OTP
      await onVerificationComplete(otpValue);
    } catch (error) {
      console.error('OTP verification error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        // User already exists error
        setError('A user with this email already exists. Please use a different email.');
        
        // Redirect to signup page after a delay
        setTimeout(() => {
          router.push('/signup');
        }, 3000);
      } else {
        // Generic error handling
        setError(error.message || 'Invalid OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setCountdown(60);
    
    try {
      await onResendOtp();
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError('Failed to resend OTP. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Verify Your Email
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Enter the 6-digit code
            </Typography>
            
            <Stack direction="row" spacing={1} justifyContent="center">
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  inputRef={(el) => (inputRefs.current[index] = el)}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : null}
                  variant="outlined"
                  inputProps={{
                    maxLength: 1,
                    style: { textAlign: 'center', fontSize: '1.5rem', padding: '8px' }
                  }}
                  sx={{ width: '48px' }}
                />
              ))}
            </Stack>
          </Box>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={isLoading || otp.join('').length !== 6}
            sx={{ mt: 2 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
          </Button>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Didn't receive the code?
            </Typography>
            
            <Button
              variant="text"
              color="primary"
              disabled={!canResend}
              onClick={handleResendOtp}
              startIcon={<Refresh />}
              sx={{ mt: 1 }}
              endIcon={
                !canResend && (
                  <Typography variant="caption" component="span">
                    {countdown}s
                  </Typography>
                )
              }
            >
              Resend Code
            </Button>
          </Box>
        </form>
      </Paper>
    </motion.div>
  );
};

OtpVerificationScreen.propTypes = {
  email: PropTypes.string.isRequired,
  onVerificationComplete: PropTypes.func.isRequired,
  onResendOtp: PropTypes.func.isRequired,
  router: PropTypes.object.isRequired,
};

export default OtpVerificationScreen;
