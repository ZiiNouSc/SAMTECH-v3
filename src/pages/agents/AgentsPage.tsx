import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Settings,
  Mail,
  Phone,
  Filter,
  Download,
  Upload,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ViewToggle from '../../components/ui/ViewToggle';
import GridView from '../../components/ui/GridView';
import ListView from '../../components/ui/ListView';
import Card from '../../components/ui/Card';
import SearchFilter from '../../components/ui/SearchFilter';
import StatCard from '../../components/ui/StatCard';
import { Agent, Permission } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { agentsAPI } from '../../services/api';
import { getAgencyModules } from '../../config/modules';

const AgentsPage: React.FC = () => {
  const { currentAgence, userAgences, user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'table' | 'grid' | 'list'>('table');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showAgencyAssignModal, setShowAgencyAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    permissions: [] as Permission[],
    agenceId: currentAgence?.id || '',
    password: 'password123'
  });

  const filterOptions = [
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'actif', label: 'Actif' },
        { value: 'suspendu', label: 'Suspendu' }
      ]
    }
  ];

  // Utiliser la configuration centralisée des modules
  const availableModules = getAgencyModules().map(module => ({
    id: module.id,
    name: module.name,
    description: module.description
  }));

  // Modules par défaut qui ne doivent pas être affichés dans la gestion des permissions
  const defaultModules = ['profile', 'dashboard', 'auth', 'system'];

  // Filtrer les modules disponibles en fonction des modules actifs de l'agence
  const filteredModules = (Array.isArray(availableModules) ? availableModules : []).filter(module => 
    currentAgence?.modulesActifs?.includes(module.id)
  );

  // Pour le modal des permissions, on affiche TOUS les modules si superadmin, sinon seulement les modules actifs
  const modulesForPermissions = user?.role === 'superadmin' ? availableModules : filteredModules;

  const availableActions = ['lire', 'creer', 'modifier', 'supprimer'];

  useEffect(() => {
    fetchAgents();
  }, [currentAgence]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await agentsAPI.getAll();
      // Le backend retourne maintenant { success: true, data: [...] }
      // Mapper _id vers id pour le frontend
      const agentsData = response.data?.data || [];
      const mappedAgents = agentsData.map((agent: any) => ({
        ...agent,
        id: agent._id || agent.id
      }));
      setAgents(mappedAgents);
    } catch (error: any) {
      console.error('Erreur lors du chargement des agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async () => {
    if (!formData.nom || !formData.prenom || !formData.email) return;

    try {
      const response = await agentsAPI.create({
        ...formData,
        agenceId: currentAgence?.id
      });
      // Le backend retourne maintenant { success: true, data: agentResponse }
      // Mapper _id vers id pour le frontend
      const newAgent = {
        ...response.data.data,
        id: response.data.data._id || response.data.data.id
      };
      setAgents(prev => [newAgent, ...(Array.isArray(prev) ? prev : [])]);
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('Erreur lors de la création de l\'agent: ' + (error.response?.data?.message || 'Erreur inconnue'));
    }
  };

  const handleToggleStatus = async (agentId: string) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      
      const newStatus = agent.statut === 'actif' ? 'suspendu' : 'actif';
      await agentsAPI.update(agentId, { ...agent, statut: newStatus });
      
      setAgents(prev => (Array.isArray(prev) ? prev : []).map(agent => 
        agent.id === agentId 
          ? { ...agent, statut: newStatus as 'actif' | 'suspendu' }
          : agent
      ));
    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedAgent) return;

    try {
      console.log('Permissions mises à jour:', formData.permissions);
      // Le backend retourne maintenant { success: true, data: agentResponse }
      const updatedAgent = {
        ...selectedAgent, // Keep existing agent data
        permissions: formData.permissions
      };
      
      setAgents(prev => (Array.isArray(prev) ? prev : []).map(agent => 
        agent.id === selectedAgent.id 
          ? updatedAgent
          : agent
      ));
      setShowPermissionsModal(false);
      setSelectedAgent(null);
      resetForm();
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour des permissions:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data);
      alert('Erreur: ' + (error.response?.data?.message || 'Erreur inconnue'));
    }
  };

  const handleAssignAgency = async () => {
    if (!selectedAgent) return;

    try {
      // Get selected agencies from form
      const selectedAgencies = userAgences
        .filter(agence => {
          const element = document.getElementById(`agence-${agence.id}`) as HTMLInputElement;
          return element?.checked;
        })
        .map(agence => agence.id);
      
      console.log('Agences assignées:', selectedAgencies);
      // Le backend retourne maintenant { success: true, data: agentResponse }
      const updatedAgent = {
        ...selectedAgent, // Keep existing agent data
        agences: selectedAgencies
      };
      
      setAgents(prev => (Array.isArray(prev) ? prev : []).map(agent => 
        agent.id === selectedAgent.id 
          ? updatedAgent
          : agent
      ));
      
      setShowAgencyAssignModal(false);
      setSelectedAgent(null);
    } catch (error: any) {
      console.error('Erreur lors de l\'attribution d\'agence:', error);
      alert('Erreur: ' + (error.response?.data?.message || 'Erreur inconnue'));
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;

    try {
      await agentsAPI.delete(selectedAgent.id);
      setAgents(prev => (Array.isArray(prev) ? prev : []).filter(agent => agent.id !== selectedAgent.id));
      setShowDeleteModal(false);
      setSelectedAgent(null);
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      permissions: [],
      agenceId: currentAgence?.id || '',
      password: 'password123'
    });
  };

  const openPermissionsModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      ...formData,
      nom: agent.nom,
      prenom: agent.prenom,
      email: agent.email,
      telephone: agent.telephone,
      permissions: [...agent.permissions],
      agenceId: currentAgence?.id || ''
    });
    setShowPermissionsModal(true);
  };

  const openAgencyAssignModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgencyAssignModal(true);
  };

  const handlePermissionChange = (moduleId: string, action: string, checked: boolean) => {
    setFormData(prev => {
      const newPermissions = [...prev.permissions];
      const moduleIndex = newPermissions.findIndex(p => p.module === moduleId);
      
      if (moduleIndex >= 0) {
        if (checked) {
          if (!newPermissions[moduleIndex].actions.includes(action)) {
            newPermissions[moduleIndex].actions.push(action);
          }
        } else {
          newPermissions[moduleIndex].actions = (newPermissions[moduleIndex].actions || []).filter(a => a !== action);
          if ((newPermissions[moduleIndex].actions || []).length === 0) {
            newPermissions.splice(moduleIndex, 1);
          }
        }
      } else if (checked) {
        newPermissions.push({ module: moduleId, actions: [action] });
      }
      
      return { ...prev, permissions: newPermissions };
    });
  };

  // Fonction pour cocher toutes les permissions d'un module
  const handleSelectAllPermissions = (moduleId: string) => {
    setFormData(prev => {
      const newPermissions = [...prev.permissions];
      const moduleIndex = newPermissions.findIndex(p => p.module === moduleId);
      
      if (moduleIndex >= 0) {
        // Remplacer toutes les actions par toutes les actions disponibles
        newPermissions[moduleIndex].actions = [...availableActions];
      } else {
        // Ajouter le module avec toutes les actions
        newPermissions.push({ module: moduleId, actions: [...availableActions] });
      }
      
      return { ...prev, permissions: newPermissions };
    });
  };

  // Fonction pour décocher toutes les permissions d'un module
  const handleDeselectAllPermissions = (moduleId: string) => {
    setFormData(prev => {
      const newPermissions = [...prev.permissions];
      const moduleIndex = newPermissions.findIndex(p => p.module === moduleId);
      
      if (moduleIndex >= 0) {
        // Supprimer le module complètement
        newPermissions.splice(moduleIndex, 1);
      }
      
      return { ...prev, permissions: newPermissions };
    });
  };

  // Fonction pour vérifier si toutes les permissions d'un module sont cochées
  const hasAllPermissions = (moduleId: string) => {
    const modulePermission = formData.permissions.find(p => p.module === moduleId);
    return modulePermission && modulePermission.actions.length === availableActions.length;
  };

  // Fonction pour vérifier si au moins une permission d'un module est cochée
  const hasAnyPermission = (moduleId: string) => {
    const modulePermission = formData.permissions.find(p => p.module === moduleId);
    return modulePermission && modulePermission.actions.length > 0;
  };

  const hasPermission = (moduleId: string, action: string) => {
    const modulePermission = formData.permissions.find(p => p.module === moduleId);
    return modulePermission ? modulePermission.actions.includes(action) : false;
  };

  // Fonction pour vérifier si les permissions ont été modifiées
  const hasPermissionsChanged = () => {
    if (!selectedAgent) return false;
    
    const originalPermissions = selectedAgent.permissions || [];
    const currentPermissions = formData.permissions;
    
    if (originalPermissions.length !== currentPermissions.length) return true;
    
    // Vérifier chaque permission
    for (const originalPermission of originalPermissions) {
      const currentPermission = currentPermissions.find(p => p.module === originalPermission.module);
      if (!currentPermission) return true;
      
      if (originalPermission.actions.length !== currentPermission.actions.length) return true;
      
      for (const action of originalPermission.actions) {
        if (!currentPermission.actions.includes(action)) return true;
      }
    }
    
    // Vérifier les nouvelles permissions
    for (const currentPermission of currentPermissions) {
      const originalPermission = originalPermissions.find(p => p.module === currentPermission.module);
      if (!originalPermission) return true;
    }
    
    return false;
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const filteredAgents = (Array.isArray(agents) ? agents : []).filter(agent => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      agent.nom.toLowerCase().includes(searchLower) ||
      agent.prenom.toLowerCase().includes(searchLower) ||
      agent.email.toLowerCase().includes(searchLower)
    );

    const statutFilter = activeFilters.statut;
    const matchesStatut = !statutFilter || statutFilter === 'tous' || agent.statut === statutFilter;

    return matchesSearch && matchesStatut;
  });

  // Fonction pour filtrer les permissions à afficher (exclure les modules par défaut)
  const filterDisplayPermissions = (permissions: Permission[]): Permission[] => {
    return permissions.filter((permission: Permission) => 
      !defaultModules.includes(permission.module) && 
      availableModules.some(module => module.id === permission.module)
    );
  };

  const renderAgentCard = (agent: Agent) => (
    <Card key={agent.id} hover className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 font-medium">
              {agent.prenom[0]}{agent.nom[0]}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {agent.prenom} {agent.nom}
            </h3>
            <Badge 
              variant={agent.statut === 'actif' ? 'success' : 'danger'}
              size="sm"
              className="mt-1"
            >
              {agent.statut === 'actif' ? 'Actif' : 'Suspendu'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-2" />
          {agent.email}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-2" />
          {agent.telephone}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
        <div className="flex flex-wrap gap-1">
          {/* Afficher seulement les permissions pertinentes */}
          {filterDisplayPermissions(agent.permissions).slice(0, 3).map((permission: Permission, index: number) => (
            <Badge 
              key={permission.module} 
              variant={permission.actions.length > 1 ? "info" : "default"} 
              size="sm"
            >
              {permission.module}
              {permission.actions.length === 1 && permission.actions.includes('lire') && (
                <span className="ml-1 text-xs opacity-75">(lecture)</span>
              )}
            </Badge>
          ))}
          {filterDisplayPermissions(agent.permissions).length > 3 && (
            <Badge variant="default" size="sm">
              +{filterDisplayPermissions(agent.permissions).length - 3}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Créé le {new Date(agent.dateCreation).toLocaleDateString('fr-FR')}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedAgent(agent);
              setShowDetailModal(true);
            }}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => openPermissionsModal(agent)}
            className="p-1 text-purple-600 hover:bg-purple-100 rounded"
            title="Gérer les permissions"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => openAgencyAssignModal(agent)}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            title="Attribuer des agences"
          >
            <Building2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleToggleStatus(agent.id)}
            className={`p-1 rounded ${
              agent.statut === 'actif' 
                ? 'text-red-600 hover:bg-red-100' 
                : 'text-green-600 hover:bg-green-100'
            }`}
            title={agent.statut === 'actif' ? 'Suspendre' : 'Activer'}
          >
            {agent.statut === 'actif' ? (
              <UserX className="w-4 h-4" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Gestion des Agents</h1>
          <p className="text-gray-600">Gérer vos agents et leurs permissions</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvel Agent
        </button>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total agents"
          value={(Array.isArray(agents) ? agents : []).length}
          icon={UserCheck}
          color="blue"
        />
        <StatCard
          title="Agents actifs"
          value={(Array.isArray(agents) ? agents : []).filter(a => a.statut === 'actif').length}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Agents suspendus"
          value={(Array.isArray(agents) ? agents : []).filter(a => a.statut === 'suspendu').length}
          icon={UserX}
          color="red"
        />
      </div>

      {/* Filtres et recherche */}
      <SearchFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        placeholder="Rechercher un agent..."
      />

      {/* Contrôles de vue */}
      <div className="flex items-center justify-between">
        <ViewToggle
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        <div className="text-sm text-gray-500">
          {filteredAgents.length} agent(s) trouvé(s)
        </div>
      </div>

      {/* Contenu principal */}
      {currentView === 'table' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Agent</TableHeaderCell>
                <TableHeaderCell>Contact</TableHeaderCell>
                <TableHeaderCell>Statut</TableHeaderCell>
                <TableHeaderCell>Permissions</TableHeaderCell>
                <TableHeaderCell>Date création</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-medium text-sm">
                          {agent.prenom[0]}{agent.nom[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {agent.prenom} {agent.nom}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {agent.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {agent.telephone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={agent.statut === 'actif' ? 'success' : 'danger'}
                      size="sm"
                    >
                      {agent.statut === 'actif' ? 'Actif' : 'Suspendu'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {/* Afficher seulement les permissions pertinentes */}
                      {filterDisplayPermissions(agent.permissions).slice(0, 3).map((permission: Permission, index: number) => (
                        <Badge 
                          key={permission.module} 
                          variant={permission.actions.length > 1 ? "info" : "default"} 
                          size="sm"
                        >
                          {permission.module}
                          {permission.actions.length === 1 && permission.actions.includes('lire') && (
                            <span className="ml-1 text-xs opacity-75">(lecture)</span>
                          )}
                        </Badge>
                      ))}
                      {filterDisplayPermissions(agent.permissions).length > 3 && (
                        <Badge variant="default" size="sm">
                          +{filterDisplayPermissions(agent.permissions).length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {new Date(agent.dateCreation).toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAgent(agent);
                          setShowDetailModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => openPermissionsModal(agent)}
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                        title="Gérer les permissions"
                      >
                        <Settings className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openAgencyAssignModal(agent)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Attribuer des agences"
                      >
                        <Building2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(agent.id)}
                        className={`p-1 rounded ${
                          agent.statut === 'actif' 
                            ? 'text-red-600 hover:bg-red-100' 
                            : 'text-green-600 hover:bg-green-100'
                        }`}
                        title={agent.statut === 'actif' ? 'Suspendre' : 'Activer'}
                      >
                        {agent.statut === 'actif' ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {currentView === 'grid' && (
        <GridView>
          {filteredAgents.map(renderAgentCard)}
        </GridView>
      )}

      {currentView === 'list' && (
        <ListView>
          {filteredAgents.map(renderAgentCard)}
        </ListView>
      )}

      {/* Modal ajout agent */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Ajouter un nouvel agent"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Prénom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mot de passe"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleAddAgent}
              className="btn-primary"
            >
              Ajouter l'agent
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal permissions */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => {
          setShowPermissionsModal(false);
          setSelectedAgent(null);
          resetForm();
        }}
        title="Gérer les permissions"
        size="xl"
      >
        {selectedAgent && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                Permissions pour {selectedAgent.prenom} {selectedAgent.nom}
              </h3>
              <p className="text-sm text-blue-700">
                Cochez les permissions que vous souhaitez attribuer à cet agent.
              </p>
            </div>
            
            <div className="space-y-4">
              {modulesForPermissions.map((module) => (
                <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {module.name}
                      </h4>
                      <p className="text-sm text-gray-500">{module.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectAllPermissions(module.id)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Tout cocher
                      </button>
                      <button
                        onClick={() => handleDeselectAllPermissions(module.id)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Tout décocher
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableActions.map((action) => (
                      <label key={action} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasPermission(module.id, action)}
                          onChange={(e) => handlePermissionChange(module.id, action, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {action}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedAgent(null);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdatePermissions}
                className="btn-primary"
              >
                Enregistrer les permissions
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal attribution d'agence */}
      <Modal
        isOpen={showAgencyAssignModal}
        onClose={() => {
          setShowAgencyAssignModal(false);
          setSelectedAgent(null);
        }}
        title="Attribuer des agences"
        size="lg"
      >
        {selectedAgent && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                Attribution d'agences pour {selectedAgent.prenom} {selectedAgent.nom}
              </h3>
              <p className="text-sm text-blue-700">
                Sélectionnez les agences auxquelles cet agent aura accès.
              </p>
            </div>
            
            <div className="space-y-4">
              {(Array.isArray(userAgences) ? userAgences : []).map((agence, index) => (
                <div key={agence.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`agence-${agence.id}`}
                      className="mr-3"
                      // In a real implementation, you would check if the agent is assigned to this agency
                      defaultChecked={agence.id === currentAgence?.id}
                    />
                    <label htmlFor={`agence-${agence.id}`} className="cursor-pointer">
                      <p className="font-medium text-gray-900">{agence.nom}</p>
                      <p className="text-sm text-gray-500">{agence.email}</p>
                    </label>
                  </div>
                  <div>
                    <Badge variant={agence.statut === 'approuve' ? 'success' : 'warning'}>
                      {agence.statut === 'approuve' ? 'Approuvée' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAgencyAssignModal(false);
                  setSelectedAgent(null);
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignAgency}
                className="btn-primary"
              >
                Enregistrer les attributions
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal détails agent */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails de l'agent"
        size="lg"
      >
        {selectedAgent && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <p className="text-sm text-gray-900">
                  {selectedAgent.prenom} {selectedAgent.nom}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-sm text-gray-900">{selectedAgent.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <p className="text-sm text-gray-900">{selectedAgent.telephone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <Badge variant={selectedAgent.statut === 'actif' ? 'success' : 'danger'}>
                  {selectedAgent.statut === 'actif' ? 'Actif' : 'Suspendu'}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permissions
              </label>
              <div className="space-y-3">
                {filterDisplayPermissions(selectedAgent.permissions || []).map((permission: Permission, index: number) => (
                  <div key={permission.module} className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2 capitalize">
                      {permission.module}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(permission.actions || []).map((action: string, actionIndex: number) => (
                        <Badge key={`${permission.module}-${action}-${actionIndex}`} variant="info" size="sm">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {filterDisplayPermissions(selectedAgent.permissions || []).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Aucune permission spécifique attribuée
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => openPermissionsModal(selectedAgent)}
                className="btn-primary"
              >
                <Settings className="w-4 h-4 mr-2" />
                Gérer les permissions
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAgent(null);
        }}
        title="Confirmer la suppression"
      >
        {selectedAgent && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer l'agent{' '}
              <strong>{selectedAgent.prenom} {selectedAgent.nom}</strong> ?
            </p>
            <p className="text-sm text-red-600">
              Cette action est irréversible et supprimera tous les accès de cet agent.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAgent}
                className="btn-danger"
              >
                Supprimer
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAgent(null);
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgentsPage; 