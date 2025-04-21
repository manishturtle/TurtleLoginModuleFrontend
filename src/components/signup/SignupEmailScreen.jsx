import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Paper,
  CircularProgress,
  FormControl,
  FormHelperText,
  Autocomplete,
  InputLabel, 
  Select, 
  MenuItem
} from '@mui/material';
import { useRouter } from 'next/router';
import api, { checkEmailAvailability } from '@/utils/api';
import { motion } from 'framer-motion';

// List of countries for nationality dropdown
const NATIONALITIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 
  'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 
  'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 
  'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 
  'Congo (Democratic Republic)', 'Congo (Republic)', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 
  'Czech Republic (Czechia)', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini (Swaziland)', 
  'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 
  'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 
  'Ivory Coast (Côte d\'Ivoire)', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 
  'Korea (North)', 'Korea (South)', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 
  'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 
  'Myanmar (Burma)', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 
  'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const SignupEmailScreen = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationality, setNationality] = useState('');
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [nationalityError, setNationalityError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const emailRef = useRef(null);
  const router = useRouter();

  // Set focus on email field when component mounts and detect country
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
    
    // Detect user's country based on IP address
    const detectCountry = async () => {
      try {
        setIsLoadingLocation(true);
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data && data.country_name) {
          // Find the closest match in our nationalities list
          const countryName = data.country_name;
          
          // Direct mapping for some common countries with different names
          const countryMapping = {
            'United States': 'United States',
            'UK': 'United Kingdom',
            'UAE': 'United Arab Emirates',
            'South Korea': 'Korea (South)',
            'North Korea': 'Korea (North)',
            'Burma': 'Myanmar (Burma)',
            'Swaziland': 'Eswatini (Swaziland)',
            'Côte d\'Ivoire': 'Ivory Coast (Côte d\'Ivoire)'
          };
          
          const mappedCountry = countryMapping[countryName] || countryName;
          
          // Find exact match or close match
          const exactMatch = NATIONALITIES.find(nat => 
            nat.toLowerCase() === mappedCountry.toLowerCase()
          );
          
          const containsMatch = !exactMatch ? NATIONALITIES.find(nat => 
            nat.toLowerCase().includes(mappedCountry.toLowerCase()) || 
            mappedCountry.toLowerCase().includes(nat.toLowerCase())
          ) : null;
          
          if (exactMatch || containsMatch) {
            setNationality(exactMatch || containsMatch);
          }
        }
      } catch (error) {
        console.error('Error detecting country:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    
    detectCountry();
  }, []);

  // Email validation regex
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handleFirstNameChange = (e) => {
    setFirstName(e.target.value);
    if (firstNameError) setFirstNameError('');
  };

  const handleLastNameChange = (e) => {
    setLastName(e.target.value);
    if (lastNameError) setLastNameError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError('');
    setFirstNameError('');
    setLastNameError('');
    setNationalityError('');
    
    // Validate fields
    let isValid = true;
    
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    }
    
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    }
    
    if (!nationality) {
      setNationalityError('Nationality is required');
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Check email availability
    setIsLoading(true);
    try {
      console.log('Submitting form with:', { email, firstName, lastName, nationality });
      
      // Use the utility function instead of direct API call
      const result = await checkEmailAvailability(email);
      
      console.log('Response from check-email:', result);
      
      if (result.email_available === false) {
        setIsLoading(false);
        setEmailError(
          <Box>
            <Typography variant="body2" gutterBottom>
              {result.message || 'This email is already registered.'}
            </Typography>
            <Button 
              variant="text" 
              color="primary" 
              onClick={() => router.push('/login')}
              sx={{ padding: 0, textTransform: 'none' }}
            >
              Would you like to login instead?
            </Button>
          </Box>
        );
        return;
      }
      
      // Continue with form submission
      router.push({
        pathname: '/signup/password',
        query: { 
          email,
          firstName,
          lastName,
          nationality
        }
      });
    } catch (error) {
      console.error('Error checking email availability:', error);
      
      // Check if it's a 409 conflict (email already exists)
      if (error.response && error.response.status === 409) {
        setEmailError(
          <Box>
            <Typography variant="body2" gutterBottom>
              {error.response.data.message || 'This email is already registered.'}
            </Typography>
            <Button 
              variant="text" 
              color="primary" 
              onClick={() => router.push('/login')}
              sx={{ padding: 0, textTransform: 'none' }}
            >
              Would you like to login instead?
            </Button>
          </Box>
        );
      } else {
        setEmailError('An error occurred while checking email availability. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            mt: 8, 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 600,
              textAlign: 'center',
              mb: 3
            }}
          >
            Create your account
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="given-name"
              placeholder="Enter your first name"
              value={firstName}
              onChange={handleFirstNameChange}
              error={!!firstNameError}
              helperText={firstNameError}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              placeholder="Enter your last name"
              value={lastName}
              onChange={handleLastNameChange}
              error={!!lastNameError}
              helperText={lastNameError}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              helperText={emailError}
              inputRef={emailRef}
              sx={{ mb: 2 }}
            />
            
            <FormControl 
              fullWidth 
              required 
              error={!!nationalityError}
              sx={{ mb: 3, mt: 1 }}
            >
              <Autocomplete
                id="nationality"
                options={NATIONALITIES}
                value={nationality}
                onChange={(event, newValue) => {
                  setNationality(newValue);
                  if (nationalityError) setNationalityError('');
                }}
                loading={isLoadingLocation}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nationality"
                    required
                    error={!!nationalityError}
                    helperText={nationalityError}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingLocation ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </FormControl>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              sx={{ 
                mt: 2, 
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                borderRadius: 1.5
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Continue'
              )}
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default SignupEmailScreen;
