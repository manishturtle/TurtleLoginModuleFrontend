import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const TenantContext = createContext(undefined);

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get tenant from router.query. This will be available *after* the
    // initial render, so we need the isLoading state.
    if (router.query.tenant) {
      setTenant(router.query.tenant);
      setIsLoading(false);
    } else if (router.isReady) {
      // If router is ready but no tenant is found in the query
      // Check if we can extract it from the pathname
      const pathParts = router.pathname.split('/');
      const tenantIndex = pathParts.findIndex(part => part === '[tenant]');
      
      if (tenantIndex !== -1 && router.asPath) {
        const asPathParts = router.asPath.split('/');
        if (asPathParts.length > tenantIndex) {
          const extractedTenant = asPathParts[tenantIndex];
          setTenant(extractedTenant);
        }
      }
      setIsLoading(false);
    }
  }, [router.query.tenant, router.isReady, router.pathname, router.asPath]);

  const value = {
    tenant,
    isLoading,
    // Other context values
  };

  return (
    <TenantContext.Provider value={value}>
      {isLoading ? <div>Loading Tenant...</div> : children}
    </TenantContext.Provider>
  );
}

export default TenantContext;
