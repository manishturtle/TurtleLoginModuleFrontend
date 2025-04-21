import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Breadcrumbs, Alert } from '@mui/material';
import Link from 'next/link';
import TwoFactorSetup from '../../components/security/TwoFactorSetup';
import Head from 'next/head';
import { useRouter } from 'next/router';
import HomeIcon from '@mui/icons-material/Home';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';

/**
 * Two-Factor Authentication Setup Page
 * 
 * This page allows users to set up two-factor authentication for their account.
 * It can be accessed in two ways:
 * 1. Regular setup: User chooses to enable 2FA from security settings
 * 2. Forced setup: User is redirected here after login if 2FA is required but not set up
 */
const TwoFactorSetupPage = () => {
  const router = useRouter();
  const [isForcedSetup, setIsForcedSetup] = useState(false);
  const [isFromSignup, setIsFromSignup] = useState(false);

  // Check if this is a forced setup from login
  useEffect(() => {
    // Check if there's a temporary token in localStorage
    const tempToken = localStorage.getItem('temp_token');
    const tempUserId = localStorage.getItem('temp_user_id');
    
    // If there's a temporary token, this is a forced setup
    if (tempToken && tempUserId) {
      setIsForcedSetup(true);
      
      // Check if this is coming from signup flow
      // Only access document.referrer in the browser
      if (typeof window !== 'undefined') {
        const referrer = document.referrer;
        if (referrer && referrer.includes('/signup/verify')) {
          console.log('Detected signup flow for 2FA setup');
          setIsFromSignup(true);
        }
      }
    } else {
      // Check if the user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Set Up Two-Factor Authentication | Turtle ERP</title>
        <meta name="description" content="Enhance your account security by setting up two-factor authentication" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {!isForcedSetup && (
          <Box mb={4}>
            <Breadcrumbs aria-label="breadcrumb">
              <Link 
                href="/dashboard"
                style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Dashboard
              </Link>
              <Link
                href="/security"
                style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}
              >
                <SecurityIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Security
              </Link>
              <Typography
                sx={{ display: 'flex', alignItems: 'center' }}
                color="text.primary"
              >
                <LockIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Two-Factor Authentication
              </Typography>
            </Breadcrumbs>
          </Box>
        )}
        
        {isForcedSetup && (
          <Box mb={4}>
            <Alert severity="info" sx={{ mb: 2 }}>
              For your account security, you need to set up two-factor authentication before continuing.
            </Alert>
          </Box>
        )}
        
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Two-Factor Authentication Setup
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enhance your account security by adding a second layer of protection.
          </Typography>
        </Box>
        
        <TwoFactorSetup isForcedSetup={isForcedSetup} isFromSignup={isFromSignup} />
      </Container>
    </>
  );
};

// This page requires authentication
export async function getServerSideProps(context) {
  return {
    props: {}, // will be passed to the page component as props
  };
}

export default TwoFactorSetupPage;
