import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Container, Box, Typography, Button } from '@mui/material';
import TwoFactorVerify from '../../components/auth/TwoFactorVerify';

/**
 * Two-Factor Authentication verification page
 * 
 * This page is displayed after successful username/password authentication
 * for users who have 2FA enabled.
 */
const TwoFactorVerificationPage = () => {
  const router = useRouter();
  const { email, userId } = router.query;
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  
  // Handle successful 2FA verification
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
  
  // Handle switch to recovery code verification
  const handleUseRecoveryCode = () => {
    // In a real application, you would redirect to the recovery code verification page
    // with the necessary parameters
    router.push({
      pathname: '/login/recovery-code',
      query: { email, userId }
    });
  };
  
  // If email or userId is not provided, show an error
  if (!email || !userId) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Head>
          <title>Two-Factor Authentication | SaaS ERP</title>
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
        <title>Two-Factor Authentication | SaaS ERP</title>
        <meta name="description" content="Verify your identity with two-factor authentication" />
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
        <TwoFactorVerify
          email={email}
          userId={userId}
          onSuccess={handleVerificationSuccess}
          onUseRecoveryCode={handleUseRecoveryCode}
        />
      )}
    </Container>
  );
};

export default TwoFactorVerificationPage;
