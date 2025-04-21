import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated, getCurrentUser } from '../../services/authService';

/**
 * Higher-order component that wraps protected admin routes
 * Redirects to login if user is not authenticated or not an admin
 */
const withAdminAuth = (WrappedComponent) => {
  const WithAdminAuthComponent = (props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      // Check if the user is authenticated
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Get the current user
      const user = getCurrentUser();
      
      // Check if the user is a platform admin (staff)
      if (user && user.is_staff) {
        setIsAuthorized(true);
      } else {
        // Redirect to dashboard if authenticated but not admin
        router.push('/dashboard');
      }
      
      setIsLoading(false);
    }, [router]);

    // Show nothing while checking authentication
    if (isLoading) {
      return null;
    }

    // Only render the component if user is authorized
    return isAuthorized ? <WrappedComponent {...props} /> : null;
  };

  return WithAdminAuthComponent;
};

export default withAdminAuth;
