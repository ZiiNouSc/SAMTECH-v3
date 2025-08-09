import axios from 'axios';

// Configuration axios
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Ajout de l'interceptor pour toujours envoyer le token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('samtech_user') || '{}');
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API Auth
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  registerWizard: (data: any) => api.post('/auth/register-wizard', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  getUserAgences: () => api.get('/auth/agences'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/change-password', data),
};

// API Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  assignToAgency: (userId: string, agenceId: string) => 
    api.put(`/users/${userId}/assign-agency`, { agenceId }),
  removeFromAgency: (userId: string) => 
    api.put(`/users/${userId}/remove-agency`),
};

// API Agences
export const agencesAPI = {
  getAll: () => api.get('/agences'),
  getById: (id: string) => api.get(`/agences/${id}`),
  create: (data: any) => api.post('/agences', data),
  approve: (id: string) => api.put(`/agences/${id}/approve`),
  reject: (id: string) => api.put(`/agences/${id}/reject`),
  suspend: (id: string) => api.put(`/agences/${id}/suspend`),
  updateModules: (id: string, modules: string[]) => 
    api.put(`/agences/${id}/modules`, { modulesActifs: modules }),
  getUsers: (id: string) => api.get(`/agences/${id}/users`),
  approveUser: (agenceId: string, userId: string) => 
    api.put(`/agences/${agenceId}/users/${userId}/approve`),
  suspendUser: (agenceId: string, userId: string) => 
    api.put(`/agences/${agenceId}/users/${userId}/suspend`),
  getProfile: async () => {
    const response = await api.get('/agences/profile');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/agences/profile', data);
    return response.data;
  },
  getUserAgences: async () => {
    const response = await api.get('/auth/agences');
    return response.data;
  },
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/profile/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// API Clients
export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getById: (id: string) => api.get(`/clients/${id}`),
  getHistory: (id: string) => api.get(`/clients/${id}/history`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  exportExcel: () => api.get('/clients/export/excel', { responseType: 'blob' }),
};

// API CRM - Contacts
export const crmAPI = {
  getAll: () => api.get('/crm/contacts'),
  getById: (id: string) => api.get(`/crm/contacts/${id}`),
  create: (data: any) => api.post('/crm/contacts', data),
  update: (id: string, data: any) => api.put(`/crm/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/crm/contacts/${id}`),
  updateScore: (id: string, score: number | null) => api.put(`/crm/contacts/${id}/score`, { score }),
  getStats: () => api.get('/crm/stats'),
  addInteraction: (contactId: string, data: any) => api.post(`/crm/contacts/${contactId}/interactions`, data),
  updateInteraction: (contactId: string, interactionId: string, data: any) => 
    api.put(`/crm/contacts/${contactId}/interactions/${interactionId}`, data),
  deleteInteraction: (contactId: string, interactionId: string) => 
    api.delete(`/crm/contacts/${contactId}/interactions/${interactionId}`),
};

// API Réservations d'hôtel
export const hotelAPI = {
  getAll: () => api.get('/hotel'),
  getNonFactures: () => api.get('/hotel/non-factures'),
  getById: (id: string) => api.get(`/hotel/${id}`),
  create: (data: any) => api.post('/hotel', data),
  update: (id: string, data: any) => api.put(`/hotel/${id}`, data),
  delete: (id: string) => api.delete(`/hotel/${id}`),
  getStats: () => api.get('/hotel/stats'),
  iaAnalyseHotel: (data: { texte: string }) => api.post('/hotel/ia-analyse-hotel', data),
  extractPdfText: async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/hotel/extract-pdf-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  importPdf: async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/hotel/import-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// API Visas
export const visaAPI = {
  getAll: () => api.get('/visa'),
  getNonFactures: () => api.get('/visa/non-factures'),
  getById: (id: string) => api.get(`/visa/${id}`),
  create: (data: any) => api.post('/visa', data),
  update: (id: string, data: any) => api.put(`/visa/${id}`, data),
  delete: (id: string) => api.delete(`/visa/${id}`),
  getStats: () => api.get('/visa/stats'),
  iaAnalyseVisa: (data: { texte: string }) => api.post('/visa/ia-analyse-visa', data),
  extractPdfText: async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/visa/extract-pdf-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  importPdf: async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/visa/import-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// API Fournisseurs
export const fournisseursAPI = {
  getAll: () => api.get('/fournisseurs'),
  getById: (id: string) => api.get(`/fournisseurs/${id}`),
  create: (data: any) => api.post('/fournisseurs', data),
  update: (id: string, data: any) => api.put(`/fournisseurs/${id}`, data),
  delete: (id: string) => api.delete(`/fournisseurs/${id}`),
  exportExcel: () => api.get('/fournisseurs/export-excel', { responseType: 'blob' }),
  getHistory: (id: string) => api.get(`/fournisseurs/${id}/history`),
  getHistoriquePaiements: (id: string, page = 1, limit = 10) => 
    api.get(`/fournisseurs/${id}/historique-paiements?page=${page}&limit=${limit}`),
  calculerSoldes: (id: string) => api.get(`/fournisseurs/${id}/soldes`),
  recalculerSoldesTous: () => api.post('/fournisseurs/recalculer-soldes')
};

// API Devis
export const preFactureAPI = {
  getAll: () => api.get('/pre-factures'),
  getById: (id: string) => api.get(`/pre-factures/${id}`),
  create: (data: any) => api.post('/pre-factures', data),
  update: (id: string, data: any) => api.put(`/pre-factures/${id}`, data),
  delete: (id: string) => api.delete(`/pre-factures/${id}`),
  convertToInvoice: (id: string) => api.post(`/pre-factures/${id}/convert`),
  send: (id: string) => api.put(`/pre-factures/${id}/send`),
  accept: (id: string) => api.put(`/pre-factures/${id}/accept`),
  reject: (id: string) => api.put(`/pre-factures/${id}/reject`),
  generatePDF: (id: string, config?: { timeout?: number }) => {
    const timeout = config?.timeout || 120000; // 2 minutes par défaut
    return api.get(`/pre-factures/${id}/pdf`, { 
      responseType: 'blob',
      timeout: timeout
    });
  },
};

// API Factures
export const facturesAPI = {
  getAll: (params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', String(params.page));
    if (params.limit) searchParams.append('limit', String(params.limit));
    return api.get(`/factures?${searchParams.toString()}`);
  },
  getById: (id: string) => api.get(`/factures/${id}`),
  create: (data: any) => api.post('/factures', data),
  update: (id: string, data: any) => api.put(`/factures/${id}`, data),
  delete: (id: string) => api.delete(`/factures/${id}`),
  generatePDF: (id: string, config?: { timeout?: number }) => {
    const timeout = config?.timeout || 120000; // 2 minutes par défaut
    return api.get(`/factures/${id}/pdf`, { 
      responseType: 'blob',
      timeout: timeout
    });
  },
  markAsPaid: (id: string) => api.put(`/factures/${id}/pay`),
  makePayment: (id: string, amount: number, moyenPaiement: string) => api.post(`/factures/${id}/payment`, { amount, moyenPaiement }),
  sendFacture: (id: string) => api.put(`/factures/${id}/send`),
  createAvoir: (id: string, montant: number, moyenPaiement: string) => api.post(`/factures/${id}/avoir`, { montant, moyenPaiement }),
  cancelFacture: (id: string) => api.put(`/factures/${id}/cancel`),
  refundFacture: (id: string, montant: number, moyenPaiement: string) => api.post(`/factures/${id}/refund`, { montant, moyenPaiement }),
  payerFactureFournisseur: (id: string, data: {
    montantAPayer: number;
    modePaiement: 'solde_crediteur' | 'moyen_paiement' | 'mixte';
    moyenPaiement?: string;
  }) => api.post(`/factures/${id}/payer-fournisseur`, data),
  verifierCapacitePaiement: (fournisseurId: string, montantFacture: number) => 
    api.get(`/factures/verifier-paiement/${fournisseurId}`, { 
      params: { montantFacture } 
    }),
};

// API Caisse
export const caisseAPI = {
  getOperations: (params?: any) => api.get('/caisse/operations', { params }),
  getSolde: () => api.get('/caisse/solde'),
  getStatistics: (params?: any) => api.get('/caisse/statistics', { params }),
  getOperationDetails: (id: string) => api.get(`/caisse/operations/${id}`),
  addOperation: (data: any) => {
    // Transformer les données pour correspondre au backend
    const transformedData = {
      ...data,
      moyenPaiement: data.modePaiement || data.moyenPaiement || 'especes',
      type_operation: data.type_operation || 'autre',
      // S'assurer que les champs obligatoires sont présents
      montant: parseFloat(data.montant) || 0,
      description: data.description?.trim() || '',
      categorie: data.categorie || 'autre_sortie',
      date: data.date || new Date().toISOString().split('T')[0],
      reference: data.reference?.trim() || '',
      // Ajouter des champs qui pourraient être requis par le backend
      agenceId: data.agenceId || null,
      userId: data.userId || null,
      notes: data.notes || '',
      statut: 'active',
      // Champs supplémentaires potentiellement requis
      type: data.type || 'entree',
      montantTTC: parseFloat(data.montant) || 0,
      montantHT: parseFloat(data.montant) || 0,
      tva: 0,
      devise: 'EUR',
      modePaiement: data.modePaiement || data.moyenPaiement || 'especes',
      // Relations
      agentId: data.agentId || null,
      clientId: data.clientId || null,
      fournisseurId: data.fournisseurId || null,
      factureId: data.factureId || null
    };
    
    console.log('🔧 Données transformées pour API:', transformedData);
    console.log('📋 Données JSON complètes:', JSON.stringify(transformedData, null, 2));
    
    // Rediriger vers la bonne route selon le type
    if (data.type === 'entree') {
      console.log('📤 Envoi vers /caisse/entree');
      return api.post('/caisse/entree', transformedData);
    } else {
      console.log('📤 Envoi vers /caisse/sortie');
      return api.post('/caisse/sortie', transformedData);
    }
  },
  updateOperation: (id: string, data: any) => api.put(`/caisse/operations/${id}`, data),
  deleteOperation: (id: string) => api.put(`/caisse/operations/${id}/annuler`),
  exportOperations: (params?: any) => api.get('/caisse/export', { 
    params,
    responseType: 'blob' 
  }),
};

// API Packages
export const packagesAPI = {
  getAll: () => api.get('/packages'),
  getPublic: () => api.get('/packages/public'),
  getById: (id: string) => api.get(`/packages/${id}`),
  create: (data: any) => api.post('/packages', data),
  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
  delete: (id: string) => api.delete(`/packages/${id}`),
  toggleVisibility: (id: string) => api.put(`/packages/${id}/toggle-visibility`),
};

// API Billets d'avion
export const billetsAPI = {
  getAll: () => api.get('/billets'),
  getNonFactures: () => api.get('/billets/non-factures'),
  getById: (id: string) => api.get(`/billets/${id}`),
  create: (data: any) => api.post('/billets', data),
  update: (id: string, data: any) => api.put(`/billets/${id}`, data),
  delete: (id: string) => api.delete(`/billets/${id}`),
  importFromGmail: async () => {
    const user = JSON.parse(localStorage.getItem('samtech_user') || '{}');
    const token = user.token;
    
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const response = await fetch('/api/billets/import-gmail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'import Gmail');
    }

    return response;
  },
  iaAnalyseBillet: (data: { texte: string }) => api.post('/billets/ia-analyse-billet', data),
};

// API Agents
export const agentsAPI = {
  getAll: () => api.get('/agents'),
  getById: (id: string) => api.get(`/agents/${id}`),
  create: (data: any) => api.post('/agents', data),
  update: (id: string, data: any) => api.put(`/agents/${id}`, data),
  delete: (id: string) => api.delete(`/agents/${id}`),
};

// API Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getSuperadminStats: () => api.get('/dashboard/superadmin/stats'),
  getAgenceStats: () => api.get('/dashboard/agence/stats'),
  getAgentStats: () => api.get('/dashboard/agent/stats'),
};

// API Creances
export const creancesAPI = {
  getAll: () => api.get('/creances'),
  getStats: () => api.get('/creances/stats'),
  sendReminder: (id: string, message: string) => 
    api.post(`/creances/${id}/reminder`, { message }),
};

// API Reservations
export const reservationsAPI = {
  getAll: () => api.get('/reservations'),
  getById: (id: string) => api.get(`/reservations/${id}`),
  create: (data: any) => api.post('/reservations', data),
  update: (id: string, data: any) => api.put(`/reservations/${id}`, data),
  updateStatus: (id: string, status: string) => 
    api.put(`/reservations/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/reservations/${id}`),
};

// API Tickets
export const ticketsAPI = {
  getAll: () => api.get('/tickets'),
  getById: (id: string) => api.get(`/tickets/${id}`),
  create: (data: any) => api.post('/tickets', data),
  update: (id: string, data: any) => api.put(`/tickets/${id}`, data),
  updateStatus: (id: string, status: string) => 
    api.put(`/tickets/${id}/status`, { status }),
  reply: (id: string, message: string) =>
    api.post(`/tickets/${id}/reply`, { message }),
};

// API Documents
export const documentsAPI = {
  getAll: () => api.get('/documents'),
  getById: (id: string) => api.get(`/documents/${id}`),
  create: (data: any) => api.post('/documents', data),
  update: (id: string, data: any) => api.put(`/documents/${id}`, data),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

// API Audit
export const auditAPI = {
  getLogs: (params?: any) => api.get('/audit/logs', { params }),
  getLogById: (id: string) => api.get(`/audit/logs/${id}`),
  getStats: () => api.get('/audit/stats'),
  exportLogs: (params?: any) => api.get('/audit/export', { 
    params, 
    responseType: 'blob' 
  }),
};

// API Todos
export const todosAPI = {
  getAll: () => api.get('/todos'),
  getById: (id: string) => api.get(`/todos/${id}`),
  create: (data: any) => api.post('/todos', data),
  update: (id: string, data: any) => api.put(`/todos/${id}`, data),
  toggleStatus: (id: string) => api.put(`/todos/${id}/toggle`),
  delete: (id: string) => api.delete(`/todos/${id}`),
};

// API Notifications (si besoin)
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getById: (id: string) => api.get(`/notifications/${id}`),
  create: (data: any) => api.post('/notifications', data),
  update: (id: string, data: any) => api.put(`/notifications/${id}`, data),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  resend: (id: string) => api.post(`/notifications/${id}/resend`),
  getStats: () => api.get('/notifications/stats'),
  getUserNotifications: () => api.get('/notifications/user'),
  getAgencyNotifications: () => api.get('/notifications/agency'),
};

// API Profile
export const profileAPI = {
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  updateUserData: (data: any) => api.put('/auth/profile', data),
  updatePassword: (data: any) => api.put('/auth/change-password', data),
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/profile/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  // Gmail integration
  getGmailAuthUrl: () => api.get('/profile/gmail/auth-url'),
  handleGmailCallback: (code: string, state: string) => 
    api.post('/profile/gmail/callback', { code, state }),
  disconnectGmail: () => api.delete('/profile/gmail/disconnect'),
  sendEmailViaGmail: (data: any) => api.post('/profile/gmail/send', data),
  getMe: () => api.get('/auth/me'),
};

export const parametresAPI = {
  getParametres: () => api.get('/parametres'),
  updateParametres: (data: any) => api.put('/parametres', data),
  generateApiKey: () => api.post('/parametres/generate-api-key'),
  triggerBackup: () => api.post('/parametres/backup'),
};

// API Module Requests
export const moduleRequestsAPI = {
  getAll: () => api.get('/module-requests'),
  getAgencyRequests: () => api.get('/module-requests/agency'),
  create: (data: any) => api.post('/module-requests', data),
  process: (id: string, data: any) => api.put(`/module-requests/${id}/process`, data),
  getPendingAgencies: () => api.get('/module-requests/admin/pending'),
};

// Factures Fournisseurs API
export const facturesFournisseursAPI = {
  getAll: () => api.get('/factures-fournisseurs'),
  getById: (id: string) => api.get(`/factures-fournisseurs/${id}`),
  create: (data: any) => api.post('/factures-fournisseurs', data),
  update: (id: string, data: any) => api.put(`/factures-fournisseurs/${id}`, data),
  delete: (id: string) => api.delete(`/factures-fournisseurs/${id}`),
  generatePDF: (id: string) => api.get(`/factures-fournisseurs/${id}/pdf`, { responseType: 'blob' }),
  sendEmail: (id: string, emailData: any) => api.post(`/factures-fournisseurs/${id}/send-email`, emailData),
  markAsPaid: (id: string) => api.put(`/factures-fournisseurs/${id}/mark-paid`),
  markAsOverdue: (id: string) => api.put(`/factures-fournisseurs/${id}/mark-overdue`)
};

// API Hôtels
export const hotelsAPI = {
  getAll: () => api.get('/hotels'),
  getById: (id: string) => api.get(`/hotels/${id}`),
  create: (data: any) => api.post('/hotels', data),
  update: (id: string, data: any) => api.put(`/hotels/${id}`, data),
  delete: (id: string) => api.delete(`/hotels/${id}`),
};

// API Assurance
export const assuranceAPI = {
  getAll: () => api.get('/assurance'),
  getNonFactures: () => api.get('/assurance/non-factures'),
  getById: (id: string) => api.get(`/assurance/${id}`),
  create: (data: any) => api.post('/assurance', data),
  update: (id: string, data: any) => api.put(`/assurance/${id}`, data),
  delete: (id: string) => api.delete(`/assurance/${id}`),
  getStats: () => api.get('/assurance/stats'),
  iaAnalyseAssurance: (data: { texte: string }) => api.post('/assurance/ia-analyse-assurance', data),
  extractPdfText: async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/assurance/extract-pdf-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  importPdf: async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/assurance/import-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// API Manifest
export const manifestAPI = {
  getAll: () => api.get('/manifest'),
  getById: (id: string) => api.get(`/manifest/${id}`),
  create: (data: any) => api.post('/manifest', data),
  update: (id: string, data: any) => api.put(`/manifest/${id}`, data),
  delete: (id: string) => api.delete(`/manifest/${id}`),
  getStats: () => api.get('/manifest/stats'),
  generatePDF: (id: string) => api.get(`/manifest/${id}/pdf`, { responseType: 'arraybuffer' }),
};

// API Autres Prestations
export const autresPrestationsAPI = {
  getAll: () => api.get('/autres-prestations'),
  getById: (id: string) => api.get(`/autres-prestations/${id}`),
  create: (data: any) => api.post('/autres-prestations', data),
  update: (id: string, data: any) => api.put(`/autres-prestations/${id}`, data),
  delete: (id: string) => api.delete(`/autres-prestations/${id}`),
  getStats: () => api.get('/autres-prestations/stats'),
};

// API Prestations
export const prestationsAPI = {
  getNonFacturees: (clientId: string) => api.get(`/prestations/non-facturees/${clientId}`),
  getByReference: (reference: string) => api.get(`/prestations/reference/${reference}`)
};

export default api;