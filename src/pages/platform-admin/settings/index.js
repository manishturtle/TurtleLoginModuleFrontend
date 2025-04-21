import React from 'react';
import { 
  Typography, 
  Paper, 
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AdminLayout from '../../../components/admin/AdminLayout';
import withAdminAuth from '../../../components/auth/withAdminAuth';

const SettingsPage = () => {
  return (
    <AdminLayout title="Platform Settings">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Platform Settings
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          This is a placeholder settings page. The actual settings functionality will be implemented in future updates.
        </Alert>

        <Grid container spacing={3}>
          {/* General Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="General Settings" />
              <Divider />
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Platform Name"
                    defaultValue="Turtle ERP"
                    margin="normal"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Admin Email"
                    defaultValue="admin@example.com"
                    margin="normal"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable New Registrations"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable Trial Accounts"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Security Settings" />
              <Divider />
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Require 2FA for Admins"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={<Switch />}
                    label="Require 2FA for All Users"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Session Timeout (minutes)"
                    type="number"
                    defaultValue="60"
                    margin="normal"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Maximum Failed Login Attempts"
                    type="number"
                    defaultValue="5"
                    margin="normal"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Email Settings */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Email Settings" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="SMTP Server"
                      defaultValue="smtp.example.com"
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="SMTP Port"
                      defaultValue="587"
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="SMTP Username"
                      defaultValue="notifications@example.com"
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="SMTP Password"
                      type="password"
                      defaultValue="password"
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Use TLS"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
            Save Settings
          </Button>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default withAdminAuth(SettingsPage);
