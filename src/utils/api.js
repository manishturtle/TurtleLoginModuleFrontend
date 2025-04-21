import axios from 'axios';

// Create an Axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false,  // Changed to false to avoid CORS preflight issues
});

// Add a request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    // Get tenant from URL if available
    let tenant = null;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const pathParts = path.split('/').filter(Boolean);
      if (pathParts.length > 0 && pathParts[0] !== 'platform-admin') {
        tenant = pathParts[0];
      }
    }

    // Don't add auth token for authentication endpoints
    const isAuthEndpoint = config.url?.includes('/auth/login/') || 
                          config.url?.includes('/auth/check-user/') || 
                          config.url?.includes('/auth/check-email/') ||
                          config.url?.includes('/api/') ||
                          config.url?.includes('/auth/tenant-admin/auth/');
    
    if (!isAuthEndpoint) {
      // Get the auth token - handle both string and JSON object formats
      let token = null;
      try {
        const tokenData = localStorage.getItem('token');
        if (tokenData) {
          try {
            // Try to parse as JSON (JWT format)
            const parsedToken = JSON.parse(tokenData);
            if (parsedToken && parsedToken.access) {
              token = parsedToken.access;
            }
          } catch (e) {
            // Not JSON, use as is
            token = tokenData;
          }
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Add tenant context headers if tenant is available
    if (tenant) {
      config.headers['X-Tenant-Name'] = tenant;
      config.headers['X-Tenant-Admin'] = 'true';
    }
    
    // Add tenant to URL if it's a tenant-specific request
    // IMPORTANT: Only add tenant if it's not already in the URL and not a platform-admin request
    if (tenant && 
        config.url && 
        !config.url?.includes('/platform-admin/') && 
        !isAuthEndpoint && 
        !config.url?.startsWith(`/${tenant}/`)) {  // Check if URL already starts with tenant
      
      // Modify URL to include tenant
      if (config.url?.startsWith('/')) {
        config.url = `/${tenant}${config.url}`;
      } else {
        config.url = `/${tenant}/${config.url}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Get tenant from URL if available
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(Boolean);
        if (pathParts.length > 0 && pathParts[0] !== 'login') {
          // Redirect to tenant-specific login
          window.location.href = `/${pathParts[0]}/login`;
        } else {
          // Redirect to main login
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 */
export const checkEmailExists = async (email) => {
  try {
    const response = await api.post('/api/auth/check-email/', {
      email
    });
    return response.data.exists;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if a user exists in the system
 * @param {string} email - Email to check
 * @param {string} tenantName - Optional tenant name for tenant context
 * @returns {Promise<Object>} Response data
 */
export const checkUserExists = async (email, tenantName = null) => {
  let url;
  let headers = {};
  
  // Determine the URL based on context
  if (tenantName) {
    // Check if we're in tenant admin context (from URL or localStorage)
    const isTenantAdmin = window.location.pathname.includes('/tenant-admin/');
    
    if (isTenantAdmin) {
      // Tenant admin path with tenant in URL
      // Format: /api/{tenant_slug}/tenant-admin/auth/check-user/
      url = `/api/${tenantName}/tenant-admin/auth/check-user/`;
      
      // Add tenant-specific headers
      headers = {
        'X-Tenant-Admin': 'true',
        'X-Tenant-Name': tenantName,
        'Content-Type': 'application/json'
      };
      
      console.log(`Using tenant admin URL for tenant ${tenantName}:`, url);
    } else {
      // Regular tenant user path
      // Format: /api/{tenant_slug}/tenant/auth/check-user/
      url = `/api/${tenantName}/tenant/auth/check-user/`;
      
      // Add tenant-specific headers
      headers = {
        'X-Tenant-Name': tenantName,
        'Content-Type': 'application/json'
      };
      
      console.log(`Using tenant user URL for tenant ${tenantName}:`, url);
    }
  } else {
    // Platform admin path - using the correct URL structure
    url = '/platform-admin/api/auth/check-user/';
    
    // Add platform admin header
    headers = {
      'Content-Type': 'application/json',
      'X-Platform-Admin': 'true'
    };
    
    console.log('Using platform admin URL:', url);
  }
  
  try {
    console.log('Making API request to:', url);
    console.log('With headers:', headers);
    console.log('And payload:', { email });
    
    // Make the request with proper headers
    const response = await api.post(url, { email }, { 
      headers
    });
    
    console.log('API response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in checkUserExists:', error);
    
    // For tenant admin, try an alternative URL pattern if the first one fails
    if (tenantName && error.response && error.response.status === 404) {
      console.log('First URL pattern failed, trying alternative URL pattern...');
      
      try {
        // Try alternative URL pattern: /{tenant_slug}/api/tenant-admin/auth/check-user/
        const alternativeUrl = `/${tenantName}/api/tenant-admin/auth/check-user/`;
        console.log('Trying alternative URL:', alternativeUrl);
        
        const alternativeResponse = await api.post(alternativeUrl, { email }, { headers });
        console.log('Alternative URL response:', alternativeResponse.data);
        return alternativeResponse.data;
      } catch (altError) {
        console.error('Alternative URL also failed:', altError);
      }
    }
    
    // Return a default response to prevent UI errors
    return {
      exists: false,
      is_staff: false,
      message: 'Error checking user existence. Please try again.'
    };
  }
};

/**
 * Register a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Registration response
 */
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/api/auth/register/', {
      ...userData
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify OTP
 * @param {string} email - User email
 * @param {string} otp - OTP code
 * @returns {Promise<Object>} Verification response
 */
export const verifyOtp = async (email, otp) => {
  try {
    const response = await api.post('/api/auth/verify-otp/', {
      email,
      otp
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Resend OTP
 * @param {string} email - User email
 * @returns {Promise<Object>} Response
 */
export const resendOtp = async (email) => {
  try {
    const response = await api.post('/api/auth/resend-otp/', {
      email
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Login user
 * @param {string|Object} emailOrCredentials - User email or credentials object {email, password}
 * @param {string} passwordOrTenant - User password or tenant name if first param is credentials object
 * @param {string} tenantName - Optional tenant name for tenant-specific login
 * @returns {Promise<Object>} Login response with token and user data
 */
export const loginUser = async (emailOrCredentials, passwordOrTenant, tenantName) => {
  try {
    let email, password, tenant;
    
    // Handle different parameter formats
    if (typeof emailOrCredentials === 'object' && emailOrCredentials !== null) {
      // Case: loginUser({email, password}, tenant)
      email = emailOrCredentials.email;
      password = emailOrCredentials.password;
      tenant = passwordOrTenant;
    } else {
      // Case: loginUser(email, password, tenant)
      email = emailOrCredentials;
      password = passwordOrTenant;
      tenant = tenantName;
    }
    
    // Debug logging
    console.log(`Login attempt for ${email} in tenant: ${tenant}`);
    
    let url;
    const headers = {};
    
    if (tenant) {
      // Check if we're in tenant admin context (from URL or localStorage)
      const isTenantAdmin = window.location.pathname.includes('/tenant-admin/');
      
      if (isTenantAdmin) {
        // Tenant admin path
        url = `/api/${tenant}/tenant-admin/auth/login/`;
        headers['X-Tenant-Name'] = tenant;
        headers['X-Tenant-Admin'] = 'true';
        console.log('Using tenant admin login endpoint');
      } else {
        // Regular tenant user path
        url = `/api/${tenant}/tenant/auth/login/`;
        headers['X-Tenant-Name'] = tenant;
        console.log('Using tenant user login endpoint');
      }
    } else {
      // Updated to match the new URL structure
      url = '/platform-admin/api/auth/login/';
    }
    
    console.log('Login request to URL:', url);
    console.log('With headers:', headers);
    
    const response = await api.post(url, {
      email,
      password
    }, { headers });
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Login a tenant admin
 * @param {string} email - Email
 * @param {string} password - Password
 * @param {string} tenantName - Tenant name/slug
 * @returns {Promise<Object>} Login response
 */
export const loginTenantAdmin = async (email, password, tenantName) => {
  try {
    // Validate tenant name
    if (!tenantName || tenantName === '[tenant]') {
      throw new Error('Invalid tenant name. Please provide a valid tenant.');
    }

    console.log(`Attempting tenant admin login for ${email} in tenant ${tenantName}`);
    
    // Construct the URL with the tenant name in the path
    const url = `/api/${tenantName}/tenant-admin/auth/login/`;
    
    // Add tenant-specific headers
    const headers = {
      'X-Tenant-Admin': 'true',
      'X-Tenant-Name': tenantName
    };
    
    console.log('Making API request to:', url);
    console.log('With headers:', headers);
    
    const response = await api.post(url, {
      email,
      password
    }, { headers });
    
    return response.data;
  } catch (error) {
    console.error('Error in loginTenantAdmin:', error);
    
    // Handle different error scenarios
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      
      // Create a structured error object
      const errorMessage = error.response.data?.detail || 
                          error.response.data?.message || 
                          'An error occurred during login. Please try again.';
      
      // Return a structured error response instead of throwing
      return {
        error: true,
        status: error.response.status,
        message: errorMessage
      };
    }
    
    // For network errors or other issues
    return {
      error: true,
      message: error.message || 'Network error. Please check your connection.'
    };
  }
};

/**
 * Login platform admin
 * @param {Object} credentials - Login credentials (email, password)
 * @returns {Promise<Object>} Login response with token and user data
 */
export const loginPlatformAdmin = async (credentials) => {
  try {
    const { email, password } = credentials;
    
    const url = '/platform-admin/api/auth/login/';
    const headers = {
      'X-Platform-Admin': 'true',
      'Content-Type': 'application/json'
    };
    
    console.log('Making platform admin login request to:', url);
    console.log('With headers:', headers);
    
    const response = await api.post(url, {
      email,
      password
    }, { headers });
    
    return response.data;
  } catch (error) {
    console.error('Login platform admin error:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      throw new Error(error.response.data?.detail || error.response.data?.message || 'Login failed');
    }
    throw error;
  }
};

/**
 * Start 2FA setup
 * @param {string} userId - User ID
 * @returns {Promise<Object>} 2FA setup data
 */
export const startTwoFactorSetup = async (userId) => {
  try {
    const response = await api.post('/api/auth/2fa/setup/start/', {
      user_id: userId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Confirm 2FA setup
 * @param {string} userId - User ID
 * @param {string} token - Token from authenticator app
 * @param {string} tempToken - Temporary token from setup
 * @returns {Promise<Object>} Confirmation response
 */
export const confirmTwoFactorSetup = async (userId, token, tempToken) => {
  try {
    const response = await api.post('/api/auth/2fa/setup/confirm/', {
      user_id: userId,
      token,
      temp_token: tempToken
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify 2FA token
 * @param {string} userId - User ID
 * @param {string} token - Token from authenticator app
 * @returns {Promise<Object>} Verification response with token and user data
 */
export const verifyTwoFactorLogin = async (userId, token) => {
  try {
    const response = await api.post('/platform-admin/api/auth/2fa/auth/', {
      user_id: userId,
      token
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify tenant admin 2FA token
 * @param {string} userId - User ID
 * @param {string} token - Token from authenticator app
 * @param {string} tenantName - Tenant name/slug
 * @returns {Promise<Object>} Verification response with token and user data
 */
export const verifyTenantAdminTwoFactor = async (userId, token, tenantName) => {
  try {
    // Validate tenant name
    if (!tenantName || tenantName === '[tenant]') {
      throw new Error('Invalid tenant name. Please provide a valid tenant.');
    }

    console.log(`Verifying 2FA for tenant admin in tenant ${tenantName}`);
    
    // Construct the URL with the tenant name in the path
    const url = `/api/${tenantName}/tenant-admin/auth/2fa/auth/`;
    
    // Add tenant-specific headers
    const headers = {
      'X-Tenant-Admin': 'true',
      'X-Tenant-Name': tenantName,
      'Authorization': `Bearer ${token}`
    };
    
    console.log('Making API request to:', url);
    console.log('With headers:', headers);
    
    const response = await api.post(url, { userId }, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Request a password reset for a tenant admin
 * @param {string} email - Email of the tenant admin
 * @param {string} tenantName - Tenant name/slug
 * @returns {Promise<Object>} Password reset request response
 */
export const requestTenantAdminPasswordReset = async (email, tenantName) => {
  try {
    // Validate tenant name
    if (!tenantName || tenantName === '[tenant]') {
      throw new Error('Invalid tenant name. Please provide a valid tenant.');
    }

    console.log(`Requesting password reset for ${email} in tenant ${tenantName}`);
    
    // Construct the URL with the tenant name in the path
    // The correct URL format based on the backend middleware and URL patterns is:
    // /api/{tenant_slug}/tenant-admin/auth/request-password-reset/
    const url = `/api/${tenantName}/tenant-admin/auth/request-password-reset/`;
    
    // Add tenant-specific headers
    const headers = {
      'X-Tenant-Admin': 'true',
      'X-Tenant-Name': tenantName
    };
    
    console.log('Making API request to:', url);
    console.log('With headers:', headers);
    
    // Use direct axios call with absolute URL to avoid any baseURL issues
    const response = await axios.post(`http://localhost:8000${url}`, { email }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error in requestTenantAdminPasswordReset:', error);
    
    // Handle different error scenarios
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      
      // Create a structured error object
      const errorMessage = error.response.data?.detail || 
                          error.response.data?.message || 
                          'An error occurred. Please try again.';
      
      throw new Error(errorMessage);
    }
    
    // For network errors or other issues
    throw error;
  }
};

/**
 * Verify recovery code
 * @param {string} userId - User ID
 * @param {string} recoveryCode - Recovery code
 * @returns {Promise<Object>} Verification response with token and user data
 */
export const verifyRecoveryCode = async (userId, recoveryCode) => {
  try {
    const response = await api.post('/api/auth/2fa/recovery-auth/', {
      user_id: userId,
      recovery_code: recoveryCode
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify and complete signup
 * @param {string} email - User email
 * @param {string} verificationCode - Email verification code
 * @param {string} backupSecret - Backup secret for 2FA
 * @returns {Promise<Object>} Verification response
 */
export const verifyAndCompleteSignup = async (email, verificationCode, backupSecret) => {
  try {
    const response = await api.post('/api/auth/verify-and-complete-signup/', {
      email,
      verification_code: verificationCode,
      backup_secret: backupSecret
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get dashboard data for tenant admin
 * @param {string} tenantName - Tenant name/slug
 * @returns {Promise<Object>} Dashboard data
 */
export const getTenantAdminDashboard = async (tenantName) => {
  try {
    // Ensure tenant name is valid
    const actualTenant = tenantName === '[tenant]' ? 'qa' : tenantName;
    
    // Construct URL following the pattern expected by the middleware
    const url = `/api/${actualTenant}/tenant-admin/dashboard/`;
    
    console.log('Constructed URL for getTenantAdminDashboard:', url);
    const headers = {
      'X-Tenant-Admin': 'true',
      'X-Tenant-Name': actualTenant
    };
    
    // Get token from localStorage - check for JWT format first
    const tokenData = localStorage.getItem('token');
    let token;
    
    try {
      // Try to parse the token as JSON (JWT format)
      const parsedToken = JSON.parse(tokenData);
      if (parsedToken && parsedToken.access) {
        console.log('Using JWT token for tenant admin');
        token = parsedToken.access;
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      // If parsing fails, it's a regular token
      if (tokenData) {
        console.log('Using regular token authentication');
        token = tokenData;
        headers['Authorization'] = `Token ${token}`;
      } else {
        console.log('No authentication token found!');
      }
    }
    
    console.log('Making API request to:', url);
    console.log('With headers:', JSON.stringify(headers, null, 2));
    const response = await api.get(url, { headers });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching tenant admin dashboard:', error);
    
    if (error.response) {
      // Return the error message from the server if available
      if (error.response.data && error.response.data.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      } else if (error.response.status === 403) {
        throw new Error(`You do not have permission to access the dashboard for "${tenantName}".`);
      } else if (error.response.status === 404) {
        throw new Error(`Dashboard data not found for tenant "${tenantName}".`);
      }
    }
    
    throw error;
  }
};

/**
 * Verify OTP for tenant admin password reset
 * @param {string} email - Email of the tenant admin
 * @param {string} otp - OTP code to verify
 * @param {string} tenantName - Tenant name/slug
 * @returns {Promise<Object>} OTP verification response
 */
export const verifyTenantAdminOTP = async (email, otp, tenantName) => {
  try {
    // Validate tenant name
    if (!tenantName || tenantName === '[tenant]') {
      throw new Error('Invalid tenant name. Please provide a valid tenant.');
    }

    console.log(`Verifying OTP for ${email} in tenant ${tenantName}`);
    
    // Construct the URL with the tenant name in the path
    const url = `/api/${tenantName}/tenant-admin/auth/verify-otp/`;
    
    // Add tenant-specific headers
    const headers = {
      'X-Tenant-Admin': 'true',
      'X-Tenant-Name': tenantName
    };
    
    console.log('Making API request to:', url);
    console.log('With headers:', headers);
    
    const response = await api.post(url, { email, otp }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error in verifyTenantAdminOTP:', error);
    
    // Handle different error scenarios
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      
      // Create a structured error object
      const errorMessage = error.response.data?.detail || 
                          error.response.data?.message || 
                          'Invalid or expired OTP. Please try again.';
      
      throw new Error(errorMessage);
    }
    
    // For network errors or other issues
    throw error;
  }
};

/**
 * Reset password for tenant admin after OTP verification
 * @param {string} email - Email of the tenant admin
 * @param {string} otp - Verified OTP code
 * @param {string} newPassword - New password to set
 * @param {string} tenantName - Tenant name/slug
 * @returns {Promise<Object>} Password reset response
 */
export const resetTenantAdminPassword = async (email, otp, newPassword, tenantName) => {
  try {
    // Validate tenant name
    if (!tenantName || tenantName === '[tenant]') {
      throw new Error('Invalid tenant name. Please provide a valid tenant.');
    }

    console.log(`Resetting password for ${email} in tenant ${tenantName}`);
    
    // Construct the URL with the tenant name in the path
    const url = `/api/${tenantName}/tenant-admin/auth/reset-password/`;
    
    // Add tenant-specific headers
    const headers = {
      'X-Tenant-Admin': 'true',
      'X-Tenant-Name': tenantName
    };
    
    console.log('Making API request to:', url);
    console.log('With headers:', headers);
    
    const response = await api.post(url, { 
      email, 
      otp, 
      new_password: newPassword 
    }, { headers });
    
    return response.data;
  } catch (error) {
    console.error('Error in resetTenantAdminPassword:', error);
    
    // Handle different error scenarios
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      
      // Create a structured error object
      const errorMessage = error.response.data?.detail || 
                          error.response.data?.message || 
                          'Failed to reset password. Please try again.';
      
      throw new Error(errorMessage);
    }
    
    // For network errors or other issues
    throw error;
  }
};

// Export all functions individually
export {
  checkEmailExists as checkEmailAvailability,
  api
};

// Export default api instance
export default api;
