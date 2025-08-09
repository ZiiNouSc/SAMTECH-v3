// Configuration centralisée de tous les modules du système
export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  category: 'principal' | 'client' | 'fournisseur' | 'prestations' | 'voyage' | 'comptabilite' | 'analyse' | 'administration' | 'systeme';
  essential: boolean;
  roles: string[];
  icon?: string;
  path?: string;
  permissions: string[];
}

// Modules de base toujours accessibles
export const BASE_MODULES: string[] = ['dashboard', 'profile'];

// Modules spécifiques au superadmin
export const SUPERADMIN_MODULES: string[] = ['agences', 'tickets', 'audit', 'logs', 'rapports'];

// Configuration complète de tous les modules
export const ALL_MODULES_CONFIG: ModuleConfig[] = [
  // Modules principaux
  {
    id: 'dashboard',
    name: 'Tableau de bord',
    description: 'Vue d\'ensemble de l\'activité',
    category: 'principal',
    essential: true,
    roles: ['superadmin', 'agence', 'agent'],
    permissions: ['lire']
  },
  {
    id: 'profile',
    name: 'Profil',
    description: 'Gestion du profil utilisateur',
    category: 'principal',
    essential: true,
    roles: ['superadmin', 'agence', 'agent'],
    permissions: ['lire', 'modifier']
  },

  // Modules clients
  {
    id: 'clients',
    name: 'Clients',
    description: 'Gestion des clients et prospects',
    category: 'client',
    essential: true,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Gestion des contacts et suivi commercial',
    category: 'client',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },

  // Modules fournisseurs
  {
    id: 'fournisseurs',
    name: 'Fournisseurs',
    description: 'Gestion des partenaires et prestataires',
    category: 'fournisseur',
    essential: true,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },

  // Modules prestations & services
  {
    id: 'billets',
    name: 'Billets d\'avion',
    description: 'Gestion des réservations aériennes',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'hotel',
    name: 'Réservation d\'hôtel',
    description: 'Gestion des réservations hôtelières',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'visa',
    name: 'Visa',
    description: 'Gestion des demandes de visas',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'assurance',
    name: 'Assurance',
    description: 'Gestion des polices d\'assurance',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'manifest',
    name: 'Manifest',
    description: 'Gestion des manifests',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'autre-prestation',
    name: 'Autres prestations',
    description: 'Gestion des services personnalisés',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'reservations',
    name: 'Réservations',
    description: 'Gestion des réservations',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },

  // Modules voyage organisé
  {
    id: 'packages',
    name: 'Packages',
    description: 'Création de packages voyage',
    category: 'voyage',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'vitrine',
    name: 'Vitrine',
    description: 'Site web public de l\'agence',
    category: 'voyage',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier']
  },

  // Modules comptabilité & finance
  {
    id: 'factures',
    name: 'Factures',
    description: 'Gestion des factures clients',
    category: 'comptabilite',
    essential: true,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'pre-factures',
    name: 'Devis',
    description: 'Gestion des devis et devis',
    category: 'comptabilite',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'caisse',
    name: 'Caisse',
    description: 'Gestion de caisse et trésorerie',
    category: 'comptabilite',
    essential: true,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'creances',
    name: 'Réglement & Créance',
    description: 'Suivi des impayés et relances',
    category: 'comptabilite',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },

  // Modules analyse & situation
  {
    id: 'situation',
    name: 'Situation',
    description: 'Tableaux de bord et statistiques',
    category: 'analyse',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'exporter']
  },

  // Modules système
  {
    id: 'todos',
    name: 'Tâches',
    description: 'Gestion des tâches et planning',
    category: 'systeme',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'calendrier',
    name: 'Calendrier',
    description: 'Gestion du calendrier et rendez-vous',
    category: 'systeme',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },

  // Modules administration (superadmin uniquement)
  {
    id: 'agences',
    name: 'Agences',
    description: 'Gestion des agences partenaires',
    category: 'administration',
    essential: false,
    roles: ['superadmin'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'agents',
    name: 'Agents',
    description: 'Gestion des agents de l\'agence',
    category: 'administration',
    essential: false,
    roles: ['agence'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'tickets',
    name: 'Support',
    description: 'Gestion des tickets de support',
    category: 'administration',
    essential: false,
    roles: ['superadmin'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'audit',
    name: 'Audit & Sécurité',
    description: 'Audit des actions utilisateurs',
    category: 'administration',
    essential: false,
    roles: ['superadmin'],
    permissions: ['lire', 'exporter']
  },
  {
    id: 'logs',
    name: 'Logs',
    description: 'Consultation des logs système',
    category: 'administration',
    essential: false,
    roles: ['superadmin'],
    permissions: ['lire', 'exporter']
  },
  {
    id: 'rapports',
    name: 'Rapports',
    description: 'Rapports et analyses système',
    category: 'administration',
    essential: false,
    roles: ['superadmin'],
    permissions: ['lire', 'exporter']
  }
];

// Fonctions utilitaires
export const getModulesByRole = (role: string): ModuleConfig[] => {
  return ALL_MODULES_CONFIG.filter(module => module.roles.includes(role));
};

export const getModulesByCategory = (category: string): ModuleConfig[] => {
  return ALL_MODULES_CONFIG.filter(module => module.category === category);
};

export const getEssentialModules = (): ModuleConfig[] => {
  return ALL_MODULES_CONFIG.filter(module => module.essential);
};

export const getModuleById = (id: string): ModuleConfig | undefined => {
  return ALL_MODULES_CONFIG.find(module => module.id === id);
};

export const getAllModuleIds = (): string[] => {
  return ALL_MODULES_CONFIG.map(module => module.id);
};

export const getAgencyModules = (): ModuleConfig[] => {
  return ALL_MODULES_CONFIG.filter(module => 
    module.roles.includes('agence') && !SUPERADMIN_MODULES.includes(module.id)
  );
};

export const getSuperadminModules = (): ModuleConfig[] => {
  return ALL_MODULES_CONFIG.filter(module => module.roles.includes('superadmin'));
}; 