import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

interface ModuleProtectedRouteProps {
  moduleId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ModuleProtectedRoute: React.FC<ModuleProtectedRouteProps> = ({ 
  moduleId, 
  children, 
  fallback = null 
}) => {
  const { canAccessModule, userRole, getAccessibleModules } = usePermissions();
  const { currentAgence } = useAuth();

  // Modules de base toujours accessibles
  const baseModules = ['dashboard', 'profile', 'module-requests'];
  if (baseModules.includes(moduleId)) {
    return <>{children}</>;
  }

  // Si l'utilisateur n'est pas encore chargé, afficher un loader
  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Si superadmin, accès total
  if (userRole === 'superadmin') {
    return <>{children}</>;
  }

  // Si agence, accès seulement si module actif
  if (userRole === 'agence') {
    if (!currentAgence?.modulesActifs?.includes(moduleId)) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // Si agent, accès seulement si module actif ET permission
  if (userRole === 'agent') {
    if (!currentAgence?.modulesActifs?.includes(moduleId)) {
      return <Navigate to="/dashboard" replace />;
    }
    if (!canAccessModule(moduleId)) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default ModuleProtectedRoute; 