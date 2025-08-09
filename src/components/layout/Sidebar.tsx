import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Receipt, 
  CreditCard, 
  Wallet, 
  BarChart3, 
  Plane, 
  Package, 
  Store, 
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  MessageSquare,
  Hotel,
  Stamp,
  Shield,
  FileBarChart2,
  Briefcase,
  PlusCircle,
  Layers,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { getModulesByCategory, getModuleById } from '../../config/modules';
import clsx from 'clsx';
import Logo from '../ui/Logo';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { user, currentAgence } = useAuth();
  const { getAccessibleModules, canAccessModule, getModulesForRole } = usePermissions();
  const location = useLocation();
  const accessibleModules = getAccessibleModules();

  // Mapping des icônes pour les modules
  const iconMapping: Record<string, React.ElementType> = {
    dashboard: LayoutDashboard,
    profile: User,
    clients: Users,
    crm: MessageSquare,
    fournisseurs: Building2,
    billets: Plane,
    hotel: Hotel,
    visa: Stamp,
    assurance: Shield,
    manifest: FileSpreadsheet,
    'autre-prestation': PlusCircle,
    reservations: Calendar,
    packages: Package,
    vitrine: Store,
    'pre-factures': FileText,
    factures: Receipt,
    creances: CreditCard,
    caisse: Wallet,
    situation: BarChart3,
    documents: FileBarChart2,
    todos: Briefcase,
    calendrier: Calendar,
    agents: UserCheck,
    parametres: Settings,
    agences: Building2,
    tickets: MessageSquare,
    audit: Shield,
    logs: Layers,
    rapports: FileBarChart2
  };

  // Générer les sections de la sidebar dynamiquement basées sur la configuration
  const generateSidebarSections = (): SidebarSection[] => {
    const sections: SidebarSection[] = [];
    
    // Section Principal
    sections.push({
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard' }
      ]
    });

    // Section Paramétrage
    const parametrageItems: SidebarItem[] = [
      { id: 'profile', label: 'Profil', icon: User, path: '/profile' }
    ];
    
    if (user?.role === 'agence') {
      parametrageItems.push({ id: 'agents', label: 'Agents', icon: UserCheck, path: '/agents' });
    }
    
    if (parametrageItems.length > 1) {
      sections.push({
        title: 'Paramétrage',
        items: parametrageItems
      });
    }

    // Section Suivi client
    const clientModules = getModulesByCategory('client').filter(module => 
      accessibleModules.includes(module.id)
    );
    if (clientModules.length > 0) {
      sections.push({
        title: 'Suivi client',
        items: clientModules.map(module => ({
          id: module.id,
          label: module.name,
          icon: iconMapping[module.id] || Users,
          path: `/${module.id}`
        }))
      });
    }

    // Section Suivi fournisseur
    const fournisseurModules = getModulesByCategory('fournisseur').filter(module => 
      accessibleModules.includes(module.id)
    );
    if (fournisseurModules.length > 0) {
      sections.push({
        title: 'Suivi fournisseur',
        items: fournisseurModules.map(module => ({
          id: module.id,
          label: module.name,
          icon: iconMapping[module.id] || Building2,
          path: `/${module.id}`
        }))
      });
    }

    // Section Prestations & services
    const prestationModules = getModulesByCategory('prestations').filter(module => 
      accessibleModules.includes(module.id) && module.id !== 'reservations'
    );
    if (prestationModules.length > 0) {
      sections.push({
        title: 'Prestations & services',
        items: prestationModules.map(module => ({
          id: module.id,
          label: module.name,
          icon: iconMapping[module.id] || PlusCircle,
          path: `/${module.id}`
        }))
      });
    }

    // Section Voyage organisé
    const voyageModules = getModulesByCategory('voyage').filter(module => 
      accessibleModules.includes(module.id)
    );
    // Ajouter le module 'reservations' ici, renommé
    const suiviVentePackageModule = getModuleById('reservations');
    const voyageItems = [
      ...voyageModules.map(module => ({
        id: module.id,
        label: module.name,
        icon: iconMapping[module.id] || Package,
        path: `/${module.id}`
      }))
    ];
    if (accessibleModules.includes('reservations') && suiviVentePackageModule) {
      voyageItems.push({
        id: 'reservations',
        label: 'Suivi Vente Package',
        icon: iconMapping['reservations'] || Package,
        path: '/reservations'
      });
    }
    if (voyageItems.length > 0) {
      sections.push({
        title: 'Voyage organisé',
        items: voyageItems
      });
    }

    // Section Gestion comptabilité & finance
    const comptabiliteModules = getModulesByCategory('comptabilite').filter(module => 
      accessibleModules.includes(module.id)
    );
    if (comptabiliteModules.length > 0) {
      sections.push({
        title: 'Gestion comptabilité & finance',
        items: comptabiliteModules.map(module => ({
          id: module.id,
          label: module.name,
          icon: iconMapping[module.id] || Receipt,
          path: `/${module.id}`
        }))
      });
    }

    // Section Analyse & situation
    const analyseModules = getModulesByCategory('analyse').filter(module => 
      accessibleModules.includes(module.id)
    );
    if (analyseModules.length > 0) {
      sections.push({
        title: 'Analyse & situation',
        items: analyseModules.map(module => ({
          id: module.id,
          label: module.name,
          icon: iconMapping[module.id] || BarChart3,
          path: `/${module.id}`
        }))
      });
    }

    // Section Système
    const systemeModules = getModulesByCategory('systeme').filter(module => 
      accessibleModules.includes(module.id)
    );
    if (systemeModules.length > 0) {
      sections.push({
        title: 'Système',
        items: systemeModules.map(module => ({
          id: module.id,
          label: module.name,
          icon: iconMapping[module.id] || Settings,
          path: `/${module.id}`
        }))
      });
    }

    // Section Administration (superadmin uniquement)
    if (user?.role === 'superadmin') {
      // On affiche TOUS les modules d'administration pour le superadmin
      const adminModules = getModulesByCategory('administration');
      if (adminModules.length > 0) {
        sections.push({
          title: 'Administration',
          items: adminModules.map(module => ({
            id: module.id,
            label: module.name,
            icon: iconMapping[module.id] || Settings,
            path: `/${module.id}`
          }))
        });
      }
    }

    // Ajouter le lien "Demande de modules" pour les agences
    if (user?.role === 'agence') {
      const lastSection = sections[sections.length - 1];
      if (lastSection && lastSection.title === 'Système') {
        lastSection.items.push({
          id: 'module-requests',
          label: 'Demande de modules',
          icon: PlusCircle,
          path: '/parametres/modules'
        });
      }
    }

    return sections;
  };

  const sidebarSections = generateSidebarSections();

  // Filtrer les sections et items selon les permissions
  const filteredSections = sidebarSections.map(section => {
    // Pour le superadmin, on ne filtre pas la section Administration
    if (user?.role === 'superadmin' && section.title === 'Administration') {
      return section;
    }
    const filteredItems = section.items.filter(item => {
      // Vérifier les rôles spécifiques
      if (item.roles && !item.roles.includes(user?.role || '')) {
        return false;
      }
      
      // Vérifier si le module est accessible
      if (!['dashboard', 'profile', 'parametres', 'module-requests'].includes(item.id)) {
        return canAccessModule(item.id);
      }
      
      return true;
    });
    
    return {
      ...section,
      items: filteredItems
    };
  }).filter(section => section.items.length > 0);

  return (
    <div className={clsx(
      'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm h-full',
      isCollapsed ? 'w-20' : 'w-72'
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <Logo size="md" />
        )}
        {isCollapsed && (
          <div className="w-8 h-8 mx-auto bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {filteredSections.map((section, sectionIndex) => (
          <div key={`section-${sectionIndex}`} className="space-y-1">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.path || 
                               (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
               
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={clsx(
                    'flex items-center px-3 py-2 rounded-lg transition-colors',
                    isActive 
                      ? 'bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] text-white shadow-md' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={clsx(
                    'w-5 h-5 min-w-5',
                    isActive ? 'text-white' : 'text-[#A259F7] group-hover:text-[#2ED8FF] transition-colors'
                  )} />
                  {!isCollapsed && (
                    <span className="ml-3 text-sm">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;