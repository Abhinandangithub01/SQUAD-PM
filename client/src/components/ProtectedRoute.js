import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requireOrganization = true }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { hasOrganization, loading: orgLoading } = useOrganization();
  const location = useLocation();

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading while checking organization (only if required)
  if (requireOrganization && orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to organization setup if required but not present
  if (requireOrganization && !hasOrganization && !orgLoading) {
    // Don't redirect if already on setup page
    if (location.pathname !== '/organization/setup') {
      return <Navigate to="/organization/setup" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
