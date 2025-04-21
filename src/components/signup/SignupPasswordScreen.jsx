import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle, Cancel } from '@mui/icons-material';
import PropTypes from 'prop-types';

const SignupPasswordScreen = ({ email, onPasswordSet }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Password validation criteria
  const passwordCriteria = {
    minLength: { label: 'At least 8 characters', regex: /.{8,}/ },
    uppercase: { label: 'At least one uppercase letter', regex: /[A-Z]/ },
    lowercase: { label: 'At least one lowercase letter', regex: /[a-z]/ },
    number: { label: 'At least one number', regex: /[0-9]/ },
    special: { label: 'At least one special character (!@#$%^&*)', regex: /[!@#$%^&*]/ },
  };

  // Validate password against criteria
  const validatePassword = (value) => {
    const errors = {};
    let strengthScore = 0;

    Object.entries(passwordCriteria).forEach(([key, { regex, label }]) => {
      const isValid = regex.test(value);
      errors[key] = !isValid;
      if (isValid) strengthScore += 20; // Each criteria met adds 20% to strength
    });

    setPasswordErrors(errors);
    setPasswordStrength(strengthScore);
    
    // Check if confirm password still matches
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword, value);
    }
  };

  // Validate confirm password
  const validateConfirmPassword = (confirmValue, passwordValue = password) => {
    if (confirmValue !== passwordValue) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  // Check if form is valid
  useEffect(() => {
    const isPasswordValid = Object.values(passwordErrors).every(error => !error) && password.length > 0;
    const isConfirmValid = confirmPassword === password && confirmPassword.length > 0;
    setIsFormValid(isPasswordValid && isConfirmValid);
  }, [password, confirmPassword, passwordErrors]);

  // Handle password change
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    validateConfirmPassword(value);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      onPasswordSet(password);
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Get color for password strength meter
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'error';
    if (passwordStrength < 80) return 'warning';
    return 'success';
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Create Your Password
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Email"
          value={email}
          disabled
          margin="normal"
          InputProps={{
            readOnly: true,
          }}
        />
      </Box>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <TextField
            id="password"
            fullWidth
            label="Create a password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {/* Password strength meter */}
          {password.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" display="block" gutterBottom>
                Password Strength: {passwordStrength}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={passwordStrength} 
                color={getPasswordStrengthColor()}
                sx={{ height: 8, borderRadius: 5 }}
              />
            </Box>
          )}
          
          {/* Password criteria list */}
          <List dense sx={{ mt: 1 }}>
            {Object.entries(passwordCriteria).map(([key, { label }]) => (
              <ListItem key={key} sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  {password.length > 0 && (
                    passwordErrors[key] ? 
                    <Cancel color="error" fontSize="small" /> : 
                    <CheckCircle color="success" fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={label} 
                  primaryTypographyProps={{ 
                    variant: 'caption',
                    color: password.length > 0 && !passwordErrors[key] ? 'success.main' : 'text.secondary'
                  }} 
                />
              </ListItem>
            ))}
          </List>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            id="confirmPassword"
            fullWidth
            label="Confirm your password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            margin="normal"
            error={!!confirmPasswordError}
            helperText={confirmPasswordError}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={handleToggleConfirmPasswordVisibility}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          disabled={!isFormValid}
          sx={{ mt: 2 }}
        >
          Continue
        </Button>
      </form>
    </Paper>
  );
};

SignupPasswordScreen.propTypes = {
  email: PropTypes.string.isRequired,
  onPasswordSet: PropTypes.func.isRequired,
};

export default SignupPasswordScreen;
