import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Menu,
  MenuItem,
  Avatar,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useRouter } from 'next/router';
import { useTenant } from '../../context/TenantContext';

const drawerWidth = 240;

const DashboardLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [user, setUser] = useState({ name: 'Admin User', email: 'admin@example.com' });
  const router = useRouter();
  const { tenant } = useTenant();

  // Get user data from localStorage using useEffect
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      console.log('Attempting to get user data from localStorage');
      try {
        // Check if localStorage is available
        if (localStorage) {
          console.log('localStorage is available');
          
          // First check if we have a token (authentication indicator)
          const token = localStorage.getItem('token');
          console.log('Token from localStorage:', token ? 'Found' : 'Not found');
          
          // Log all localStorage keys for debugging
          console.log('All localStorage keys:');
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`- ${key}: ${localStorage.getItem(key)}`);
          }
          
          if (!token) {
            console.log('No token found, user is not authenticated');
            // Redirect to login if no token is found
            if (tenant) {
              router.replace(`/${tenant}/tenant-admin/login`);
            }
            return;
          }
          
          // Try to get user data
          const userData = localStorage.getItem('user');
          console.log('User data from localStorage:', userData);
          
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              console.log('Successfully parsed user data:', parsedUser);
              
              // Ensure we have at least name and email
              if (!parsedUser.name || !parsedUser.email) {
                console.log('User data missing required fields, adding defaults');
                parsedUser.name = parsedUser.name || 'Admin User';
                parsedUser.email = parsedUser.email || 'admin@example.com';
              }
              
              // Add token and authentication status
              parsedUser.token = token;
              parsedUser.isAuthenticated = true;
              
              setUser(parsedUser);
            } catch (parseError) {
              console.error('Error parsing user data JSON:', parseError);
              
              // If JSON parsing fails, create a default user with the token
              setUser({
                name: 'Admin User',
                email: 'admin@example.com',
                token: token,
                isAuthenticated: true
              });
            }
          } else {
            console.log('No user data found in localStorage, creating default user with token');
            
            // Create a default user with the token
            setUser({
              name: 'Admin User',
              email: 'admin@example.com',
              token: token,
              isAuthenticated: true
            });
          }
        } else {
          console.log('localStorage is not available');
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        // Keep the default user data set in useState
      }
    } else {
      console.log('Running on server-side, skipping localStorage access');
    }
  }, [router, tenant]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page using the tenant from context
    // Using the router.push with pathname and query to properly handle dynamic routes
    router.push({
      pathname: '/[tenant]/tenant-admin/login',
      query: { tenant }
    });
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/[tenant]/tenant-admin' },
    { text: 'Users', icon: <PeopleIcon />, path: '/[tenant]/tenant-admin/users' },
    { text: 'Reports', icon: <BarChartIcon />, path: '/[tenant]/tenant-admin/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/[tenant]/tenant-admin/settings' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          {tenant ? tenant.toUpperCase() : 'Tenant'} Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                const path = item.path.replace('[tenant]', tenant);
                router.push(path);
              }}
              selected={router.pathname === item.path.replace('[tenant]', tenant)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'primary.main'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {tenant ? tenant.toUpperCase() : 'Tenant'} Dashboard
          </Typography>
          
          {/* User menu */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={user.name} src="/static/images/avatar/1.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={handleCloseUserMenu}>
                <Typography textAlign="center">{user.name}</Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseUserMenu}>
                <Typography textAlign="center">{user.email}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
