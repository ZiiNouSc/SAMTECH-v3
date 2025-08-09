import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Stamp, 
  Clock, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { visaAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import SearchFilter from '../../components/ui/SearchFilter';
import ViewToggle from '../../components/ui/ViewToggle';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import GridView from '../../components/ui/GridView';

// Types
interface VisaDemande {
  _id: string;
  numeroDossier?: string;
  clientId: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  paysDestination: string;
  typeVisa: string;
  dateDepart: string;
  dateRetour: string;
  dureeSejour: number;
  nombrePersonnes: number;
  prix: number;
  devise: string;
  fraisConsulaire: number;
  fraisService: number;
  statut: 'en_preparation' | 'soumis' | 'en_cours' | 'approuve' | 'refuse' | 'annule';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const VisaListPage: React.FC = () => {
  const [demandes, setDemandes] = useState<VisaDemande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'table' | 'grid' | 'list'>('table');
  const [selectedDemande, setSelectedDemande] = useState<VisaDemande | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const { hasPermission } = usePermissions();

  const filterOptions = [
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'en_preparation', label: 'En préparation' },
        { value: 'soumis', label: 'Soumis' },
        { value: 'en_cours', label: 'En cours' },
        { value: 'approuve', label: 'Approuvé' },
        { value: 'refuse', label: 'Refusé' },
        { value: 'annule', label: 'Annulé' }
      ]
    },
    {
      id: 'pays',
      label: 'Pays',
      options: [
        { value: 'france', label: 'France' },
        { value: 'royaume-uni', label: 'Royaume-Uni' },
        { value: 'etats-unis', label: 'États-Unis' },
        { value: 'canada', label: 'Canada' },
        { value: 'espagne', label: 'Espagne' }
      ]
    },
    {
      id: 'typeVisa',
      label: 'Type de visa',
      options: [
        { value: 'tourisme', label: 'Tourisme' },
        { value: 'affaires', label: 'Affaires' },
        { value: 'etudes', label: 'Études' },
        { value: 'travail', label: 'Travail' }
      ]
    }
  ];

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const response = await visaAPI.getAll();
      setDemandes(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes de visa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await visaAPI.delete(id);
      setDemandes(prev => prev.filter(d => d._id !== id));
      setShowDeleteModal(false);
      setSelectedDemande(null);
    } catch (error) {
      console.error('Erreur lors de la suppression de la demande de visa:', error);
    }
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const filteredDemandes = demandes.filter(demande => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      demande.numeroDossier?.toLowerCase().includes(searchLower) ||
      demande.clientId?.nom?.toLowerCase().includes(searchLower) ||
      demande.paysDestination.toLowerCase().includes(searchLower) ||
      demande.typeVisa.toLowerCase().includes(searchLower)
    );

    const statutFilter = activeFilters.statut;
    const paysFilter = activeFilters.pays;
    const typeVisaFilter = activeFilters.typeVisa;

    const matchesStatut = !statutFilter || statutFilter === 'tous' || demande.statut === statutFilter;
    const matchesPays = !paysFilter || paysFilter === 'tous' || 
                        demande.paysDestination.toLowerCase().includes(paysFilter.toLowerCase());
    const matchesTypeVisa = !typeVisaFilter || typeVisaFilter === 'tous' || 
                            demande.typeVisa.toLowerCase() === typeVisaFilter.toLowerCase();

    return matchesSearch && matchesStatut && matchesPays && matchesTypeVisa;
  });

  const stats = {
    total: demandes.length,
    enPreparation: demandes.filter(d => d.statut === 'en_preparation').length,
    approuves: demandes.filter(d => d.statut === 'approuve').length,
    refuses: demandes.filter(d => d.statut === 'refuse').length
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_preparation':
        return <Badge variant="default">En préparation</Badge>;
      case 'soumis':
        return <Badge variant="info">Soumis</Badge>;
      case 'en_cours':
        return <Badge variant="warning">En cours</Badge>;
      case 'approuve':
        return <Badge variant="success">Approuvé</Badge>;
      case 'refuse':
        return <Badge variant="danger">Refusé</Badge>;
      case 'annule':
        return <Badge variant="purple">Annulé</Badge>;
      default:
        return <Badge variant="default">{statut}</Badge>;
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en_preparation':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'soumis':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'en_cours':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approuve':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'refuse':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'annule':
        return <XCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderDemandeCard = (demande: VisaDemande) => (
    <Card key={demande._id} hover className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center">
            <Stamp className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900">{demande.numeroDossier || demande._id}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">{demande.paysDestination} - {demande.typeVisa}</p>
          <div className="mt-2 flex items-center">
            {getStatutIcon(demande.statut)}
            <span className="ml-2">{getStatutBadge(demande.statut)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          {/* <User className="w-4 h-4 mr-2" /> */}
          {demande.clientId?.nom} {demande.clientId?.prenom}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          {/* <Calendar className="w-4 h-4 mr-2" /> */}
          Validité: {new Date(demande.dateDepart).toLocaleDateString('fr-FR')} - {new Date(demande.dateRetour).toLocaleDateString('fr-FR')}
        </div>
        {demande.dureeSejour && (
          <div className="flex items-center text-sm text-gray-600">
            {/* <Clock className="w-4 h-4 mr-2" /> */}
            Durée de séjour: {demande.dureeSejour} jour{demande.dureeSejour > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm">
          <span className="text-gray-600">Montant: </span>
          <span className="font-medium text-gray-900">{(demande.prix || 0).toLocaleString('fr-FR')} {demande.devise}</span>
        </div>
        <div className="text-lg font-semibold text-blue-600">
          {(demande.prix || 0).toLocaleString('fr-FR')} {demande.devise}
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={() => {
            setSelectedDemande(demande);
            setShowDetailModal(true);
          }}
          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          title="Voir les détails"
        >
          <Eye className="w-4 h-4" />
        </button>
        
        {hasPermission('visa', 'modifier') && (
          <Link
            to={`/visa/${demande._id}/modifier`}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </Link>
        )}

        {hasPermission('visa', 'supprimer') && (
          <button
            onClick={() => {
              setSelectedDemande(demande);
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
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Demandes de Visa</h1>
          <p className="text-gray-600">Gérer vos demandes de visa</p>
        </div>
        {hasPermission('visa', 'creer') && (
          <Link to="/visa/nouveau" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle Demande
          </Link>
        )}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total demandes"
          value={stats.total}
          icon={Stamp}
          color="blue"
        />
        <StatCard
          title="En préparation"
          value={stats.enPreparation}
          icon={Clock}
          color="gray"
        />
        <StatCard
          title="Approuvés"
          value={stats.approuves}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Refusés"
          value={stats.refuses}
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
        placeholder="Rechercher une demande de visa..."
      />

      {/* Contrôles de vue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {filteredDemandes.length} demande{filteredDemandes.length > 1 ? 's' : ''} trouvée{filteredDemandes.length > 1 ? 's' : ''}
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
                <TableHeaderCell>Pays / Type</TableHeaderCell>
                <TableHeaderCell>Dates</TableHeaderCell>
                <TableHeaderCell>Montant</TableHeaderCell>
                <TableHeaderCell>Statut</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDemandes.map((demande) => (
                <TableRow key={demande._id}>
                  <TableCell>
                    <span className="font-medium text-gray-900">{demande.numeroDossier || demande._id}</span>
                  </TableCell>
                  <TableCell>{demande.clientId?.nom} {demande.clientId?.prenom}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{demande.paysDestination}</p>
                      <p className="text-sm text-gray-500">{demande.typeVisa}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-gray-900">
                        Validité: {new Date(demande.dateDepart).toLocaleDateString('fr-FR')} au {new Date(demande.dateRetour).toLocaleDateString('fr-FR')}
                      </p>
                      {demande.dureeSejour && (
                        <p className="text-sm text-gray-500">
                          Durée: {demande.dureeSejour} jour{demande.dureeSejour > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{(demande.prix || 0).toLocaleString('fr-FR')} {demande.devise}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatutIcon(demande.statut)}
                      <span className="ml-2">{getStatutBadge(demande.statut)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDemande(demande);
                          setShowDetailModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {hasPermission('visa', 'modifier') && (
                        <Link
                          to={`/visa/${demande._id}/modifier`}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}

                      {hasPermission('visa', 'supprimer') && (
                        <button
                          onClick={() => {
                            setSelectedDemande(demande);
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
          {filteredDemandes.map(renderDemandeCard)}
        </GridView>
      )}

      {/* Modal détails demande */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails de la demande de visa"
        size="lg"
      >
        {selectedDemande && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Référence
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{selectedDemande.numeroDossier || selectedDemande._id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <p className="text-sm text-gray-900">{selectedDemande.clientId?.nom} {selectedDemande.clientId?.prenom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays
                  </label>
                  <p className="text-sm text-gray-900">{selectedDemande.paysDestination}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de visa
                  </label>
                  <p className="text-sm text-gray-900">{selectedDemande.typeVisa}</p>
                </div>
                {selectedDemande.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {selectedDemande.notes}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de départ
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedDemande.dateDepart).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de retour
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedDemande.dateRetour).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {selectedDemande.dureeSejour && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée de séjour
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedDemande.dureeSejour} jour{selectedDemande.dureeSejour > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant total
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {(selectedDemande.prix || 0).toLocaleString('fr-FR')} {selectedDemande.devise}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <div className="flex items-center mt-1">
                  {getStatutIcon(selectedDemande.statut)}
                  <span className="ml-2">{getStatutBadge(selectedDemande.statut)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frais consulaire
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {(selectedDemande.fraisConsulaire || 0).toLocaleString('fr-FR')} {selectedDemande.devise}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frais service
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {(selectedDemande.fraisService || 0).toLocaleString('fr-FR')} {selectedDemande.devise}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {hasPermission('visa', 'modifier') && (
                <Link
                  to={`/visa/${selectedDemande._id}/modifier`}
                  className="btn-secondary"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Link>
              )}
              <button className="btn-primary">
                <Download className="w-4 h-4 mr-2" />
                Télécharger le récépissé
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
        {selectedDemande && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer la demande de visa <strong>{selectedDemande.numeroDossier || selectedDemande._id}</strong> ?
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
                onClick={() => handleDelete(selectedDemande._id)}
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

export default VisaListPage;