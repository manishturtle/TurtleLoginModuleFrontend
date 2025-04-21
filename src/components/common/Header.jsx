import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Box, useTheme, Button, IconButton, Typography, Menu, MenuItem } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { logoutUser, isAuthenticated } from '../../services/authService';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Head from 'next/head';

const Header = () => {
  const theme = useTheme();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  useEffect(() => {
    // Check authentication status when component mounts
    setAuthenticated(isAuthenticated());
    
    // Add event listener for storage changes to detect login/logout
    const handleStorageChange = () => {
      setAuthenticated(isAuthenticated());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Create a custom event listener for auth changes within the same window
    const handleAuthChange = () => {
      setAuthenticated(isAuthenticated());
    };
    
    window.addEventListener('authChange', handleAuthChange);
    
    // Check authentication status periodically
    const interval = setInterval(() => {
      setAuthenticated(isAuthenticated());
    }, 3000);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
      clearInterval(interval);
    };
  }, []);
  
  // Debug authentication state
  useEffect(() => {
    console.log('Authentication state:', authenticated);
    console.log('Token:', localStorage.getItem('token'));
  }, [authenticated]);
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      // Redirect will be handled by logoutUser
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  return (
    <>
      <Head>
        <link rel="icon" href="/images/turtle-favicon.png" />
      </Head>
      <AppBar 
        position="static" 
        color="default" 
        elevation={0}
        sx={{ 
          backgroundColor: 'white',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Fix for hydration error - use the Link component properly */}
          <Link href="/" passHref legacyBehavior>
            <Box 
              component="a"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                textDecoration: 'none', 
                color: 'inherit'
              }}
            >
              <Image
                src="/images/turtle-software-logo.png"
                alt="Turtle Software Logo"
                width={165}
                height={60}
                priority
              />
            </Box>
          </Link>
        
          {authenticated && (
            <Box>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="primary"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={open}
                onClose={handleClose}
              >
                <MenuItem onClick={() => {
                  handleClose();
                  router.push('/profile');
                }}>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => {
                  handleClose();
                  router.push('/security/two-factor-setup');
                }}>
                  Security Settings
                </MenuItem>
                <MenuItem onClick={() => {
                  handleClose();
                  handleLogout();
                }}>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Header;
