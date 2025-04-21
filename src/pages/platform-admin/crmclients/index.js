import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  CircularProgress, 
  Alert,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import CrmClientList from '../../../components/admin/CrmClientList';
import withAdminAuth from '../../../components/auth/withAdminAuth';
import { fetchCrmClients } from '../../../services/adminApiService';

const CrmClientsPage = () => {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch CRM clients from the API
  useEffect(() => {
    const getClients = async () => {
      try {
        setLoading(true);
        const data = await fetchCrmClients();
        setClients(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch CRM clients:', err);
        setError(err.message || 'Failed to fetch CRM clients');
      } finally {
        setLoading(false);
      }
    };
    
    getClients();
  }, []);

  // Handle create client button click
  const handleCreateClient = () => {
    router.push('/platform-admin/crmclients/create');
  };

  // Handle client updated
  const handleClientUpdated = (updatedClient) => {
    setClients(clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    ));
  };

  // Handle client deleted
  const handleClientDeleted = (deletedClientId) => {
    setClients(clients.filter(client => client.id !== deletedClientId));
  };

  return (
    <AdminLayout title="CRM Clients">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          CRM Clients
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your CRM clients and their associated tenants.
        </Typography>
      </Box>

      {/* CRM Client Management Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 0 }}>
            Client Management
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleCreateClient}
          >
            Create Client
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <CrmClientList 
          clients={clients} 
          loading={loading} 
          error={error}
          onClientUpdated={handleClientUpdated}
          onClientDeleted={handleClientDeleted}
        />
      </Paper>
    </AdminLayout>
  );
};

// Wrap the component with the admin authentication HOC
export default withAdminAuth(CrmClientsPage);
