import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Shield,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import { assuranceAPI } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ViewToggle from '../../components/ui/ViewToggle';
import GridView from '../../components/ui/GridView';
import SearchFilter from '../../components/ui/SearchFilter';
import StatCard from '../../components/ui/StatCard';
import { usePermissions } from '../../hooks/usePermissions';

interface Assurance {
  _id: string;
  clientId: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  compagnieAssurance: string;
  typeAssurance: string;
  paysDestination: string;
  dateDepart: string;
  dateRetour: string;
  nombrePersonnes: number;
  montantAssure: number;
  prime: number;
  devise: string;
  statut: string;
  numeroPolice: string;
  dateEmission: string;
  conditions: string;
  exclusions: string;
  notes: string;
  agentId: {
    nom: string;
    prenom: string;
  };
}

const AssuranceListPage: React.FC = () => {
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'table' | 'grid' | 'list'>('table');
  const [selectedAssurance, setSelectedAssurance] = useState<Assurance | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const { hasPermission } = usePermissions();

  const filterOptions = [
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'tous', label: 'Tous les statuts' },
        { value: 'en_attente', label: 'En attente' },
        { value: 'active', label: 'Active' },
        { value: 'expiree', label: 'Expirée' },
        { value: 'annulee', label: 'Annulée' },
        { value: 'resiliee', label: 'Résiliée' }
      ]
    },
    {
      id: 'typeAssurance',
      label: 'Type d\'assurance',
      options: [
        { value: 'tous', label: 'Tous les types' },
        { value: 'voyage', label: 'Voyage' },
        { value: 'medicale', label: 'Médicale' },
        { value: 'annulation', label: 'Annulation' },
        { value: 'bagages', label: 'Bagages' },
        { value: 'responsabilite_civile', label: 'Responsabilité civile' },
        { value: 'comprehensive', label: 'Comprehensive' }
      ]
    }
  ];

  useEffect(() => {
    fetchAssurances();
  }, []);

  const fetchAssurances = async () => {
    try {
      setLoading(true);
      const response = await assuranceAPI.getAll();
      setAssurances(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des assurances:', error);
      alert('Erreur lors du chargement des assurances');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await assuranceAPI.delete(id);
      alert('Assurance supprimée avec succès');
      fetchAssurances();
      setShowDeleteModal(false);
      setSelectedAssurance(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const filteredAssurances = assurances.filter(assurance => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      assurance.numeroPolice.toLowerCase().includes(searchLower) ||
      assurance.clientId.nom.toLowerCase().includes(searchLower) ||
      assurance.typeAssurance.toLowerCase().includes(searchLower) ||
      assurance.paysDestination.toLowerCase().includes(searchLower)
    );

    const statutFilter = activeFilters.statut;
    const typeAssuranceFilter = activeFilters.typeAssurance;

    const matchesStatut = !statutFilter || statutFilter === 'tous' || assurance.statut === statutFilter;
    const matchesTypeAssurance = !typeAssuranceFilter || typeAssuranceFilter === 'tous' || 
                                assurance.typeAssurance.toLowerCase() === typeAssuranceFilter.toLowerCase();

    return matchesSearch && matchesStatut && matchesTypeAssurance;
  });

  const stats = {
    total: assurances.length,
    enAttente: assurances.filter(a => a.statut === 'en_attente').length,
    actives: assurances.filter(a => a.statut === 'active').length,
    expirees: assurances.filter(a => a.statut === 'expiree' || a.statut === 'annulee').length
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return <Badge variant="warning">En attente</Badge>;
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'expiree':
        return <Badge variant="default">Expirée</Badge>;
      case 'annulee':
        return <Badge variant="danger">Annulée</Badge>;
      case 'resiliee':
        return <Badge variant="danger">Résiliée</Badge>;
      default:
        return <Badge variant="default">{statut}</Badge>;
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expiree':
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      case 'annulee':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'resiliee':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderAssuranceCard = (assurance: Assurance) => (
    <Card key={assurance._id} hover className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900">{assurance.numeroPolice}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">{assurance.typeAssurance} - {assurance.paysDestination}</p>
          <div className="mt-2 flex items-center">
            {getStatutIcon(assurance.statut)}
            <span className="ml-2">{getStatutBadge(assurance.statut)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2" />
          {assurance.clientId.nom} {assurance.clientId.prenom}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          Validité: {new Date(assurance.dateDepart).toLocaleDateString('fr-FR')} - {new Date(assurance.dateRetour).toLocaleDateString('fr-FR')}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm">
          <span className="text-gray-600">Création: </span>
          <span className="font-medium text-gray-900">{new Date(assurance.dateEmission).toLocaleDateString('fr-FR')}</span>
        </div>
        <div className="text-lg font-semibold text-blue-600">
          {assurance.prime.toLocaleString('fr-FR')} {assurance.devise}
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={() => {
            setSelectedAssurance(assurance);
            setShowDetailModal(true);
          }}
          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          title="Voir les détails"
        >
          <Eye className="w-4 h-4" />
        </button>
        
        {hasPermission('assurance', 'modifier') && (
          <Link
            to={`/assurance/${assurance._id}/modifier`}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </Link>
        )}

        {hasPermission('assurance', 'supprimer') && (
          <button
            onClick={() => {
              setSelectedAssurance(assurance);
              setShowDeleteModal(true);
            }}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
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
      {/* Header harmonisé */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Assurances</h1>
          <p className="text-gray-600">Gérer vos contrats d'assurance</p>
        </div>
        {hasPermission('assurance', 'creer') && (
          <Link to="/assurance/nouveau" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle Assurance
          </Link>
        )}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total assurances"
          value={stats.total}
          icon={Shield}
          color="blue"
        />
        <StatCard
          title="En attente"
          value={stats.enAttente}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Actives"
          value={stats.actives}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Expirées/Annulées"
          value={stats.expirees}
          icon={XCircle}
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
        placeholder="Rechercher une assurance..."
      />

      {/* Contrôles de vue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {filteredAssurances.length} assurance{filteredAssurances.length > 1 ? 's' : ''} trouvée{filteredAssurances.length > 1 ? 's' : ''}
          </span>
        </div>
        <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Contenu principal */}
      {currentView === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Référence</TableHeaderCell>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Type / Destination</TableHeaderCell>
                <TableHeaderCell>Dates</TableHeaderCell>
                <TableHeaderCell>Montant</TableHeaderCell>
                <TableHeaderCell>Statut</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssurances.map((assurance) => (
                <TableRow key={assurance._id}>
                  <TableCell>
                    <span className="font-medium text-gray-900">{assurance.numeroPolice}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{assurance.clientId.nom} {assurance.clientId.prenom}</p>
                      <p className="text-sm text-gray-500">{assurance.nombrePersonnes} personne{assurance.nombrePersonnes > 1 ? 's' : ''}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{assurance.typeAssurance}</p>
                      <p className="text-sm text-gray-500">{assurance.paysDestination}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-gray-900">
                        Du {new Date(assurance.dateDepart).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm text-gray-500">
                        au {new Date(assurance.dateRetour).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{assurance.prime.toLocaleString('fr-FR')} {assurance.devise}</p>
                      <p className="text-sm text-gray-500">
                        Montant: {assurance.montantAssure.toLocaleString('fr-FR')} {assurance.devise}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatutIcon(assurance.statut)}
                      <span className="ml-2">{getStatutBadge(assurance.statut)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAssurance(assurance);
                          setShowDetailModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {hasPermission('assurance', 'modifier') && (
                        <Link
                          to={`/assurance/${assurance._id}/modifier`}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}

                      {hasPermission('assurance', 'supprimer') && (
                        <button
                          onClick={() => {
                            setSelectedAssurance(assurance);
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
          {filteredAssurances.map(renderAssuranceCard)}
        </GridView>
      )}

      {/* Modal détails assurance */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails de l'assurance"
        size="lg"
      >
        {selectedAssurance && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Référence
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{selectedAssurance.numeroPolice}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <p className="text-sm text-gray-900">{selectedAssurance.clientId.nom} {selectedAssurance.clientId.prenom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'assurance
                  </label>
                  <p className="text-sm text-gray-900">{selectedAssurance.typeAssurance}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination
                  </label>
                  <p className="text-sm text-gray-900">{selectedAssurance.paysDestination}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedAssurance.dateDepart).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedAssurance.dateRetour).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre d'assurés
                  </label>
                  <p className="text-sm text-gray-900">{selectedAssurance.nombrePersonnes}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de création
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedAssurance.dateEmission).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prime
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedAssurance.prime.toLocaleString('fr-FR')} {selectedAssurance.devise}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant assuré
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedAssurance.montantAssure.toLocaleString('fr-FR')} {selectedAssurance.devise}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <div className="flex items-center mt-1">
                {getStatutIcon(selectedAssurance.statut)}
                <span className="ml-2">{getStatutBadge(selectedAssurance.statut)}</span>
              </div>
            </div>

            {selectedAssurance.conditions && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conditions
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedAssurance.conditions}
                </p>
              </div>
            )}

            {selectedAssurance.exclusions && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exclusions
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedAssurance.exclusions}
                </p>
              </div>
            )}

            {selectedAssurance.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedAssurance.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              {hasPermission('assurance', 'modifier') && (
                <Link
                  to={`/assurance/${selectedAssurance._id}/modifier`}
                  className="btn-secondary"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Link>
              )}
              <button className="btn-primary">
                <FileText className="w-4 h-4 mr-2" />
                Télécharger le contrat
              </button>
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
        {selectedAssurance && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer l'assurance <strong>{selectedAssurance.numeroPolice}</strong> ?
            </p>
            <p className="text-sm text-red-600">
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(selectedAssurance._id)}
                className="btn-danger"
              >
                Supprimer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssuranceListPage;