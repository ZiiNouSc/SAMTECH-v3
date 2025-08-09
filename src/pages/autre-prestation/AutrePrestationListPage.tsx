import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  PlusCircle,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ViewToggle from '../../components/ui/ViewToggle';
import GridView from '../../components/ui/GridView';
import Card from '../../components/ui/Card';
import SearchFilter from '../../components/ui/SearchFilter';
import StatCard from '../../components/ui/StatCard';
import { usePermissions } from '../../hooks/usePermissions';

// Types
interface AutrePrestation {
  id: string;
  reference: string;
  clientId: string;
  clientNom: string;
  nomPrestation: string;
  description: string;
  dateDebut: string;
  dateFin?: string;
  statut: 'en_cours' | 'terminee' | 'annulee';
  prixAchat: number;
  prixVente: number;
  montantPaye: number;
  dateCreation: string;
  notes?: string;
  fournisseur?: string;
}

const AutrePrestationListPage: React.FC = () => {
  const [prestations, setPrestations] = useState<AutrePrestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'table' | 'grid' | 'list'>('table');
  const [selectedPrestation, setSelectedPrestation] = useState<AutrePrestation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const { hasPermission } = usePermissions();

  const filterOptions = [
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'en_cours', label: 'En cours' },
        { value: 'terminee', label: 'Terminée' },
        { value: 'annulee', label: 'Annulée' }
      ]
    }
  ];

  useEffect(() => {
    fetchPrestations();
  }, []);

  const fetchPrestations = async () => {
    try {
      setLoading(true);
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Données fictives pour la démo
      const mockData: AutrePrestation[] = [
        {
          id: '1',
          reference: 'AP-2024001',
          clientId: '1',
          clientNom: 'Martin Dubois',
          nomPrestation: 'Location de voiture',
          description: 'Location d\'une voiture de catégorie B pour 7 jours',
          dateDebut: '2024-06-15',
          dateFin: '2024-06-22',
          statut: 'en_cours',
          prixAchat: 350,
          prixVente: 450,
          montantPaye: 450,
          dateCreation: '2024-05-01',
          fournisseur: 'Hertz'
        },
        {
          id: '2',
          reference: 'AP-2024002',
          clientId: '2',
          clientNom: 'Sophie Martin',
          nomPrestation: 'Transfert aéroport',
          description: 'Transfert privé de l\'aéroport à l\'hôtel',
          dateDebut: '2024-07-01',
          statut: 'terminee',
          prixAchat: 80,
          prixVente: 120,
          montantPaye: 120,
          dateCreation: '2024-05-05',
          fournisseur: 'Paris Shuttle'
        },
        {
          id: '3',
          reference: 'AP-2024003',
          clientId: '3',
          clientNom: 'Entreprise ABC',
          nomPrestation: 'Salle de conférence',
          description: 'Location d\'une salle de conférence pour 20 personnes',
          dateDebut: '2024-06-20',
          dateFin: '2024-06-20',
          statut: 'annulee',
          prixAchat: 500,
          prixVente: 650,
          montantPaye: 325,
          dateCreation: '2024-04-15',
          notes: 'Annulation due à un changement de planning',
          fournisseur: 'Hôtel Mercure'
        },
        {
          id: '4',
          reference: 'AP-2024004',
          clientId: '4',
          clientNom: 'Jean Dupont',
          nomPrestation: 'Guide touristique',
          description: 'Service de guide touristique privé pour 2 jours',
          dateDebut: '2024-08-10',
          dateFin: '2024-08-11',
          statut: 'en_cours',
          prixAchat: 200,
          prixVente: 300,
          montantPaye: 150,
          dateCreation: '2024-05-10',
          fournisseur: 'Paris Tours'
        },
        {
          id: '5',
          reference: 'AP-2024005',
          clientId: '5',
          clientNom: 'Marie Leroy',
          nomPrestation: 'Excursion journée',
          description: 'Excursion d\'une journée au Mont Saint-Michel',
          dateDebut: '2024-07-15',
          statut: 'terminee',
          prixAchat: 150,
          prixVente: 220,
          montantPaye: 220,
          dateCreation: '2024-04-20',
          fournisseur: 'France Excursions'
        }
      ];
      
      setPrestations(mockData);
    } catch (error) {
      console.error('Erreur lors du chargement des prestations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Simuler la suppression
    setPrestations(prev => prev.filter(p => p.id !== id));
    setShowDeleteModal(false);
    setSelectedPrestation(null);
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const filteredPrestations = prestations.filter(prestation => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      prestation.reference.toLowerCase().includes(searchLower) ||
      prestation.clientNom.toLowerCase().includes(searchLower) ||
      prestation.nomPrestation.toLowerCase().includes(searchLower) ||
      prestation.description.toLowerCase().includes(searchLower) ||
      (prestation.fournisseur && prestation.fournisseur.toLowerCase().includes(searchLower))
    );

    const statutFilter = activeFilters.statut;

    const matchesStatut = !statutFilter || statutFilter === 'tous' || prestation.statut === statutFilter;

    return matchesSearch && matchesStatut;
  });

  const stats = {
    total: prestations.length,
    enCours: prestations.filter(p => p.statut === 'en_cours').length,
    terminees: prestations.filter(p => p.statut === 'terminee').length,
    annulees: prestations.filter(p => p.statut === 'annulee').length,
    chiffreAffaires: prestations.reduce((sum, p) => sum + p.prixVente, 0),
    marge: prestations.reduce((sum, p) => sum + (p.prixVente - p.prixAchat), 0)
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return <Badge variant="info">En cours</Badge>;
      case 'terminee':
        return <Badge variant="success">Terminée</Badge>;
      case 'annulee':
        return <Badge variant="danger">Annulée</Badge>;
      default:
        return <Badge variant="default">{statut}</Badge>;
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'terminee':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'annulee':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderPrestationCard = (prestation: AutrePrestation) => (
    <Card key={prestation.id} hover className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center">
            <PlusCircle className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900">{prestation.nomPrestation}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">{prestation.reference}</p>
          <div className="mt-2 flex items-center">
            {getStatutIcon(prestation.statut)}
            <span className="ml-2">{getStatutBadge(prestation.statut)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2" />
          {prestation.clientNom}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(prestation.dateDebut).toLocaleDateString('fr-FR')}
          {prestation.dateFin && ` - ${new Date(prestation.dateFin).toLocaleDateString('fr-FR')}`}
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{prestation.description}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm">
          <span className="text-gray-600">Fournisseur: </span>
          <span className="font-medium text-gray-900">{prestation.fournisseur || 'N/A'}</span>
        </div>
        <div className="text-lg font-semibold text-blue-600">
          {prestation.prixVente.toLocaleString('fr-FR')} DA
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={() => {
            setSelectedPrestation(prestation);
            setShowDetailModal(true);
          }}
          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          title="Voir les détails"
        >
          <Eye className="w-4 h-4" />
        </button>
        
        {hasPermission('autre-prestation', 'modifier') && (
          <Link
            to={`/autre-prestation/${prestation.id}/modifier`}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </Link>
        )}

        {hasPermission('autre-prestation', 'supprimer') && (
          <button
            onClick={() => {
              setSelectedPrestation(prestation);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Autres Prestations</h1>
          <p className="text-gray-600">Gérer vos prestations personnalisées</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>
          {hasPermission('autre-prestation', 'creer') && (
            <Link to="/autre-prestation/nouveau" className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Prestation
            </Link>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total prestations"
          value={stats.total}
          icon={PlusCircle}
          color="blue"
        />
        <StatCard
          title="En cours"
          value={stats.enCours}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Chiffre d'affaires"
          value={`${stats.chiffreAffaires.toLocaleString('fr-FR')} DA`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Marge"
          value={`${stats.marge.toLocaleString('fr-FR')} DA`}
          icon={TrendingUp}
          color="purple"
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
        placeholder="Rechercher une prestation..."
      />

      {/* Contrôles de vue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {filteredPrestations.length} prestation{filteredPrestations.length > 1 ? 's' : ''} trouvée{filteredPrestations.length > 1 ? 's' : ''}
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
                <TableHeaderCell>Prestation</TableHeaderCell>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Dates</TableHeaderCell>
                <TableHeaderCell>Prix</TableHeaderCell>
                <TableHeaderCell>Statut</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrestations.map((prestation) => (
                <TableRow key={prestation.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{prestation.nomPrestation}</p>
                      <p className="text-sm text-gray-500">{prestation.reference}</p>
                    </div>
                  </TableCell>
                  <TableCell>{prestation.clientNom}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-gray-900">
                        {new Date(prestation.dateDebut).toLocaleDateString('fr-FR')}
                      </p>
                      {prestation.dateFin && (
                        <p className="text-sm text-gray-500">
                          au {new Date(prestation.dateFin).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{prestation.prixVente.toLocaleString('fr-FR')} DA</p>
                      <p className="text-sm text-gray-500">
                        Payé: {prestation.montantPaye.toLocaleString('fr-FR')} DA
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatutIcon(prestation.statut)}
                      <span className="ml-2">{getStatutBadge(prestation.statut)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPrestation(prestation);
                          setShowDetailModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {hasPermission('autre-prestation', 'modifier') && (
                        <Link
                          to={`/autre-prestation/${prestation.id}/modifier`}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}

                      {hasPermission('autre-prestation', 'supprimer') && (
                        <button
                          onClick={() => {
                            setSelectedPrestation(prestation);
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
          {filteredPrestations.map(renderPrestationCard)}
        </GridView>
      )}

      {/* Modal détails prestation */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails de la prestation"
        size="lg"
      >
        {selectedPrestation && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la prestation
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPrestation.nomPrestation}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Référence
                  </label>
                  <p className="text-sm text-gray-900">{selectedPrestation.reference}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <p className="text-sm text-gray-900">{selectedPrestation.clientNom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fournisseur
                  </label>
                  <p className="text-sm text-gray-900">{selectedPrestation.fournisseur || 'Non spécifié'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedPrestation.dateDebut).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {selectedPrestation.dateFin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de fin
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedPrestation.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de création
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedPrestation.dateCreation).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                {selectedPrestation.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix d'achat
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedPrestation.prixAchat.toLocaleString('fr-FR')} DA
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix de vente
                </label>
                <p className="text-lg font-semibold text-blue-600">
                  {selectedPrestation.prixVente.toLocaleString('fr-FR')} DA
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant payé
                </label>
                <p className="text-lg font-semibold text-green-600">
                  {selectedPrestation.montantPaye.toLocaleString('fr-FR')} DA
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <div className="flex items-center mt-1">
                {getStatutIcon(selectedPrestation.statut)}
                <span className="ml-2">{getStatutBadge(selectedPrestation.statut)}</span>
              </div>
            </div>

            {selectedPrestation.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedPrestation.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              {hasPermission('autre-prestation', 'modifier') && (
                <Link
                  to={`/autre-prestation/${selectedPrestation.id}/modifier`}
                  className="btn-secondary"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Link>
              )}
              <button className="btn-primary">
                <FileText className="w-4 h-4 mr-2" />
                Générer facture
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
        {selectedPrestation && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer la prestation <strong>{selectedPrestation.nomPrestation}</strong> ?
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
                onClick={() => handleDelete(selectedPrestation.id)}
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

export default AutrePrestationListPage;