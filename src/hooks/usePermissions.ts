import { useAuth } from '../contexts/AuthContext';
import { BASE_MODULES, SUPERADMIN_MODULES } from '../config/modules';
import { useState, useEffect } from 'react';

export const usePermissions = () => {
  const { user, currentAgence } = useAuth();
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'agent') {
      // On considère que les permissions sont chargées si user.permissions existe (même vide)
      setPermissionsLoading(typeof user.permissions === 'undefined');
    } else {
      setPermissionsLoading(false);
    }
  }, [user]);

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    
    // Superadmin has all permissions
    if (user.role === 'superadmin') return true;
    
    // Agency admin has all permissions on active modules
    if (user.role === 'agence' && currentAgence) {
      return currentAgence.modulesActifs.includes(module);
    }
    
    // Agent: check specific permissions
    if (user.role === 'agent' && user.permissions) {
      const modulePermission = user.permissions.find(p => p.module === module);
      return modulePermission ? modulePermission.actions.includes(action) : false;
    }
    
    return false;
  };

  const getAccessibleModules = (): string[] => {
    if (!user) return [];
    
    if (user.role === 'superadmin') {
      return SUPERADMIN_MODULES;
    }
    
    if (user.role === 'agence') {
      // Si currentAgence n'est pas encore chargé, retourner les modules de base
      if (!currentAgence) {
        return BASE_MODULES;
      }
      
      // Return active modules plus always-accessible modules
      return [
        ...BASE_MODULES,
        ...(currentAgence.modulesActifs || [])
      ];
    }
    
    if (user.role === 'agent' && user.permissions) {
      // Pour les agents, ne retourner que les modules pour lesquels ils ont au moins la permission "lire"
      const accessibleModules = (user.permissions || [])
        .filter(permission => permission.actions.includes('lire'))
        .map(permission => permission.module);
      
      // Ajouter les modules de base toujours accessibles
      return [
        ...BASE_MODULES,
        ...accessibleModules
      ];
    }
    
    return [];
  };

  const canAccessModule = (moduleId: string): boolean => {
    if (!user) return false;
    // Modules accessibles à tous
    if (moduleId === 'dashboard' || moduleId === 'profile') return true;
    
    // Pour les agences, si currentAgence n'est pas chargé, autoriser les modules de base
    if (user.role === 'agence' && !currentAgence) {
      return BASE_MODULES.includes(moduleId);
    }
    
    // Check if module is in accessible modules
    const accessibleModules = getAccessibleModules();
    if (!currentAgence?.modulesActifs?.includes(moduleId)) return false;
    return accessibleModules.includes(moduleId);
  };

  const getModulePermissions = (moduleId: string): string[] => {
    if (!user) return [];
    
    // Superadmin has all permissions
    if (user.role === 'superadmin') {
      return SUPERADMIN_MODULES;
    }
    
    // Agency admin has all permissions on active modules
    if (user.role === 'agence' && currentAgence) {
      if (currentAgence.modulesActifs.includes(moduleId)) {
        return SUPERADMIN_MODULES; // Agency admin has all superadmin permissions
      }
    }
    
    // Agent: return specific permissions
    if (user.role === 'agent' && user.permissions) {
      const modulePermission = user.permissions.find(p => p.module === moduleId);
      return modulePermission ? modulePermission.actions : [];
    }
    
    return [];
  };

  const getModuleStatus = (moduleId: string): 'active' | 'pending' | 'inactive' => {
    if (!user) return 'inactive';
    
    // Always active modules
    if (moduleId === 'dashboard') return 'active';
    if (moduleId === 'profile') return 'active';
    if (moduleId === 'module-requests' && user.role === 'agence') return 'active';
    
    // Superadmin has all modules active
    if (user.role === 'superadmin') return 'active';
    
    // For agency admin
    if (user.role === 'agence' && currentAgence) {
      if (currentAgence.modulesActifs.includes(moduleId)) {
        return 'active';
      }
      if (currentAgence.modulesDemandes && currentAgence.modulesDemandes.includes(moduleId)) {
        return 'pending';
      }
      return 'inactive';
    }
    
    // For agents
    if (user.role === 'agent' && user.permissions) {
      return user.permissions.some(p => p.module === moduleId) ? 'active' : 'inactive';
    }
    
    return 'inactive';
  };

  // Nouvelle fonction pour obtenir tous les modules disponibles
  const getAllModules = (): string[] => {
    return SUPERADMIN_MODULES;
  };

  // Nouvelles fonctions utilisant la configuration centralisée
  const getModulesForRole = (role: string) => {
    if (role === 'superadmin') {
      return SUPERADMIN_MODULES;
    } else if (role === 'agence') {
      return BASE_MODULES;
    }
    return [];
  };

  return {
    canAccessModule,
    hasPermission,
    getAccessibleModules,
    getAllModules,
    getModulesForRole,
    userRole: user?.role || 'guest',
    currentAgence
  };
};