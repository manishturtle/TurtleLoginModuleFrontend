import { useState, useEffect } from 'react';

/**
 * Hook to get the current tenant from the URL
 * @returns {Object} Object containing tenant slug
 */
export const useTenant = () => {
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const pathParts = path.split('/').filter(Boolean);
      
      // First part of the path is the tenant slug, unless it's platform-admin
      if (pathParts.length > 0 && pathParts[0] !== 'platform-admin') {
        setTenant(pathParts[0]);
      } else {
        setTenant(null);
      }
    }
  }, []);

  return { tenant };
};

export default useTenant;
