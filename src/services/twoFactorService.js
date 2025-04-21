/**
 * Service for handling Two-Factor Authentication API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Get authentication headers based on the available tokens
 * @param {string} tempToken - Optional temporary token
 * @returns {Object} Headers object with Authorization if available
 */
const getAuthHeaders = (tempToken) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // First try to use the provided temp token
  if (tempToken) {
    headers['Authorization'] = `Bearer ${tempToken}`;
    return headers;
  }
  
  // Then try to use the stored auth token
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Start the two-factor authentication setup process
 * @param {Object} options - Setup options
 * @param {string} options.userId - Optional user ID for unauthenticated setup
 * @param {string} options.tempToken - Optional temporary token for unauthenticated setup
 * @param {boolean} options.isForcedSetup - Whether this is a forced setup
 * @param {boolean} options.isSignupFlow - Whether this is coming from the signup flow
 * @returns {Promise<Object>} - The setup data including QR code and secret
 */
export const startTwoFactorSetup = async ({ userId = null, tempToken = null, isForcedSetup = false, isSignupFlow = false }) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    const data = {};
    
    // Add user ID if provided
    if (userId) {
      data.user_id = userId;
    }
    
    // Add flow information
    if (isForcedSetup) {
      data.is_forced_setup = true;
    }
    
    if (isSignupFlow) {
      data.is_signup_flow = true;
    }
    
    // Add temp token to headers if provided
    if (tempToken) {
      headers.Authorization = `Bearer ${tempToken}`;
    }
    
    console.log('Starting 2FA setup with:', { data, headers });
    
    const response = await fetch(`${API_BASE_URL}/auth/2fa/setup/start/`, {
      method: 'POST',
      headers: { ...headers, ...getAuthHeaders(tempToken) },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error('2FA Setup error:', errorData);
      throw new Error(errorData.error || errorData.message || errorData.detail || 'Failed to start 2FA setup');
    }
    
    const responseData = await response.json();
    return {
      qr_code: responseData.qr_code,
      secret: responseData.secret,
      uri: responseData.uri
    };
  } catch (error) {
    console.error('Error starting 2FA setup:', error);
    throw error;
  }
};

/**
 * Confirm the 2FA setup by verifying the TOTP code
 * @param {Object} options - Confirmation options
 * @param {string} options.verificationCode - The verification code from the authenticator app
 * @param {string} options.userId - Optional user ID for unauthenticated setup
 * @param {string} options.tempToken - Optional temporary token for unauthenticated setup
 * @param {boolean} options.isForcedSetup - Whether this is a forced setup
 * @param {boolean} options.isSignupFlow - Whether this is coming from the signup flow
 * @returns {Promise<Object>} The response data including recovery codes
 */
export const confirmTwoFactorSetup = async ({ verificationCode, userId = null, tempToken = null, isForcedSetup = false, isSignupFlow = false }) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    const data = { 
      verification_code: verificationCode,
      is_signup_flow: isSignupFlow 
    };
    
    // Add user ID if provided
    if (userId) {
      data.user_id = userId;
      data.is_temp_token = true;
    }
    
    // Add flow information
    if (isForcedSetup) {
      data.is_forced_setup = true;
    }
    
    // Add temp token to headers if provided
    if (tempToken) {
      headers.Authorization = `Bearer ${tempToken}`;
    }
    
    console.log('Confirming 2FA setup with:', { data, headers });
    
    const response = await fetch(`${API_BASE_URL}/auth/2fa/setup/confirm/`, {
      method: 'POST',
      headers: { ...headers, ...getAuthHeaders(tempToken) },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error('2FA Confirm error:', errorData);
      throw new Error(errorData.error || errorData.message || errorData.detail || 'Failed to confirm 2FA setup');
    }
    
    const responseData = await response.json();
    
    // If this is a forced setup or signup flow, the response might include auth tokens
    if ((isForcedSetup || isSignupFlow) && responseData.token) {
      localStorage.setItem('token', responseData.token.access);
      localStorage.setItem('refresh_token', responseData.token.refresh);
      
      // Store user data if available
      if (responseData.user) {
        localStorage.setItem('user', JSON.stringify(responseData.user));
      }
      
      // Dispatch an auth change event to update UI
      window.dispatchEvent(new Event('authChange'));
      
      // Clean up any temporary tokens
      localStorage.removeItem('temp_token');
      localStorage.removeItem('temp_user_id');
    }
    
    return responseData;
  } catch (error) {
    console.error('Error confirming 2FA setup:', error);
    throw error;
  }
};

