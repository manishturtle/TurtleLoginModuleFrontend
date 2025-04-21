import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  useTheme, 
  Menu, 
  MenuItem, 
  Tooltip 
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  Business as BusinessIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

const drawerWidth = 240;

const TenantAdminLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useTheme().breakpoints.down('md');
  const router = useRouter();
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);

  // Get tenant info from localStorage and router query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTenantInfo = localStorage.getItem('tenant_info');
      if (storedTenantInfo) {
        try {
          setTenantInfo(JSON.parse(storedTenantInfo));
        } catch (e) {
          console.error('Error parsing tenant info:', e);
        }
      } else if (router.query.tenant) {
        // If tenant info is not in localStorage but is in the URL, create a basic tenant info object
        setTenantInfo({
          slug: router.query.tenant,
          name: router.query.tenant.charAt(0).toUpperCase() + router.query.tenant.slice(1),
          status: 'Active'
        });
      }
    }
  }, [router.query.tenant]);

  // Get tenant slug from tenantInfo or router query
  const tenant = tenantInfo?.slug || router.query.tenant;

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Get the tenant from localStorage or router query
    const tenantInfo = localStorage.getItem('tenant_info') ? 
      JSON.parse(localStorage.getItem('tenant_info')) : null;
    const tenant = tenantInfo?.slug || router.query.tenant;
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('is_tenant_admin');
    localStorage.removeItem('tenant_info');
    
    // Redirect to login page with tenant parameter
    if (tenant) {
      router.push({
        pathname: '/[tenant]/tenant-admin/login',
        query: { tenant }
      }, `/${tenant}/tenant-admin/login`);
    } else {
      // Fallback to tenant selection page if no tenant is found
      router.push('/tenant-admin/login');
    }
  };

  // Menu items for the sidebar
  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: tenant ? `/${tenant}/tenant-admin/dashboard` : '/tenant-admin/dashboard' 
    },
    { 
      text: 'Users', 
      icon: <PeopleIcon />, 
      path: tenant ? `/${tenant}/tenant-admin/users` : '/tenant-admin/users' 
    },
    { 
      text: 'Reports', 
      icon: <BarChartIcon />, 
      path: tenant ? `/${tenant}/tenant-admin/reports` : '/tenant-admin/reports' 
    },
    { 
      text: 'Settings', 
      icon: <SettingsIcon />, 
      path: tenant ? `/${tenant}/tenant-admin/settings` : '/tenant-admin/settings' 
    },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Head>
        <title>{tenantInfo ? `${tenantInfo.name} Admin` : 'Tenant Admin'}</title>
        <link rel="icon" href="/images/turtle-favicon.png" />
      </Head>
      
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Image
              src="/images/turtle-software-logo.png"
              alt="Turtle Software Logo"
              width={120}
              height={40}
              priority
            />
            <Typography variant="h6" noWrap component="div" sx={{ ml: 2 }}>
              {tenantInfo ? `${tenantInfo.name} Admin` : 'Tenant Admin'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifications">
              <IconButton color="inherit" size="large">
                <NotificationsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Account">
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Menu
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
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
        <MenuItem onClick={handleMenuClose}>My account</MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
            <BusinessIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" noWrap>
              Tenant Administration
            </Typography>
          </Box>
          {isMobile && (
            <IconButton onClick={handleDrawerToggle}>
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Toolbar>
        <Divider />
        
        {tenantInfo && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Image
              src="/images/turtle-software-logo.png"
              alt="Turtle Software Logo"
              width={60}
              height={20}
              priority
            />
            <Typography variant="subtitle1" noWrap>
              {tenantInfo.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {tenantInfo.status || 'Active'}
            </Typography>
          </Box>
        )}
        
        <Divider />
        <List>
          {menuItems.map((item) => (
            <Link 
              key={item.text}
              href={
                tenant ? 
                {
                  pathname: item.path.includes('[tenant]') ? item.path : `/[tenant]/tenant-admin/${item.text.toLowerCase()}`,
                  query: { tenant }
                } : 
                item.path
              } 
              as={item.path}
              passHref 
            >
              <ListItem 
                button 
                component="a"
                selected={router.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(30, 142, 62, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(30, 142, 62, 0.2)',
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            </Link>
          ))}
        </List>
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { sm: `${open ? drawerWidth : 0}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar /> {/* This is needed to push content below the app bar */}
        {children}
      </Box>
    </Box>
  );
};

export default TenantAdminLayout;
