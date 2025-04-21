import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Container, Box, Typography, Button } from '@mui/material';
import RecoveryCodeVerify from '../../components/auth/RecoveryCodeVerify';

/**
 * Recovery Code verification page
 * 
 * This page is displayed when a user with 2FA enabled has lost access to their
 * authentication device and needs to use a recovery code.
 */
const RecoveryCodeVerificationPage = () => {
  const router = useRouter();
  const { email, userId } = router.query;
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  
  // Handle successful recovery code verification
  const handleVerificationSuccess = (response) => {
    setVerificationSuccess(true);
    
    // In a real application, you would:
    // 1. Store the authentication token from the response
    // 2. Update the auth state
    // 3. Redirect to the dashboard or intended page
    
    // For demo purposes, we'll just redirect to the dashboard after a short delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };
  
  // Handle back to regular 2FA verification
  const handleBackToVerification = () => {
    router.push({
      pathname: '/login/two-factor',
      query: { email, userId }
    });
  };
  
  // If email or userId is not provided, show an error
  if (!email || !userId) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Head>
          <title>Recovery Code Verification | SaaS ERP</title>
        </Head>
        <Box textAlign="center">
          <Typography variant="h5" color="error" gutterBottom>
            Invalid Authentication Request
          </Typography>
          <Typography variant="body1" paragraph>
            Missing required authentication parameters. Please try logging in again.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => router.push('/login')}
          >
            Return to Login
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Head>
        <title>Recovery Code Verification | SaaS ERP</title>
        <meta name="description" content="Verify your identity with a recovery code" />
      </Head>
      
      {verificationSuccess ? (
        <Box textAlign="center">
          <Typography variant="h5" color="primary" gutterBottom>
            Verification Successful!
          </Typography>
          <Typography variant="body1">
            You are being redirected to your dashboard...
          </Typography>
        </Box>
      ) : (
        <RecoveryCodeVerify
          email={email}
          userId={userId}
          onSuccess={handleVerificationSuccess}
          onBack={handleBackToVerification}
        />
      )}
    </Container>
  );
};

export default RecoveryCodeVerificationPage;
