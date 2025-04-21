import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Container, 
  IconButton,
  useTheme,
  Tooltip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Image from 'next/image';
import { logoutUser, getCurrentUser } from '../../services/authService';

// Drawer width
const drawerWidth = 240;
const collapsedDrawerWidth = 65;

const AdminLayout = ({ children, title = 'Platform Admin' }) => {
  const router = useRouter();
  const user = getCurrentUser();
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  
  const handleDrawerToggle = () => {
    setOpen(!open);
  };
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      // Redirect to platform admin login page
      router.push('/platform-admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/platform-admin' },
    { text: 'Tenants', icon: <BusinessIcon />, path: '/platform-admin/tenants' },
    { text: 'Users', icon: <PeopleIcon />, path: '/platform-admin/users' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/platform-admin/settings' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Head>
        <title>{title || 'Platform Admin'} | Turtle ERP</title>
        <meta name="description" content="Turtle ERP Platform Admin" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/turtle-favicon.png" />
      </Head>

      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${open ? drawerWidth : collapsedDrawerWidth}px)` },
          ml: { sm: `${open ? drawerWidth : collapsedDrawerWidth}px` },
          bgcolor: 'white',
          color: 'primary.main',
          boxShadow: 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Image
              src="/images/turtle-software-logo.png"
              alt="Turtle Software Logo"
              width={120}
              height={40}
              priority
            />
            <Typography variant="h6" noWrap component="div" sx={{ ml: 2 }}>
              {title || 'Platform Admin'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user?.email || 'Admin User'}
            </Typography>
            <IconButton color="primary" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : collapsedDrawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: open ? drawerWidth : collapsedDrawerWidth, 
            boxSizing: 'border-box',
            color: 'black',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: open ? 'space-between' : 'center',
          py: 2
        }}>
          {open && (
            <Typography variant="h6" noWrap>
              Admin Panel
            </Typography>
          )}
          <IconButton onClick={handleDrawerToggle}>
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Toolbar>
        <Divider />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <Tooltip title={open ? "" : item.text} placement="right" key={item.text}>
                <ListItem 
                  button 
                  onClick={() => router.push(item.path)}
                  selected={router.pathname === item.path}
                  sx={{
                    minHeight: 48,
                    px: 2.5,
                    '&.Mui-selected': {
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                    justifyContent: open ? 'initial' : 'center',
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: router.pathname === item.path ? 'primary.main' : 'inherit',
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {open && <ListItemText primary={item.text} />}
                </ListItem>
              </Tooltip>
            ))}
          </List>
          <Divider />
          <List>
            <Tooltip title={open ? "" : "Logout"} placement="right">
              <ListItem 
                button 
                onClick={handleLogout}
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  justifyContent: open ? 'initial' : 'center',
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}>
                  <LogoutIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Logout" />}
              </ListItem>
            </Tooltip>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? drawerWidth : collapsedDrawerWidth}px)` },
          bgcolor: '#f5f5f5',
          minHeight: '100vh',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* This empty toolbar creates space at the top */}
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout;
