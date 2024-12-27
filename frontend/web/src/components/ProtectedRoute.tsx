import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigationTitle } from '../contexts/NavigationTitleContext';
import { usePreviousState } from '../contexts/PreviousStateContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredRole?: string;
  requiredPermissions?: string[];
  isPublic?: boolean;
  title?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredRole,
  requiredPermissions = [],
  isPublic = false,
  title,
}) => {
  const { isAuthenticated, user, hasPermission, isLoading } = useAuth();
  const location = useLocation();
  const { setTitle } = useNavigationTitle();
  const { previousState } = usePreviousState();

  // Update document title if provided
  useEffect(() => {
    if (title) {
      setTitle(title);
    }
  }, [title, setTitle]);

  // Handle automatic redirect from startpage to home when authenticated
  if (isAuthenticated && location.pathname === '/') {
    return <Navigate to="/home" replace />;
  }

  // Allow public routes to pass through
  if (isPublic) {
    return <>{children}</>;
  }

  // Show nothing while checking authentication
  if (isLoading) {
    return null;
  }

  // Require authentication for non-public routes
  if (!isAuthenticated) {
    const redirectPath = previousState?.pathname || location.pathname;
    return <Navigate to="/login" state={{ from: redirectPath }} replace />;
  }

  // Check if user has required role/roles
  if (user) {
    if (requiredRole && user.role !== requiredRole) {
      return <Navigate to="/access-denied" replace />;
    }
    
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return <Navigate to="/access-denied" replace />;
    }

    // Check permissions if required
    if (requiredPermissions.length > 0 && 
        !requiredPermissions.every(perm => hasPermission(perm))) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
};
