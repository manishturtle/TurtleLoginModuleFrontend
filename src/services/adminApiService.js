/**
 * Admin API service for platform admin dashboard
 * Handles API requests for tenant management and other admin functions
 */

import { getToken } from './authService';

// Base API URL from environment variables
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api$/, '');

/**
 * Fetch all tenants from the API
 * @returns {Promise<Array>} Array of tenant objects
 */
export const fetchTenants = async () => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  try {
    console.log('Fetching tenants with token:', token.substring(0, 5) + '...');
    const response = await fetch(`${API_BASE_URL}/platform-admin/api/tenants/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Platform-Admin': 'true'
      }
    });
    
    console.log('Tenant API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response data:', errorData);
      throw new Error(errorData.detail || `Error fetching tenants: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Tenant response received:', responseData);
    
    // Check if the response has a results property (DRF pagination)
    const tenants = responseData.results || responseData;
    console.log('Extracted tenant data:', tenants);
    
    return Array.isArray(tenants) ? tenants : [];
  } catch (error) {
    console.error('Error fetching tenants:', error);
    throw error;
  }
}

/**
 * Create a new tenant
 * @param {Object} tenantData - Tenant data to create
 * @returns {Promise<Object>} Created tenant object
 */
export const createTenant = async (tenantData) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  try {
    // Format date fields to YYYY-MM-DD
    const formattedData = { ...tenantData };
    
    // Format trial_end_date if it exists
    if (formattedData.trial_end_date) {
      const date = new Date(formattedData.trial_end_date);
      if (!isNaN(date.getTime())) {
        formattedData.trial_end_date = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
    }
    
    // Format paid_until if it exists
    if (formattedData.paid_until) {
      const date = new Date(formattedData.paid_until);
      if (!isNaN(date.getTime())) {
        formattedData.paid_until = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
    }
    
    console.log('Sending formatted tenant data:', formattedData);
    
    const response = await fetch(`${API_BASE_URL}/platform-admin/api/tenants/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Platform-Admin': 'true'
      },
      body: JSON.stringify(formattedData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response from server:', errorData);
      throw new Error(errorData.detail || `Error creating tenant: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw error;
  }
}

/**
 * Get tenant details by ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Tenant details
 */
export const getTenantDetails = async (tenantId) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/platform-admin/api/tenants/${tenantId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Platform-Admin': 'true'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error fetching tenant details: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    throw error;
  }
}

/**
 * Update tenant by ID
 * @param {string} tenantId - Tenant ID
 * @param {Object} tenantData - Updated tenant data
 * @returns {Promise<Object>} Updated tenant object
 */
export const updateTenant = async (tenantId, tenantData) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  try {
    // Format date fields to YYYY-MM-DD
    const formattedData = { ...tenantData };
    
    // Format trial_end_date if it exists
    if (formattedData.trial_end_date) {
      const date = new Date(formattedData.trial_end_date);
      if (!isNaN(date.getTime())) {
        formattedData.trial_end_date = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
    }
    
    // Format paid_until if it exists
    if (formattedData.paid_until) {
      const date = new Date(formattedData.paid_until);
      if (!isNaN(date.getTime())) {
        formattedData.paid_until = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
    }
    
    console.log('Sending formatted update data:', formattedData);
    
    const response = await fetch(`${API_BASE_URL}/platform-admin/api/tenants/${tenantId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Platform-Admin': 'true'
      },
      body: JSON.stringify(formattedData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response from server:', errorData);
      throw new Error(errorData.detail || `Error updating tenant: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating tenant:', error);
    throw error;
  }
}

/**
 * Delete tenant by ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<void>}
 */
export const deleteTenant = async (tenantId) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/platform-admin/api/tenants/${tenantId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Platform-Admin': 'true'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error deleting tenant: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting tenant:', error);
    throw error;
  }
}

/**
 * Fetch all CRM clients from the API
 * @returns {Promise<Array>} Array of CRM client objects
 */
export const fetchCrmClients = async () => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  try {
    console.log('Fetching CRM clients with token:', token.substring(0, 5) + '...');
    const response = await fetch(`${API_BASE_URL}/platform-admin/api/crmclients/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Platform-Admin': 'true'
      }
    });
    
    console.log('CRM Client API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response data:', errorData);
      throw new Error(errorData.detail || `Error fetching CRM clients: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('CRM Client response received:', responseData);
    
    // Check if the response has a results property (DRF pagination)
    const crmClients = responseData.results || responseData;
    console.log('Extracted CRM client data:', crmClients);
    
    return Array.isArray(crmClients) ? crmClients : [];
  } catch (error) {
    console.error('Error fetching CRM clients:', error);
    throw error;
  }
};

/**
 * Create a new CRM client
 * @param {Object} clientData - CRM client data to create
 * @returns {Promise<Object>} Created CRM client object
 */
export const createCrmClient = async (clientData) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  try {
    console.log('Sending CRM client data:', clientData);
    
    const response = await fetch(`${API_BASE_URL}/platform-admin/api/crmclients/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Platform-Admin': 'true'
      },
      body: JSON.stringify(clientData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response from server:', errorData);
      throw new Error(errorData.detail || `Error creating CRM client: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating CRM client:', error);
    throw error;
  }
};

/**
 * Get CRM client details by ID
 * @param {string} clientId - CRM client ID
 * @returns {Promise<Object>} CRM client details
 */
export const getCrmClientDetails = async (clientId) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/platform-admin/api/crmclients/${clientId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Platform-Admin': 'true'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error fetching CRM client details: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching CRM client details:', error);
    throw error;
  }
};

/**
 * Update CRM client by ID
 * @param {string} clientId - CRM client ID
 * @param {Object} clientData - Updated CRM client data
 * @returns {Promise<Object>} Updated CRM client object
 */
export const updateCrmClient = async (clientId, clientData) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/platform-admin/api/crmclients/${clientId}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Platform-Admin': 'true'
      },
      body: JSON.stringify(clientData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error updating CRM client: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating CRM client:', error);
    throw error;
  }
};

/**
 * Delete CRM client by ID
 * @param {string} clientId - CRM client ID
 * @returns {Promise<void>}
 */
export const deleteCrmClient = async (clientId) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/platform-admin/api/crmclients/${clientId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Platform-Admin': 'true'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error deleting CRM client: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting CRM client:', error);
    throw error;
  }
};
