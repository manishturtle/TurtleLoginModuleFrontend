/**
 * Service for making API calls related to tenant administration
 */
import api from '../utils/api';

/**
 * Helper function to get the authentication token
 * @returns {string|null} The authentication token or null if not available
 */
const getAuthToken = () => {
  try {
    const tokenData = localStorage.getItem('token');
    if (!tokenData) {
      console.log('No token found in localStorage');
      return null;
    }
    
    console.log('Token data from localStorage:', tokenData);
    
    // Check if token is a JSON string (JWT format)
    try {
      const parsedToken = JSON.parse(tokenData);
      console.log('Parsed token:', parsedToken);
      
      // If it's a JWT token with access property
      if (parsedToken && parsedToken.access) {
        console.log('Using access token from JWT format');
        
        // Debug the JWT token claims
        try {
          const tokenParts = parsedToken.access.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('JWT token payload:', payload);
            console.log('is_tenant_admin claim:', payload.is_tenant_admin);
            console.log('is_staff claim:', payload.is_staff);
            console.log('tenant_slug claim:', payload.tenant_slug);
          }
        } catch (e) {
          console.error('Error decoding JWT token:', e);
        }
        
        return parsedToken.access;
      }
      // If it's some other JSON format, return as is
      console.log('Using parsed token (not access token format)');
      return parsedToken;
    } catch (e) {
      // If it's not JSON, it might be a direct token string
      console.log('Token is not in JSON format, using as-is');
      return tokenData;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Helper function to get the current user info
 * @returns {Object|null} The current user info or null if not available
 */
const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.log('No user data found in localStorage');
      return null;
    }
    
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Fetch tenant statistics
 * @returns {Promise<Object>} Tenant statistics data
 */
export const fetchTenantStats = async () => {
  try {
    const response = await api.get('/tenant-admin/stats/', {
      headers: {
        'X-Tenant-Name': 'default',
        'X-Tenant-Admin': 'true'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tenant stats:', error);
    throw error;
  }
};

/**
 * Fetch all tenant users with optional pagination
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.page_size - Number of items per page
 * @returns {Promise<Object>} Paginated list of users
 */
export const fetchTenantUsers = async (options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.page_size) params.append('page_size', options.page_size);
    
    const response = await api.get(`/tenant-admin/users/?${params.toString()}`, {
      headers: {
        'X-Tenant-Name': 'default',
        'X-Tenant-Admin': 'true'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tenant users:', error);
    throw error;
  }
};

/**
 * Create a new tenant user using the current authenticated session
 * @param {Object} userData - User data to create
 * @param {string} userData.email - User email
 * @param {string} userData.first_name - User first name
 * @param {string} userData.last_name - User last name
 * @param {string} userData.role_id - Role ID to assign to the user
 * @param {string} tenant - The tenant slug
 * @returns {Promise<Object>} Created user data
 */
export const createTenantUser = async (userData, tenant) => {
  try {
    // Get the current authentication token
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    
    console.log('Creating tenant user with current authentication token');
    console.log('Token type:', typeof token);
    
    // Get current user info for debugging
    const currentUser = getCurrentUser();
    console.log('Current user:', currentUser);
    
    // Make the API request with the current token
    const response = await fetch(`http://localhost:8000/api/${tenant}/tenant-admin/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Name': tenant,
        'X-Tenant-Admin': 'true'
      },
      body: JSON.stringify(userData)
    });
    
    console.log(`User creation API response status: ${response.status}`);
    
    if (!response.ok) {
      let errorData = {};
      try {
        // Clone the response before reading it
        const responseClone = response.clone();
        errorData = await responseClone.json();
        console.error('User creation API error response:', errorData);
        
        // Throw an error with the response data attached
        const error = new Error(errorData.detail || `API error: ${response.status}`);
        error.response = { data: errorData };
        throw error;
      } catch (e) {
        // If we can't parse as JSON, try to get the text
        try {
          const errorText = await response.text();
          console.error('User creation API error response (text):', errorText);
          const error = new Error(errorText || `API error: ${response.status}`);
          error.response = { data: { detail: errorText } };
          throw error;
        } catch (textError) {
          // If we can't even get the text, just use the status
          console.error('Could not read error response:', textError);
          const error = new Error(`API error: ${response.status}`);
          error.response = { data: { detail: `API error: ${response.status}` } };
          throw error;
        }
      }
    }
    
    const data = await response.json();
    console.log('User created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createTenantUser:', error);
    throw error;
  }
};

/**
 * Update an existing tenant user
 * @param {number} userId - ID of the user to update
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user data
 */
export const updateTenantUser = async (userId, userData) => {
  try {
    const response = await api.put(`/tenant-admin/users/${userId}/`, userData, {
      headers: {
        'X-Tenant-Name': 'default',
        'X-Tenant-Admin': 'true'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating tenant user:', error);
    throw error;
  }
};

/**
 * Delete a tenant user
 * @param {number} userId - ID of the user to delete
 * @returns {Promise<void>}
 */
export const deleteTenantUser = async (userId) => {
  try {
    await api.delete(`/tenant-admin/users/${userId}/`, {
      headers: {
        'X-Tenant-Name': 'default',
        'X-Tenant-Admin': 'true'
      }
    });
  } catch (error) {
    console.error('Error deleting tenant user:', error);
    throw error;
  }
};

/**
 * Fetch tenant settings
 * @returns {Promise<Object>} Tenant settings data
 */
export const fetchTenantSettings = async () => {
  try {
    const response = await api.get('/tenant-admin/settings/', {
      headers: {
        'X-Tenant-Name': 'default',
        'X-Tenant-Admin': 'true'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    throw error;
  }
};

/**
 * Update tenant settings
 * @param {Object} settingsData - Updated settings data
 * @returns {Promise<Object>} Updated settings data
 */
export const updateTenantSettings = async (settingsData) => {
  try {
    const response = await api.put('/tenant-admin/settings/', settingsData, {
      headers: {
        'X-Tenant-Name': 'default',
        'X-Tenant-Admin': 'true'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating tenant settings:', error);
    throw error;
  }
};

/**
 * Invite a user to the tenant
 * @param {Object} inviteData - Invitation data including email, role, etc.
 * @returns {Promise<Object>} Invitation data
 */
export const inviteUser = async (inviteData) => {
  try {
    const response = await api.post('/tenant-admin/invitations/', inviteData, {
      headers: {
        'X-Tenant-Name': 'default',
        'X-Tenant-Admin': 'true'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error inviting user:', error);
    throw error;
  }
};

/**
 * Fetch tenant invitations
 * @param {Object} params - Query parameters for pagination and filtering
 * @returns {Promise<Object>} Paginated list of invitations
 */
export const fetchInvitations = async (params = {}) => {
  try {
    const response = await api.get('/tenant-admin/invitations/', { params, headers: {
      'X-Tenant-Name': 'default',
      'X-Tenant-Admin': 'true'
    }});
    return response.data;
  } catch (error) {
    console.error('Error fetching invitations:', error);
    throw error;
  }
};

/**
 * Cancel an invitation
 * @param {number} invitationId - ID of the invitation to cancel
 * @returns {Promise<void>}
 */
export const cancelInvitation = async (invitationId) => {
  try {
    await api.delete(`/tenant-admin/invitations/${invitationId}/`, {
      headers: {
        'X-Tenant-Name': 'default',
        'X-Tenant-Admin': 'true'
      }
    });
  } catch (error) {
    console.error('Error canceling invitation:', error);
    throw error;
  }
};

/**
 * Fetch tenant reports
 * @param {Object} params - Query parameters for report type and date range
 * @returns {Promise<Object>} Report data
 */
export const fetchTenantReports = async (params = {}) => {
  try {
    const response = await api.get('/tenant-admin/reports/', { params, headers: {
      'X-Tenant-Name': 'default',
      'X-Tenant-Admin': 'true'
    }});
    return response.data;
  } catch (error) {
    console.error('Error fetching tenant reports:', error);
    throw error;
  }
};

/**
 * Fetch tenant roles
 * @param {string} tenant - The tenant slug
 * @returns {Promise<Array>} List of tenant roles
 */
export const fetchTenantRoles = async (tenant) => {
  if (!tenant) {
    console.error('Tenant slug is required for fetching tenant roles');
    throw new Error('Tenant slug is required');
  }

  try {
    // Get the auth token
    const token = getAuthToken();
    if (!token) {
      console.error('No auth token found');
      throw new Error('Authentication required');
    }

    console.log(`Fetching roles for tenant: ${tenant}`);
    
    // Try the roles endpoint directly
    try {
      const response = await fetch(`http://localhost:8000/api/${tenant}/tenant-admin/roles/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Name': tenant,
          'X-Tenant-Admin': 'true'
        }
      });
      
      console.log(`Roles endpoint response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Roles fetched successfully from roles endpoint:', data);
        return Array.isArray(data) ? data : (data.results && Array.isArray(data.results) ? data.results : []);
      }
      
      // If that fails, try the debug-roles endpoint (for development)
      console.log('Falling back to debug-roles endpoint');
    } catch (error) {
      console.log('Error with roles endpoint, falling back:', error);
    }
    
    // Try the debug-roles endpoint as a fallback
    try {
      const debugResponse = await fetch(`http://localhost:8000/api/${tenant}/tenant-admin/debug-roles/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Tenant-Name': tenant
        }
      });
      
      console.log(`Debug roles endpoint response status: ${debugResponse.status}`);
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('Roles fetched successfully from debug endpoint:', debugData);
        return Array.isArray(debugData) ? debugData : [];
      }
    } catch (debugError) {
      console.log('Error with debug-roles endpoint:', debugError);
    }
    
    // If all else fails, try the tenant-admin-roles endpoint
    const response = await fetch(`http://localhost:8000/api/${tenant}/tenant-admin/tenant-admin-roles/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Name': tenant,
        'X-Tenant-Admin': 'true'
      }
    });
    
    console.log(`Tenant admin roles endpoint response status: ${response.status}`);
    
    if (!response.ok) {
      let errorData = {};
      try {
        // Clone the response before reading it
        const responseClone = response.clone();
        errorData = await responseClone.json();
        console.error('Tenant admin roles API error response:', errorData);
      } catch (e) {
        // If we can't parse as JSON, try to get the text
        try {
          const errorText = await response.text();
          console.error('Tenant admin roles API error response (text):', errorText);
          errorData = { detail: errorText || `API error: ${response.status}` };
        } catch (textError) {
          // If we can't even get the text, just use the status
          console.error('Could not read error response:', textError);
          errorData = { detail: `API error: ${response.status}` };
        }
      }
      
      // Try to get a new token if the current one is invalid or expired
      if (response.status === 401 || response.status === 403) {
        console.log('Authentication error. Attempting to refresh token...');
        try {
          // Try to refresh the token from localStorage
          const storedToken = localStorage.getItem('token');
          if (storedToken) {
            const tokenData = JSON.parse(storedToken);
            if (tokenData && tokenData.refresh) {
              console.log('Found refresh token. Attempting to refresh...');
              // Implement token refresh logic here if needed
            }
          }
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
        }
      }
      
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }

    // Parse the response data
    const data = await response.json();
    console.log('Roles fetched successfully:', data);
    
    // Handle different response formats (direct array or paginated results)
    let roles = [];
    if (Array.isArray(data)) {
      roles = data;
    } else if (data.results && Array.isArray(data.results)) {
      roles = data.results;
    }
    
    return roles;
  } catch (error) {
    console.error('Error fetching tenant roles:', error);
    throw error;
  }
};

/**
 * Get a specific tenant user
 * @param {number} userId - ID of the user to fetch
 * @returns {Promise<Object>} User data
 */
export const getTenantUser = async (userId) => {
  try {
    const response = await api.get(`/tenant-admin/users/${userId}/`, {
      headers: {
        'X-Tenant-Name': 'default',
        'X-Tenant-Admin': 'true'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tenant user:', error);
    throw error;
  }
};

/**
 * Login as tenant admin
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} tenant - Tenant slug
 * @returns {Promise<Object>} Login response with token and user data
 */
export const loginAsTenantAdmin = async (email, password, tenant) => {
  try {
    console.log(`Attempting to login as tenant admin: ${email} in tenant: ${tenant}`);
    
    // Make the login request
    const response = await fetch(`http://localhost:8000/api/${tenant}/tenant-admin/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Tenant-Name': tenant,
        'X-Tenant-Admin': 'true'
      },
      body: JSON.stringify({ email, password })
    });
    
    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        const errorText = await response.text();
        console.error('Login error response (text):', errorText);
        errorData = { detail: errorText || `Login failed: ${response.status}` };
      }
      
      console.error('Login error response:', errorData);
      throw new Error(errorData.detail || `Login failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Login successful:', data);
    
    // Store the token and user data
    if (data.token) {
      if (typeof data.token === 'object' && data.token.access) {
        localStorage.setItem('token', JSON.stringify(data.token));
      } else {
        localStorage.setItem('token', data.token);
      }
    }
    
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Create a new tenant user with direct login first
 * @param {Object} userData - User data to create
 * @param {string} userData.email - User email
 * @param {string} userData.first_name - User first name
 * @param {string} userData.last_name - User last name
 * @param {string} userData.role_id - Role ID to assign to the user
 * @param {string} tenant - The tenant slug
 * @param {string} adminEmail - Admin email for login
 * @param {string} adminPassword - Admin password for login
 * @returns {Promise<Object>} Created user data
 */
export const createTenantUserWithLogin = async (userData, tenant, adminEmail, adminPassword) => {
  try {
    // First login as tenant admin to get a fresh token
    const loginResponse = await loginAsTenantAdmin(adminEmail, adminPassword, tenant);
    console.log('Login successful, proceeding to create user');
    
    // Then create the user with the fresh token
    const token = getAuthToken();
    console.log('Using token from login:', token);
    
    // Make the API request with the fresh token
    const response = await fetch(`http://localhost:8000/api/${tenant}/tenant-admin/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Name': tenant,
        'X-Tenant-Admin': 'true'
      },
      body: JSON.stringify(userData)
    });
    
    console.log(`User creation API response status: ${response.status}`);
    
    if (!response.ok) {
      let errorData = {};
      try {
        // Clone the response before reading it
        const responseClone = response.clone();
        errorData = await responseClone.json();
        console.error('User creation API error response:', errorData);
      } catch (e) {
        // If we can't parse as JSON, try to get the text
        try {
          const errorText = await response.text();
          console.error('User creation API error response (text):', errorText);
          errorData = { detail: errorText || `API error: ${response.status}` };
        } catch (textError) {
          // If we can't even get the text, just use the status
          console.error('Could not read error response:', textError);
          errorData = { detail: `API error: ${response.status}` };
        }
      }
      
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('User created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createTenantUserWithLogin:', error);
    throw error;
  }
};
