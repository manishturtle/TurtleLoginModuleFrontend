import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Box,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip
} from '@mui/material';
import { useRouter } from 'next/router';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminLayout from '../../../components/admin/AdminLayout';
import withAdminAuth from '../../../components/auth/withAdminAuth';
import { getToken } from '../../../services/authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Function to fetch users
const fetchUsers = async () => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  try {
    console.log('Fetching users...');
    const response = await fetch(`${API_BASE_URL}/platform-admin/api/users/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Users API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response data:', errorData);
      throw new Error(errorData.detail || `Error fetching users: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Users response received:', responseData);
    
    // Properly extract users data from the response
    // The backend returns { status, count, data } format
    const users = responseData.data || responseData;
    console.log('Extracted users data:', users);
    
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

const UsersPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch users from the API
  useEffect(() => {
    const getUsers = async () => {
      try {
        setLoading(true);
        const data = await fetchUsers();
        setUsers(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        // Check if it's a 404 error (endpoint not found)
        if (err.message && err.message.includes('404')) {
          setError('The users API endpoint is not available. This feature may not be fully implemented yet.');
        } else {
          setError(err.message || 'Failed to fetch users');
        }
      } finally {
        setLoading(false);
      }
    };
    
    getUsers();
  }, [refreshTrigger]); // Add refreshTrigger as a dependency to reload users when it changes

  // Handle create user button click
  const handleCreateUser = () => {
    router.push({
      pathname: '/platform-admin/users/create',
      query: { refresh: true } // Pass a flag to indicate we should refresh the list after creation
    });
  };

  // Check if we need to refresh the user list (when returning from create page)
  useEffect(() => {
    if (router.query.refresh === 'true') {
      // Remove the refresh query parameter to avoid infinite refreshes
      const { refresh, ...restQuery } = router.query;
      router.replace({
        pathname: router.pathname,
        query: restQuery
      }, undefined, { shallow: true });
      
      // Trigger a refresh of the user list
      setRefreshTrigger(prev => prev + 1);
    }
  }, [router.query]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get user role label
  const getUserRoleLabel = (user) => {
    if (user?.is_superuser) {
      return { label: 'Admin', color: 'error' };
    } else if (user?.is_staff) {
      return { label: 'Staff', color: 'warning' };
    } else if (user?.profile?.is_tenant_admin) {
      return { label: 'Tenant Admin', color: 'info' };
    } else {
      return { label: 'User', color: 'default' };
    }
  };

  return (
    <AdminLayout title="Users Management">
      <Box sx={{ p: 3 }}>
        {/* Header with action button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Users
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<PersonAddIcon />}
            onClick={handleCreateUser}
          >
            Create User
          </Button>
        </Box>

        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error state */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Empty state */}
        {!loading && !error && (!users || users.length === 0) && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No users found
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Create your first user to get started.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleCreateUser}
            >
              Create User
            </Button>
          </Paper>
        )}

        {/* Users table */}
        {!loading && !error && users && users.length > 0 && (
          <>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="users table">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Date Joined</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => {
                      const role = getUserRoleLabel(user);
                      
                      return (
                        <TableRow key={user?.id || 'unknown'}>
                          <TableCell>{user?.email || user?.username || 'N/A'}</TableCell>
                          <TableCell>{`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={role.label} 
                              color={role.color} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</TableCell>
                          <TableCell>{user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell align="right">
                            <Button 
                              size="small" 
                              color="primary"
                              onClick={() => router.push(`/platform-admin/users/edit/${user?.id}`)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={users?.length || 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}

        {/* Placeholder message for API endpoint not implemented */}
        {!loading && !error && (
          <Alert severity="info" sx={{ mt: 3 }}>
            Note: The users API endpoint may not be fully implemented in the backend yet. 
            This is a placeholder UI that will work once the API is available.
          </Alert>
        )}
      </Box>
    </AdminLayout>
  );
};

export default withAdminAuth(UsersPage);
