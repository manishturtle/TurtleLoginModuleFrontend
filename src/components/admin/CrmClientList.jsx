import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/router';
import { deleteCrmClient } from '../../services/adminApiService';

const CrmClientList = ({ clients, loading, error, onClientUpdated, onClientDeleted }) => {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Handle edit client
  const handleEditClient = (clientId) => {
    router.push(`/platform-admin/crmclients/edit/${clientId}`);
  };

  // Handle delete client dialog open
  const handleDeleteDialogOpen = (client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  // Handle delete client dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
    setDeleteError(null);
  };

  // Handle delete client confirmation
  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await deleteCrmClient(clientToDelete.client_id);
      
      // Notify parent component
      if (onClientDeleted) {
        onClientDeleted(clientToDelete.client_id);
      }
      
      handleDeleteDialogClose();
    } catch (err) {
      console.error('Failed to delete client:', err);
      setDeleteError(err.message || 'Failed to delete client');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <Typography variant="body1" color="textSecondary" sx={{ p: 2 }}>
        No CRM clients found. Click the "Create Client" button to add a new client.
      </Typography>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client ID</TableCell>
              <TableCell>Client Name</TableCell>
              <TableCell>Contact Email</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.client_id}>
                <TableCell>{client.client_id}</TableCell>
                <TableCell>{client.client_name}</TableCell>
                <TableCell>{client.contactperson_email}</TableCell>
                <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton 
                      onClick={() => handleEditClient(client.client_id)}
                      aria-label="edit"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      onClick={() => handleDeleteDialogOpen(client)}
                      aria-label="delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete CRM Client</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the client "{clientToDelete?.client_name}"? 
            This action cannot be undone.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteDialogClose} 
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={deleteLoading}
            autoFocus
          >
            {deleteLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CrmClientList;
