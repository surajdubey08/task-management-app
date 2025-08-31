import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * ProtectedRoute component that guards routes requiring authentication
 * Redirects to login page if user is not authenticated
 * Preserves the intended destination URL for post-login redirect
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  fallback = null,
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return fallback || <LoadingSpinner message="Verifying authentication..." />;
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // If a specific role is required, check user role
  if (requiredRole && user?.role !== requiredRole) {
    // You could redirect to an "Access Denied" page here
    // For now, we'll redirect to the dashboard
    return <Navigate to="/" replace />;
  }

  // User is authenticated (and has required role if specified)
  return children;
};

/**
 * Higher-order component that wraps a component with route protection
 */
export const withAuth = (Component, options = {}) => {
  const WrappedComponent = (props) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
  
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Component that shows different content based on authentication state
 */
export const AuthGuard = ({ 
  children, 
  fallback = null, 
  loader = null,
  requireAuth = true 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return loader || <LoadingSpinner message="Checking authentication..." />;
  }

  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  if (!requireAuth && isAuthenticated) {
    return fallback;
  }

  return children;
};

/**
 * Hook to check if user has specific role
 */
export const useRequireRole = (requiredRole) => {
  const { user, isAuthenticated } = useAuth();
  
  return {
    hasRole: isAuthenticated && user?.role === requiredRole,
    isAuthenticated,
    userRole: user?.role
  };
};

/**
 * Component that conditionally renders based on user role
 */
export const RoleGuard = ({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  requireAuth = true 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Checking permissions..." />;
  }

  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return fallback;
  }

  return children;
};

export default ProtectedRoute;