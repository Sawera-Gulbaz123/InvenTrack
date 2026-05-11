// src/components/ui/ProtectedRoute.jsx
// Wraps routes that require login
// If not logged in → redirect to /login
// If not admin on admin-only route → show access denied

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  // Still verifying token — show spinner
  if (loading) return <LoadingSpinner />;

  // Not logged in — redirect to login page
  if (!user) return <Navigate to="/login" replace />;

  // Admin-only page but user is a viewer
  if (adminOnly && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-xl shadow-sm p-10 text-center max-w-md">
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500">
            You need admin privileges to view this page.
          </p>
        </div>
      </div>
    );
  }

  // All good — render the page
  return children;
};

export default ProtectedRoute;