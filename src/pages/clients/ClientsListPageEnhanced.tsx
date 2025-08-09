import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Users,
  Building2,
  MapPin,
  Euro,
  Calendar,
  Filter,
  Download,
  Upload
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
import EmptyState from '../../components/ui/EmptyState';
import { Client } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { clientsAPI } from '../../services/api';
import { formatMontantCurrency } from '../../utils/formatters';

const ClientsListPageEnhanced: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'table' | 'grid' | 'list'>('table');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const { hasPermission } = usePermissions();

  const filterOptions = [
    {
      id: 'typeClient',
      label: 'Type de client',
      options: [
        { value: 'particulier', label: 'Particulier' },
        { value: 'entreprise', label: 'Entreprise' },
        { value: 'partenaire', label: 'Partenaire' }
      ]
    },
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'actif', label: 'Actif' },
        { value: 'inactif', label: 'Inactif' },
        { value: 'suspendu', label: 'Suspendu' }
      ]
    },
    {
      id: 'solde',
      label: 'Solde',
      options: [
        { value: 'positif', label: 'Solde positif' },
        { value: 'negatif', label: 'Solde négatif' },
        { value: 'nul', label: 'Solde nul' }
      ]
    },
    {
      id: 'activite',
      label: 'Activité récente',
      options: [
        { value: '7j', label: '7 derniers jours' },
        { value: '30j', label: '30 derniers jours' },
        { value: '90j', label: '90 derniers jours' }
      ]
    }
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getAll();
      // Le backend retourne { success: true, data: [...], count: 3 }
      // Donc on doit accéder à response.data.data
      const clientsData = response.data?.data || response.data || [];
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setActionLoading(true);
      const response = await clientsAPI.exportExcel();
      
      // Créer un lien pour télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `clients_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export: ' + (error.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!clientId) {
      console.error('Client ID is undefined');
      return;
    }
    
    try {
      setActionLoading(true);
      await clientsAPI.delete(clientId);
      setClients(prev => (Array.isArray(prev) ? prev : []).filter(client => client.id !== clientId));
      setShowDeleteModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression: ' + ((error as any).response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const filteredClients = (Array.isArray(clients) ? clients : []).filter(client => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      client.nom.toLowerCase().includes(searchLower) ||
      (client.prenom && client.prenom.toLowerCase().includes(searchLower)) ||
      (client.entreprise && client.entreprise.toLowerCase().includes(searchLower)) ||
      client.email.toLowerCase().includes(searchLower)
    );

    // Filtres
    const typeClientFilter = activeFilters.typeClient;
    const statutFilter = activeFilters.statut;
    const soldeFilter = activeFilters.solde;

    let matchesTypeClient = true;
    if (typeClientFilter && typeClientFilter !== 'tous') {
      matchesTypeClient = client.typeClient === typeClientFilter;
    }

    let matchesStatut = true;
    if (statutFilter && statutFilter !== 'tous') {
      matchesStatut = client.statut === statutFilter;
    }

    let matchesSolde = true;
    if (soldeFilter && soldeFilter !== 'tous') {
      switch (soldeFilter) {
        case 'positif':
          matchesSolde = client.solde > 0;
          break;
        case 'negatif':
          matchesSolde = client.solde < 0;
          break;
        case 'nul':
          matchesSolde = client.solde === 0;
          break;
      }
    }

    return matchesSearch && matchesTypeClient && matchesStatut && matchesSolde;
  });

  const stats = {
    total: (Array.isArray(clients) ? clients : []).length,
    particuliers: (Array.isArray(clients) ? clients : []).filter(c => c.typeClient === 'particulier').length,
    entreprises: (Array.isArray(clients) ? clients : []).filter(c => c.typeClient === 'entreprise').length,
    partenaires: (Array.isArray(clients) ? clients : []).filter(c => c.typeClient === 'partenaire').length,
    actifs: (Array.isArray(clients) ? clients : []).filter(c => c.statut === 'actif').length,
    soldePositif: (Array.isArray(clients) ? clients : []).filter(c => c.solde > 0).length,
    soldeNegatif: (Array.isArray(clients) ? clients : []).filter(c => c.solde < 0).length,
    totalSolde: (Array.isArray(clients) ? clients : []).reduce((sum, c) => sum + c.solde, 0)
  };

  const getTypeClientBadge = (typeClient: string) => {
    const typeConfig = {
      particulier: { variant: 'default' as const, label: 'Particulier' },
      entreprise: { variant: 'info' as const, label: 'Entreprise' },
      partenaire: { variant: 'warning' as const, label: 'Partenaire' }
    };
    
    const config = typeConfig[typeClient as keyof typeof typeConfig] || typeConfig.particulier;
    return (
      <Badge variant={config.variant} size="sm">
        {config.label}
      </Badge>
    );
  };

  const renderClientCard = (client: Client) => (
    <Card key={client.id} hover className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            {client.typeClient === 'entreprise' || client.typeClient === 'partenaire' ? (
              <Building2 className="w-6 h-6 text-blue-600" />
            ) : (
              <Users className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {client.entreprise || `${client.prenom} ${client.nom}`}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {getTypeClientBadge(client.typeClient)}
              <Badge 
                variant={
                  client.solde > 0 ? 'success' :
                  client.solde < 0 ? 'danger' : 'default'
                }
                size="sm"
              >
                {formatMontantCurrency(client.solde)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-2" />
          {client.email}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-2" />
          {client.telephone}
        </div>
        <div className="flex items-start text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{client.adresse}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1 inline" />
          {new Date(client.dateCreation).toLocaleDateString('fr-FR')}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedClient(client);
              setShowDetailModal(true);
            }}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {hasPermission('clients', 'modifier') && client.id && (
            <Link
              to={`/clients/${client.id}/modifier`}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </Link>
          )}

          {hasPermission('clients', 'supprimer') && client.id && (
            <button
              onClick={() => {
                setSelectedClient(client);
                setShowDeleteModal(true);
              }}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );

  const renderClientListItem = (client: Client) => (
    <Card key={client.id} padding="sm" className="hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            {client.entreprise ? (
              <Building2 className="w-5 h-5 text-blue-600" />
            ) : (
              <Users className="w-5 h-5 text-blue-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h3 className="font-medium text-gray-900 truncate">
                {client.entreprise || `${client.prenom} ${client.nom}`}
              </h3>
              {getTypeClientBadge(client.typeClient)}
              <Badge 
                variant={
                  client.solde > 0 ? 'success' :
                  client.solde < 0 ? 'danger' : 'default'
                }
                size="sm"
              >
                {formatMontantCurrency(client.solde)}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-600">{client.email}</span>
              <span className="text-sm text-gray-600">{client.telephone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedClient(client);
              setShowDetailModal(true);
            }}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {hasPermission('clients', 'modifier') && client.id && (
            <Link
              to={`/clients/${client.id}/modifier`}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </Link>
          )}

          {hasPermission('clients', 'supprimer') && client.id && (
            <button
              onClick={() => {
                setSelectedClient(client);
                setShowDeleteModal(true);
              }}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
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
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Gestion des Clients</h1>
          <p className="text-gray-600">Gérer votre base de clients</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowImportModal(true)}
            className="btn-secondary"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </button>
          {hasPermission('clients', 'creer') && (
            <Link to="/clients/nouveau" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nouveau Client
            </Link>
          )}
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total clients"
          value={stats.total}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Particuliers"
          value={stats.particuliers}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Entreprises"
          value={stats.entreprises}
          icon={Building2}
          color="purple"
        />
        <StatCard
          title="Agences de voyage"
          value={stats.partenaires}
          icon={Building2}
          color="yellow"
        />
        <StatCard
          title="Solde total"
          value={formatMontantCurrency(stats.totalSolde)}
          icon={Euro}
          color={(stats.totalSolde || 0) >= 0 ? 'green' : 'red'}
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
        placeholder="Rechercher un client..."
      />

      {/* Contrôles de vue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {(Array.isArray(filteredClients) ? filteredClients : []).length} client{(Array.isArray(filteredClients) ? filteredClients : []).length > 1 ? 's' : ''} trouvé{(Array.isArray(filteredClients) ? filteredClients : []).length > 1 ? 's' : ''}
          </span>
        </div>
        <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Contenu principal */}
      {(Array.isArray(filteredClients) ? filteredClients : []).length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client trouvé"
          description="Aucun client ne correspond à vos critères de recherche. Essayez de modifier vos filtres ou ajoutez un nouveau client."
          action={hasPermission('clients', 'creer') ? {
            label: "Ajouter un client",
            onClick: () => window.location.href = '/clients/nouveau'
          } : undefined}
        />
      ) : (
        <>
          {currentView === 'table' && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow key="header">
                    <TableHeaderCell>Client</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Contact</TableHeaderCell>
                    <TableHeaderCell>Solde</TableHeaderCell>
                    <TableHeaderCell>Date création</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(filteredClients) ? filteredClients : []).map((client, index) => (
                    <TableRow key={client.id || `client-${index}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            {client.entreprise ? (
                              <Building2 className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Users className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {client.entreprise || `${client.prenom} ${client.nom}`}
                            </p>
                            <p className="text-sm text-gray-500">{client.adresse}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTypeClientBadge(client.typeClient)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {client.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {client.telephone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            client.solde > 0 ? 'success' :
                            client.solde < 0 ? 'danger' : 'default'
                          }
                        >
                          {formatMontantCurrency(client.solde)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(client.dateCreation).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setShowDetailModal(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {hasPermission('clients', 'modifier') && client.id && (
                            <Link
                              to={`/clients/${client.id}/modifier`}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          )}

                          {hasPermission('clients', 'supprimer') && client.id && (
                            <button
                              onClick={() => {
                                setSelectedClient(client);
                                setShowDeleteModal(true);
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {currentView === 'grid' && (
            <GridView columns={3}>
              {(Array.isArray(filteredClients) ? filteredClients : []).map(renderClientCard)}
            </GridView>
          )}

          {currentView === 'list' && (
            <ListView>
              {(Array.isArray(filteredClients) ? filteredClients : []).map(renderClientListItem)}
            </ListView>
          )}
        </>
      )}

      {/* Modal détails client */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails du client"
        size="lg"
      >
        {selectedClient && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedClient.entreprise ? 'Entreprise' : 'Nom complet'}
                </label>
                <p className="text-sm text-gray-900">
                  {selectedClient.entreprise || `${selectedClient.prenom} ${selectedClient.nom}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de client
                </label>
                <div>
                  {getTypeClientBadge(selectedClient.typeClient)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-sm text-gray-900">{selectedClient.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <p className="text-sm text-gray-900">{selectedClient.telephone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <Badge 
                  variant={
                    selectedClient.statut === 'actif' ? 'success' :
                    selectedClient.statut === 'suspendu' ? 'danger' : 'default'
                  }
                >
                  {selectedClient.statut === 'actif' ? 'Actif' :
                   selectedClient.statut === 'suspendu' ? 'Suspendu' : 'Inactif'}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solde
                </label>
                <Badge 
                  variant={
                    selectedClient.solde > 0 ? 'success' :
                    selectedClient.solde < 0 ? 'danger' : 'default'
                  }
                >
                  {formatMontantCurrency(selectedClient.solde)}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <p className="text-sm text-gray-900">{selectedClient.adresse}</p>
            </div>

            {selectedClient.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <p className="text-sm text-gray-900">{selectedClient.notes}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              {(selectedClient.id || selectedClient._id) && (
                <Link
                  to={`/clients/${selectedClient.id || selectedClient._id}`}
                  className="btn-primary px-6 py-2 text-lg font-semibold shadow-lg rounded-md"
                  style={{ minWidth: 220 }}
                >
                  Voir le profil complet
                </Link>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
      >
        {selectedClient && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer le client{' '}
              <strong>
                {selectedClient.entreprise || `${selectedClient.prenom} ${selectedClient.nom}`}
              </strong> ?
            </p>
            <p className="text-sm text-red-600">
              Cette action est irréversible.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => selectedClient.id && handleDelete(selectedClient.id)}
                disabled={actionLoading}
                className="btn-danger"
              >
                {actionLoading ? <LoadingSpinner size="sm" className="mr-2" /> : 'Supprimer'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal import */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importer des clients"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Importer vos clients
            </h3>
            <p className="text-gray-600 mb-6">
              Téléchargez un fichier CSV ou Excel contenant vos données clients
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Cliquez pour sélectionner un fichier ou glissez-déposez
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Formats supportés: CSV, Excel (.xlsx, .xls)
              </p>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Format attendu</h4>
            <p className="text-sm text-blue-700 mb-2">
              Votre fichier doit contenir les colonnes suivantes :
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside">
              <li>nom (obligatoire)</li>
              <li>prenom</li>
              <li>entreprise</li>
              <li>typeClient (particulier, entreprise, partenaire)</li>
              <li>email</li>
              <li>telephone (obligatoire)</li>
              <li>adresse</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowImportModal(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button className="btn-primary">
              Télécharger le modèle
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientsListPageEnhanced;