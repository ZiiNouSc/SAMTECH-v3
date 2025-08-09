// Configuration centralisée de tous les modules du système (Backend)
const ALL_MODULES_CONFIG = [
  // Modules principaux
  {
    id: 'dashboard',
    nom: 'Tableau de bord',
    description: 'Vue d\'ensemble de l\'activité',
    category: 'principal',
    essential: true,
    roles: ['superadmin', 'agence', 'agent'],
    permissions: ['lire']
  },
  {
    id: 'profile',
    nom: 'Profil',
    description: 'Gestion du profil utilisateur',
    category: 'principal',
    essential: true,
    roles: ['superadmin', 'agence', 'agent'],
    permissions: ['lire', 'modifier']
  },

  // Modules clients
  {
    id: 'clients',
    nom: 'Clients',
    description: 'Gestion des clients et prospects',
    category: 'client',
    essential: true,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'crm',
    nom: 'CRM',
    description: 'Gestion des contacts et suivi commercial',
    category: 'client',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },

  // Modules fournisseurs
  {
    id: 'fournisseurs',
    nom: 'Fournisseurs',
    description: 'Gestion des partenaires et prestataires',
    category: 'fournisseur',
    essential: true,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },

  // Modules prestations & services
  {
    id: 'billets',
    nom: 'Billets d\'avion',
    description: 'Gestion des réservations aériennes',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'hotel',
    nom: 'Réservation d\'hôtel',
    description: 'Gestion des réservations hôtelières',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'visa',
    nom: 'Visa',
    description: 'Gestion des demandes de visas',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'assurance',
    nom: 'Assurance',
    description: 'Gestion des polices d\'assurance',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'manifest',
    nom: 'Manifest',
    description: 'Gestion des manifests',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'autre-prestation',
    nom: 'Autres prestations',
    description: 'Gestion des services personnalisés',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'reservations',
    nom: 'Réservations',
    description: 'Gestion des réservations',
    category: 'prestations',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },

  // Modules voyage organisé
  {
    id: 'packages',
    nom: 'Packages',
    description: 'Création de packages voyage',
    category: 'voyage',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'vitrine',
    nom: 'Vitrine',
    description: 'Site web public de l\'agence',
    category: 'voyage',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier']
  },

  // Modules comptabilité & finance
  {
    id: 'factures',
    nom: 'Factures',
    description: 'Gestion des factures clients',
    category: 'comptabilite',
    essential: true,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'pre-factures',
    nom: 'Devis',
    description: 'Gestion des devis et devis',
    category: 'comptabilite',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'caisse',
    nom: 'Caisse',
    description: 'Gestion de caisse et trésorerie',
    category: 'comptabilite',
    essential: true,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'creances',
    nom: 'Créances',
    description: 'Suivi des impayés et relances',
    category: 'comptabilite',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },

  // Modules analyse & situation
  {
    id: 'situation',
    nom: 'Situation',
    description: 'Tableaux de bord et statistiques',
    category: 'analyse',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'exporter']
  },

  // Modules système
  {
    id: 'documents',
    nom: 'Documents',
    description: 'Gestion centralisée des documents',
    category: 'systeme',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'todos',
    nom: 'Tâches',
    description: 'Gestion des tâches et planning',
    category: 'systeme',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'calendrier',
    nom: 'Calendrier',
    description: 'Gestion du calendrier et rendez-vous',
    category: 'systeme',
    essential: false,
    roles: ['agence', 'agent'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'agents',
    nom: 'Agents',
    description: 'Gestion des agents de l\'agence',
    category: 'systeme',
    essential: false,
    roles: ['agence'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'parametres',
    nom: 'Paramètres',
    description: 'Configuration de l\'agence',
    category: 'systeme',
    essential: false,
    roles: ['agence'],
    permissions: ['lire', 'modifier']
  },

  // Modules administration (superadmin uniquement)
  {
    id: 'agences',
    nom: 'Agences',
    description: 'Gestion des agences partenaires',
    category: 'administration',
    essential: false,
    roles: ['superadmin'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'tickets',
    nom: 'Support',
    description: 'Gestion des tickets de support',
    category: 'administration',
    essential: false,
    roles: ['superadmin'],
    permissions: ['lire', 'creer', 'modifier', 'supprimer']
  },
  {
    id: 'audit',
    nom: 'Audit & Sécurité',
    description: 'Audit des actions utilisateurs',
    category: 'administration',
    essential: false,
    roles: ['superadmin'],
    permissions: ['lire', 'exporter']
  },
  {
    id: 'logs',
    nom: 'Logs',
    description: 'Consultation des logs système',
    category: 'administration',
    essential: false,
    roles: ['superadmin'],
    permissions: ['lire', 'exporter']
  },
  {
    id: 'rapports',
    nom: 'Rapports',
    description: 'Rapports et analyses système',
    category: 'administration',
    essential: false,
    roles: ['superadmin'],
    permissions: ['lire', 'exporter']
  }
];

// Modules de base toujours accessibles
const BASE_MODULES = ['dashboard', 'profile'];

// Modules spécifiques au superadmin
const SUPERADMIN_MODULES = ['agences', 'tickets', 'audit', 'logs', 'rapports'];

// Fonctions utilitaires
const getModulesByRole = (role) => {
  return ALL_MODULES_CONFIG.filter(module => module.roles.includes(role));
};

const getModulesByCategory = (category) => {
  return ALL_MODULES_CONFIG.filter(module => module.category === category);
};

const getEssentialModules = () => {
  return ALL_MODULES_CONFIG.filter(module => module.essential);
};

const getModuleById = (id) => {
  return ALL_MODULES_CONFIG.find(module => module.id === id);
};

const getAllModuleIds = () => {
  return ALL_MODULES_CONFIG.map(module => module.id);
};

const getAgencyModules = () => {
  return ALL_MODULES_CONFIG.filter(module => 
    module.roles.includes('agence') && !SUPERADMIN_MODULES.includes(module.id)
  );
};

const getSuperadminModules = () => {
  return ALL_MODULES_CONFIG.filter(module => module.roles.includes('superadmin'));
};

module.exports = {
  ALL_MODULES_CONFIG,
  BASE_MODULES,
  SUPERADMIN_MODULES,
  getModulesByRole,
  getModulesByCategory,
  getEssentialModules,
  getModuleById,
  getAllModuleIds,
  getAgencyModules,
  getSuperadminModules
}; 