/**
 * Verify a 2FA code during login
 * 
 * @param {string} userId - The user ID from the first step of login
 * @param {string} code - The 6-digit verification code from the authenticator app
 * @returns {Promise<Object>} The login response data
 */
export const verifyTwoFactorLogin = async (userId, code) => {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/auth/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify({ user_id: userId, code }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to verify 2FA code');
  }

  return response.json();
};

/**
 * Verify a recovery code during login
 * 
 * @param {string} userId - The user ID from the first step of login
 * @param {string} recoveryCode - The recovery code
 * @returns {Promise<Object>} The login response data
 */
export const verifyRecoveryCode = async (userId, recoveryCode) => {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/recovery-auth/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify({ user_id: userId, recovery_code: recoveryCode }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to verify recovery code');
  }

  return response.json();
};

/**
 * Verify a 2FA code during tenant admin login
 * 
 * @param {string} userId - The user ID from the first step of login
 * @param {string} code - The 6-digit verification code from the authenticator app
 * @param {string} tenantName - The tenant name for which to verify admin access
 * @returns {Promise<Object>} The login response data
 */
export const verifyTenantAdminTwoFactorLogin = async (userId, code, tenantName) => {
  const response = await fetch(`${API_BASE_URL}/auth/tenant-admin/auth/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify({ 
      user_id: userId, 
      code,
      tenant_name: tenantName 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || errorData.message || 'Failed to verify tenant admin 2FA code');
  }

  return response.json();
};

/**
 * Disable 2FA for the current user
 * 
 * @param {string} password - The user's current password for verification
 * @returns {Promise<Object>} The response data
 */
export const disableTwoFactor = async (password) => {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/disable/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to disable 2FA');
  }

  return response.json();
};

/**
 * Generate new recovery codes
 * 
 * @param {string} password - The user's current password for verification
 * @returns {Promise<Object>} The response data including new recovery codes
 */
export const generateNewRecoveryCodes = async (password) => {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/recovery-codes/generate/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate new recovery codes');
  }

  return response.json();
};

/**
 * Verify 2FA during signup and complete the registration process
 * @param {Object} options - Verification options
 * @param {string} options.email - The user's email
 * @param {string} options.userId - The user's ID
 * @param {string} options.verificationCode - The 6-digit verification code from the authenticator app
 * @param {string} options.backupSecret - Optional backup secret to use if the server-side verification fails
 * @returns {Promise<Object>} The response data including token and user information
 */
export const verifyAndCompleteSignup = async ({ email, userId, verificationCode, backupSecret }) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const data = {
      email,
      user_id: userId,
      verification_code: verificationCode
    };
    
    // Include backup secret if provided
    if (backupSecret) {
      data.backup_secret = backupSecret;
    }
    
    console.log('Verifying and completing signup with:', { email, userId, verificationCode, hasBackupSecret: !!backupSecret });
    
    const response = await fetch(`${API_BASE_URL}/auth/signup/verify-and-complete/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error('Signup verification error:', errorData);
      throw new Error(errorData.message || 'Failed to verify and complete signup');
    }
    
    const responseData = await response.json();
    
    // If successful, store the authentication tokens
    if (responseData.success && responseData.token) {
      localStorage.setItem('token', responseData.token.access);
      localStorage.setItem('refresh_token', responseData.token.refresh);
      
      // Store user data if available
      if (responseData.user) {
        localStorage.setItem('user', JSON.stringify(responseData.user));
      }
      
      // Dispatch an auth change event to update UI
      window.dispatchEvent(new Event('authChange'));
      
      // Clean up any temporary tokens
      localStorage.removeItem('temp_token');
      localStorage.removeItem('temp_user_id');
      localStorage.removeItem('signup_email');
      localStorage.removeItem('signup_2fa_secret');
    }
    
    return responseData;
  } catch (error) {
    console.error('Error verifying and completing signup:', error);
    throw error;
  }
};
