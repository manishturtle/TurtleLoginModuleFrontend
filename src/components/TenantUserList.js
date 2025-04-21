import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Button,
  Typography,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { fetchTenantUsers } from '../services/tenantAdminApiService';
import AddTenantUserForm from './AddTenantUserForm';

const TenantUserList = () => {
  const router = useRouter();
  const { tenant } = router.query;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openAddUserModal, setOpenAddUserModal] = useState(false);

  useEffect(() => {
    if (tenant) {
      loadUsers();
    }
  }, [tenant, page, rowsPerPage]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetchTenantUsers({
        page: page + 1, // API uses 1-based indexing
        page_size: rowsPerPage
      });
      
      setUsers(response.results || []);
      setTotalCount(response.count || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching tenant users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAddUserModal = () => {
    setOpenAddUserModal(true);
  };

  const handleCloseAddUserModal = () => {
    setOpenAddUserModal(false);
  };

  const handleUserCreated = () => {
    loadUsers();
    handleCloseAddUserModal();
  };

  // Format date to a human-readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!tenant) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Please select a tenant to manage users.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Tenant Users
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenAddUserModal}
        >
          Add User
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="tenant users table">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{`${user.first_name || ''} ${user.last_name || ''}`}</TableCell>
                      <TableCell>
                        {user.roles && user.roles.map((role) => (
                          <Chip 
                            key={role.id} 
                            label={role.name} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.is_active ? 'Active' : 'Inactive'} 
                          color={user.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.date_joined)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      <AddTenantUserForm 
        open={openAddUserModal} 
        onClose={handleCloseAddUserModal} 
        onUserCreated={handleUserCreated}
      />
    </Box>
  );
};

export default TenantUserList;
