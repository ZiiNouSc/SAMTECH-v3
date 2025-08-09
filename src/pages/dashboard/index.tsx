import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SuperadminDashboard from './SuperadminDashboard';
import AgenceDashboard from './AgenceDashboard';
import AgentDashboard from './AgentDashboard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Utilisateur non connecté</p>
      </div>
    );
  }

  switch (user.role) {
    case 'superadmin':
      return <SuperadminDashboard />;
    case 'agence':
      return <AgenceDashboard />;
    case 'agent':
      return <AgentDashboard />;
    default:
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Rôle utilisateur non reconnu</p>
        </div>
      );
  }
};

export default DashboardPage;