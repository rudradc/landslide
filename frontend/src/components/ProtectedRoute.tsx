import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, token, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide text-slate-400">Loading Disaster Risk DSS...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="glass-card max-w-md p-8 text-center">
          <h2 className="text-xl font-bold text-red-400">Access Restricted</h2>
          <p className="mt-2 text-sm text-slate-400">
            Your role (<span className="font-semibold text-white">{user.role_name}</span>) does not have authorization to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
