import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Settings,
  User,
  UserPlus
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Agence } from '../../types';
import { agencesAPI, usersAPI } from '../../services/api';
import { getAgencyModules } from '../../config/modules';

// Utilitaire pour garantir une clé unique
const getAgenceKey = (agence: any) => agence.id || agence._id || Math.random().toString(36);

const AgencesListPage: React.FC = () => {
  const [agences, setAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [selectedAgence, setSelectedAgence] = useState<Agence | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showModulesModal, setShowModulesModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignUserModal, setShowAssignUserModal] = useState(false);
  const [selectedAgenceForUser, setSelectedAgenceForUser] = useState<Agence | null>(null);
  const [agenceUsers, setAgenceUsers] = useState<any[]>([]);
  const [loadingAgenceUsers, setLoadingAgenceUsers] = useState(false);

  // États pour la gestion des utilisateurs
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userAssignmentType, setUserAssignmentType] = useState<'existing' | 'new'>('existing');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    typeActivite: 'agence-voyage',
    modulesActifs: [] as string[]
  });

  // Données pour créer un nouvel utilisateur
  const [newUserData, setNewUserData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    telephone: ''
  });

  // Utiliser la configuration centralisée des modules
  const availableModules = getAgencyModules().map(module => ({
    id: module.id,
    name: module.name,
    description: module.description,
    essential: module.essential
  }));

  useEffect(() => {
    fetchAgences();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await usersAPI.getAll();
      setUsers(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAgenceUsers = async (agenceId: string) => {
    try {
      setLoadingAgenceUsers(true);
      const response = await usersAPI.getAll();
      const allUsers = response.data?.data || response.data || [];
      
      // Filtrer les utilisateurs qui appartiennent à cette agence
      const usersOfAgence = allUsers.filter((user: any) => {
        const userAgenceId = user.agenceId?._id || user.agenceId;
        return userAgenceId === agenceId;
      });
      
      setAgenceUsers(usersOfAgence);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs de l\'agence:', error);
      setAgenceUsers([]);
    } finally {
      setLoadingAgenceUsers(false);
    }
  };

  const fetchAgences = async () => {
    try {
      setLoading(true);
      const response = await agencesAPI.getAll();
      // L'API retourne directement un tableau d'agences
      const agencesData = response.data || [];
      setAgences(Array.isArray(agencesData) ? agencesData : []);
    } catch (error) {
      console.error('Erreur lors du chargement des agences:', error);
      setAgences([]); // En cas d'erreur, initialiser avec un tableau vide
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgence = async () => {
    try {
      // Créer l'agence d'abord
      const agenceResponse = await agencesAPI.create(formData);
      
      if (agenceResponse.data.success) {
        const newAgence = agenceResponse.data.data || agenceResponse.data;
        
        // Gérer l'attribution d'utilisateur
        if (userAssignmentType === 'existing' && selectedUserId) {
          // Attribuer l'agence à un utilisateur existant
          await usersAPI.assignToAgency(selectedUserId, newAgence.id || newAgence._id);
        } else if (userAssignmentType === 'new') {
          // Créer un nouvel utilisateur et l'attribuer à l'agence
          try {
            const userResponse = await usersAPI.create({
              nom: newUserData.nom,
              prenom: newUserData.prenom,
              email: newUserData.email,
              password: newUserData.password,
              telephone: newUserData.telephone,
              agenceId: newAgence.id || newAgence._id,
              role: 'agence'
            });
            if (!userResponse.data.success) {
              alert('Agence créée, mais erreur lors de la création de l\'utilisateur : ' + (userResponse.data.message || 'Erreur inconnue'));
            }
          } catch (userError) {
            alert('Agence créée, mais erreur lors de la création de l\'utilisateur : ' + ((userError as any).response?.data?.message || 'Erreur inconnue'));
          }
        }
        
        setAgences(prev => [...prev, newAgence]);
        setShowCreateModal(false);
        resetForm();
        resetUserForm();
        alert('Agence et utilisateur associés ajoutés avec succès !');
      }
    } catch (error) {
      const errMsg = (error as any).response?.data?.message || 'Une erreur est survenue';
      alert('Erreur: ' + errMsg);
    }
  };

  const handleApprove = async (agenceId: string) => {
    try {
      await agencesAPI.approve(agenceId);
      setAgences(prev => (Array.isArray(prev) ? prev : []).map(agence => 
        (agence.id === agenceId || agence._id === agenceId)
          ? { ...agence, statut: 'approuve' as const }
          : agence
      ));
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
    }
  };

  const handleReject = async (agenceId: string) => {
    try {
      await agencesAPI.reject(agenceId);
      setAgences(prev => (Array.isArray(prev) ? prev : []).map(agence => 
        (agence.id === agenceId || agence._id === agenceId)
          ? { ...agence, statut: 'rejete' as const }
          : agence
      ));
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
    }
  };

  const handleSuspend = async (agenceId: string) => {
    try {
      await agencesAPI.suspend(agenceId);
      setAgences(prev => (Array.isArray(prev) ? prev : []).map(agence => 
        (agence.id === agenceId || agence._id === agenceId)
          ? { ...agence, statut: 'suspendu' as const }
          : agence
      ));
    } catch (error) {
      console.error('Erreur lors de la suspension:', error);
    }
  };

  const handleUpdateModules = async (agenceId: string, modules: string[]) => {
    try {
      await agencesAPI.updateModules(agenceId, modules);
      setAgences(prev => (Array.isArray(prev) ? prev : []).map(agence => 
        (agence.id === agenceId || agence._id === agenceId)
          ? { ...agence, modulesActifs: modules }
          : agence
      ));
      setShowModulesModal(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des modules:', error);
    }
  };

  const handleAssignUser = async () => {
    if (!selectedAgenceForUser) return;
    
    const agenceId = selectedAgenceForUser.id || selectedAgenceForUser._id;
    if (!agenceId) {
      alert('Erreur: ID de l\'agence non trouvé');
      return;
    }
    
    try {
      if (userAssignmentType === 'existing') {
        if (!selectedUserId) {
          alert('Erreur: Aucun utilisateur sélectionné');
          return;
        }
        
        // Attribuer un utilisateur existant à l'agence
        await usersAPI.assignToAgency(selectedUserId, agenceId);
        alert('Utilisateur attribué avec succès à l\'agence !');
        
      } else if (userAssignmentType === 'new') {
        if (!newUserData.prenom || !newUserData.nom || !newUserData.email || !newUserData.password) {
          alert('Erreur: Tous les champs obligatoires doivent être remplis');
          return;
        }
        
        // Créer un nouvel utilisateur et l'attribuer à l'agence
        const userResponse = await usersAPI.create({
          nom: newUserData.nom,
          prenom: newUserData.prenom,
          email: newUserData.email,
          password: newUserData.password,
          telephone: newUserData.telephone,
          agenceId: agenceId,
          role: 'agence'
        });
        
        alert('Nouvel utilisateur créé et attribué avec succès à l\'agence !');
      }
      
      setShowAssignUserModal(false);
      setSelectedAgenceForUser(null);
      setSelectedUserId('');
      resetUserForm();
      
      // Recharger les utilisateurs de l'agence si on est dans la modal de détails
      if (selectedAgence) {
        const currentAgenceId = selectedAgence.id || selectedAgence._id;
        if (currentAgenceId) {
          fetchAgenceUsers(currentAgenceId);
        }
      }
    } catch (error) {
      const errMsg = (error as any).response?.data?.message || 'Une erreur est survenue';
      alert('Erreur: ' + errMsg);
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${userName} de cette agence ?`)) {
      return;
    }
    
    try {
      await usersAPI.removeFromAgency(userId);
      alert('Utilisateur retiré de l\'agence avec succès !');
      
      // Recharger les utilisateurs de l'agence
      if (selectedAgence) {
        const agenceId = selectedAgence.id || selectedAgence._id;
        if (agenceId) {
          fetchAgenceUsers(agenceId);
        }
      }
    } catch (error) {
      const errMsg = (error as any).response?.data?.message || 'Une erreur est survenue';
      alert('Erreur: ' + errMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
      typeActivite: 'agence-voyage',
      modulesActifs: []
    });
  };

  const resetUserForm = () => {
    setNewUserData({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      telephone: ''
    });
    setUserAssignmentType('existing');
    setSelectedUserId('');
  };

  const filteredAgences = (Array.isArray(agences) ? agences : []).filter(agence => {
    const matchesSearch = agence.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agence.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'tous' || agence.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Agences</h1>
          <p className="text-gray-600">Gérer les agences et leurs permissions</p>
        </div>
        <button 
          onClick={() => {
            setShowCreateModal(true);
            fetchUsers(); // Charger les utilisateurs existants
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Agence
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une agence..."
                className="w-full pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="input-field w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="approuve">Approuvées</option>
              <option value="rejete">Rejetées</option>
              <option value="suspendu">Suspendues</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des agences */}
      <div className="card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Agence</TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Modules Actifs</TableHeaderCell>
              <TableHeaderCell>Date d'inscription</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(filteredAgences) ? filteredAgences : []).map((agence, index) => (
              <TableRow key={getAgenceKey(agence) || `getAgenceKey(agence)-${index}`}>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{agence.nom}</p>
                    <p className="text-sm text-gray-500">{agence.adresse}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-gray-900">{agence.email}</p>
                    <p className="text-sm text-gray-500">{agence.telephone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      agence.statut === 'approuve' ? 'success' :
                      agence.statut === 'en_attente' ? 'warning' :
                      agence.statut === 'suspendu' ? 'danger' : 'default'
                    }
                  >
                    {agence.statut === 'approuve' ? 'Approuvée' :
                     agence.statut === 'en_attente' ? 'En attente' :
                     agence.statut === 'suspendu' ? 'Suspendue' : 'Rejetée'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {(agence.modulesActifs || []).length} module(s)
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(agence.dateInscription).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedAgence(agence);
                        setShowDetailModal(true);
                        // Charger les utilisateurs de cette agence
                        const agenceId = agence.id || agence._id;
                        if (agenceId) {
                          fetchAgenceUsers(agenceId);
                        }
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedAgenceForUser(agence);
                        setShowAssignUserModal(true);
                        fetchUsers(); // Charger les utilisateurs
                      }}
                      className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                      title="Attribuer un utilisateur"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedAgence({
                          ...agence,
                          modulesChoisis: [...(agence.modulesActifs || [])]
                        });
                        setShowModulesModal(true);
                      }}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      title="Gérer les modules"
                    >
                      <Settings className="w-4 h-4" />
                    </button>

                    {agence.statut === 'en_attente' && (
                      <>
                        <button
                          onClick={() => {
                            const id = agence.id || agence._id;
                            if (id) handleApprove(id);
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Approuver"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const id = agence.id || agence._id;
                            if (id) handleReject(id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Rejeter"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {agence.statut === 'suspendu' && (
                      <button
                        onClick={() => {
                          const id = agence.id || agence._id;
                          if (id) handleApprove(id);
                        }}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Réactiver (Approuver)"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}

                    {agence.statut === 'approuve' && (
                      <button
                        onClick={() => {
                          const id = agence.id || agence._id;
                          if (id) handleSuspend(id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Suspendre"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(Array.isArray(filteredAgences) ? filteredAgences : []).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune agence trouvée</p>
          </div>
        )}
      </div>

      {/* Modal détails agence */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails de l'agence"
        size="lg"
      >
        {selectedAgence && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'agence
                </label>
                <p className="text-sm text-gray-900">{selectedAgence.nom}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-sm text-gray-900">{selectedAgence.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <p className="text-sm text-gray-900">{selectedAgence.telephone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <Badge 
                  variant={
                    selectedAgence.statut === 'approuve' ? 'success' :
                    selectedAgence.statut === 'en_attente' ? 'warning' : 'danger'
                  }
                >
                  {selectedAgence.statut === 'approuve' ? 'Approuvée' :
                   selectedAgence.statut === 'en_attente' ? 'En attente' : 'Rejetée'}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <p className="text-sm text-gray-900">{selectedAgence.adresse}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modules actifs
              </label>
              <div className="flex flex-wrap gap-2">
                {(selectedAgence.modulesActifs || []).length > 0 ? (
                  (selectedAgence.modulesActifs || []).map(moduleId => {
                    const module = availableModules.find(m => m.id === moduleId);
                    return (
                      <Badge key={moduleId} variant="info">
                        {module ? module.name : moduleId}
                      </Badge>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">Aucun module actif</p>
                )}
              </div>
            </div>

            {/* Modules demandés */}
            {selectedAgence.modulesDemandes && (selectedAgence.modulesDemandes || []).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modules demandés
                </label>
                <div className="flex flex-wrap gap-2">
                  {(selectedAgence.modulesDemandes || []).map(moduleId => {
                    const module = availableModules.find(m => m.id === moduleId);
                    return (
                      <Badge key={moduleId} variant="warning">
                        {module ? module.name : moduleId}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Utilisateurs de l'agence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Utilisateurs de l'agence
                </label>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAgenceForUser(selectedAgence);
                    setShowAssignUserModal(true);
                    fetchUsers();
                  }}
                  className="btn-secondary text-sm py-1 px-3"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Attribuer un utilisateur
                </button>
              </div>
              {loadingAgenceUsers ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-500">Chargement des utilisateurs...</span>
                </div>
              ) : agenceUsers.length > 0 ? (
                <div className="space-y-2">
                  {agenceUsers.map((user) => (
                    <div key={user.id || user._id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.prenom} {user.nom}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">Rôle: {user.role}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(user.id || user._id, `${user.prenom} ${user.nom}`)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Retirer de l'agence"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    Aucun utilisateur attribué à cette agence.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Utilisez le bouton "Attribuer un utilisateur" pour ajouter des utilisateurs.
                  </p>
                </div>
              )}
            </div>

            {selectedAgence.statut === 'en_attente' && (
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const id = selectedAgence.id || selectedAgence._id;
                    if (id) {
                      handleApprove(id);
                      setShowDetailModal(false);
                    }
                  }}
                  className="btn-primary"
                >
                  Approuver
                </button>
                <button
                  onClick={() => {
                    const id = selectedAgence.id || selectedAgence._id;
                    if (id) {
                      handleReject(id);
                      setShowDetailModal(false);
                    }
                  }}
                  className="btn-danger"
                >
                  Rejeter
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal gestion des modules */}
      <Modal
        isOpen={showModulesModal}
        onClose={() => setShowModulesModal(false)}
        title="Gestion des modules"
        size="lg"
      >
        {selectedAgence && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Sélectionnez les modules accessibles pour <strong>{selectedAgence.nom}</strong>
            </p>
            <div className="space-y-3">
              {/* Bouton Tout cocher/Tout décocher */}
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    if (!selectedAgence) return;
                    const allModuleIds = (Array.isArray(availableModules) ? availableModules : []).map(m => m.id);
                    const modulesChoisis = selectedAgence.modulesChoisis || [];
                    const allSelected = allModuleIds.every(id => modulesChoisis.includes(id));
                    setSelectedAgence({
                      ...selectedAgence,
                      modulesChoisis: allSelected ? [] : allModuleIds
                    });
                  }}
                >
                  {(() => {
                    if (!selectedAgence) return 'Tout cocher';
                    const allModuleIds = (Array.isArray(availableModules) ? availableModules : []).map(m => m.id);
                    const modulesChoisis = selectedAgence.modulesChoisis || [];
                    const allSelected = allModuleIds.every(id => modulesChoisis.includes(id));
                    return allSelected ? 'Tout décocher' : 'Tout cocher';
                  })()}
                </button>
              </div>
              {/* Grille responsive des modules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {(Array.isArray(availableModules) ? availableModules : []).map((module, index) => {
                  const modulesChoisis = selectedAgence.modulesChoisis || [];
                  const isChosen = modulesChoisis.includes(module.id);
                  return (
                    <div
                      key={module.id}
                      className={`flex items-start space-x-3 rounded p-1 border ${isChosen ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}`}
                    >
                      <input
                        type="checkbox"
                        id={module.id}
                        checked={isChosen}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          let updatedModules;
                          if (isChecked) {
                            updatedModules = [...new Set([...modulesChoisis, module.id])];
                          } else {
                            updatedModules = (modulesChoisis || []).filter(m => m !== module.id);
                          }
                          setSelectedAgence({
                            ...selectedAgence,
                            modulesChoisis: updatedModules
                          });
                        }}
                        className="mt-1"
                      />
                      <label htmlFor={module.id} className="flex-1">
                        <div className="flex items-center">
                          <p className="font-medium text-gray-900">{module.name}</p>
                          {module.essential && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              Essentiel
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{module.description}</p>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const id = selectedAgence.id || selectedAgence._id;
                  if (id) handleUpdateModules(id, selectedAgence.modulesChoisis || []);
                }}
                className="btn-primary"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setShowModulesModal(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal création agence */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
          resetUserForm();
        }}
        title="Nouvelle agence"
        size="lg"
      >
        <div className="space-y-6">
          {/* Informations de l'agence */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de l'agence</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'agence *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'activité *
                </label>
                <select
                  className="input-field"
                  value={formData.typeActivite}
                  onChange={(e) => setFormData(prev => ({ ...prev, typeActivite: e.target.value }))}
                  required
                >
                  <option value="agence-voyage">Agence de voyage</option>
                  <option value="tour-operateur">Tour opérateur</option>
                  <option value="receptif">Réceptif</option>
                  <option value="transport">Transport touristique</option>
                  <option value="hebergement">Hébergement</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.telephone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse *
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.adresse}
                onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Attribution d'utilisateur */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Attribution d'utilisateur</h3>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="existing"
                    checked={userAssignmentType === 'existing'}
                    onChange={(e) => setUserAssignmentType(e.target.value as 'existing' | 'new')}
                    className="mr-2"
                  />
                  <User className="w-4 h-4 mr-2" />
                  Attribuer à un utilisateur existant
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="new"
                    checked={userAssignmentType === 'new'}
                    onChange={(e) => setUserAssignmentType(e.target.value as 'existing' | 'new')}
                    className="mr-2"
                  />
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer un nouvel utilisateur
                </label>
              </div>

              {userAssignmentType === 'existing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner un utilisateur *
                  </label>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2 text-sm text-gray-500">Chargement des utilisateurs...</span>
                    </div>
                  ) : (
                    <select
                      className="input-field"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                    >
                      <option value="">Choisir un utilisateur</option>
                      {(Array.isArray(users) ? users : []).map(user => (
                        <option key={user.id || user._id} value={user.id || user._id}>
                          {user.prenom} {user.nom} ({user.email})
                        </option>
                      ))}
                    </select>
                  )}
                  {(Array.isArray(users) ? users : []).length === 0 && !loadingUsers && (
                    <p className="text-sm text-gray-500 mt-1">
                      Aucun utilisateur disponible. Créez un nouvel utilisateur.
                    </p>
                  )}
                </div>
              )}

              {userAssignmentType === 'new' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={newUserData.prenom}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, prenom: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={newUserData.nom}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, nom: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        className="input-field"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        className="input-field"
                        value={newUserData.telephone}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, telephone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modules actifs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modules actifs
            </label>
            <div className="space-y-3">
              {(Array.isArray(availableModules) ? availableModules : []).map((module, index) => (
                <div key={module.id} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={`create-${module.id}`}
                    checked={formData.modulesActifs.includes(module.id)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      const updatedModules = isChecked
                        ? [...formData.modulesActifs, module.id]
                        : (formData.modulesActifs || []).filter(m => m !== module.id);
                      
                      setFormData(prev => ({
                        ...prev,
                        modulesActifs: updatedModules
                      }));
                    }}
                    className="mt-1"
                  />
                  <label htmlFor={`create-${module.id}`} className="flex-1">
                    <div className="flex items-center">
                      <p className="font-medium text-gray-900">{module.name}</p>
                      {module.essential && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Essentiel
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{module.description}</p>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
                resetUserForm();
              }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateAgence}
              disabled={
                !formData.nom || 
                !formData.email || 
                !formData.telephone || 
                !formData.adresse ||
                (userAssignmentType === 'existing' && !selectedUserId) ||
                (userAssignmentType === 'new' && (!newUserData.prenom || !newUserData.nom || !newUserData.email || !newUserData.password))
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Créer l'agence
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal attribution d'utilisateur */}
      <Modal
        isOpen={showAssignUserModal}
        onClose={() => {
          setShowAssignUserModal(false);
          setSelectedAgenceForUser(null);
          setSelectedUserId('');
          resetUserForm();
        }}
        title="Attribuer un utilisateur"
        size="lg"
      >
        {selectedAgenceForUser && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                Attribution à l'agence : {selectedAgenceForUser.nom}
              </h3>
              <p className="text-sm text-blue-700">
                Choisissez d'attribuer un utilisateur existant ou de créer un nouvel utilisateur pour cette agence.
              </p>
            </div>

            {/* Type d'attribution */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="existing"
                    checked={userAssignmentType === 'existing'}
                    onChange={(e) => setUserAssignmentType(e.target.value as 'existing' | 'new')}
                    className="mr-2"
                  />
                  <User className="w-4 h-4 mr-2" />
                  Attribuer un utilisateur existant
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="new"
                    checked={userAssignmentType === 'new'}
                    onChange={(e) => setUserAssignmentType(e.target.value as 'existing' | 'new')}
                    className="mr-2"
                  />
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer un nouvel utilisateur
                </label>
              </div>

              {/* Attribution d'utilisateur existant */}
              {userAssignmentType === 'existing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner un utilisateur *
                  </label>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2 text-sm text-gray-500">Chargement des utilisateurs...</span>
                    </div>
                  ) : (
                    <select
                      className="input-field"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                    >
                      <option value="">Choisir un utilisateur</option>
                      {(Array.isArray(users) ? users : []).map(user => (
                        <option key={user.id || user._id} value={user.id || user._id}>
                          {user.prenom} {user.nom} ({user.email})
                        </option>
                      ))}
                    </select>
                  )}
                  {(Array.isArray(users) ? users : []).length === 0 && !loadingUsers && (
                    <p className="text-sm text-gray-500 mt-1">
                      Aucun utilisateur disponible. Créez un nouvel utilisateur.
                    </p>
                  )}
                </div>
              )}

              {/* Création d'un nouvel utilisateur */}
              {userAssignmentType === 'new' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={newUserData.prenom}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, prenom: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={newUserData.nom}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, nom: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        className="input-field"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        className="input-field"
                        value={newUserData.telephone}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, telephone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignUserModal(false);
                  setSelectedAgenceForUser(null);
                  setSelectedUserId('');
                  resetUserForm();
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignUser}
                disabled={
                  (userAssignmentType === 'existing' && !selectedUserId) ||
                  (userAssignmentType === 'new' && (!newUserData.prenom || !newUserData.nom || !newUserData.email || !newUserData.password))
                }
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {userAssignmentType === 'existing' ? 'Attribuer l\'utilisateur' : 'Créer et attribuer l\'utilisateur'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgencesListPage;