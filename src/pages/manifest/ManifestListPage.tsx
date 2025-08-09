import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  FileSpreadsheet,
  Plane,
  User,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Printer,
  Download
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import { manifestAPI } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ViewToggle from '../../components/ui/ViewToggle';
import GridView from '../../components/ui/GridView';
import SearchFilter from '../../components/ui/SearchFilter';
import StatCard from '../../components/ui/StatCard';
import { usePermissions } from '../../hooks/usePermissions';

interface Manifest {
  _id: string;
  numeroManifest: string;
  compagnieTransport: string;
  typeTransport: string;
  destination: string;
  dateDepart: string;
  dateRetour: string;
  nombrePassagers: number;
  passagers: {
    nom: string;
    prenom: string;
    dateNaissance: string;
    numeroPasseport: string;
    numeroCarteIdentite: string;
    telephone: string;
    email: string;
    clientId?: {
      nom: string;
      prenom: string;
      email: string;
      telephone: string;
    };
  }[];
  observations: string;
  notes: string;
  agentId: {
    nom: string;
    prenom: string;
  };
  createdAt?: string; // Added for dateSoumission
}

const ManifestListPage: React.FC = () => {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedManifest, setSelectedManifest] = useState<Manifest | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table');
  const [actionLoading, setActionLoading] = useState(false);
  const { hasPermission } = usePermissions();

  const filterOptions = [
    {
      id: 'compagnie',
      label: 'Compagnie',
      options: [
        { value: 'tous', label: 'Toutes les compagnies' },
        { value: 'Air Algérie', label: 'Air Algérie' },
        { value: 'Air France', label: 'Air France' },
        { value: 'Turkish Airlines', label: 'Turkish Airlines' },
        { value: 'Emirates', label: 'Emirates' }
      ]
    }
  ];

  useEffect(() => {
    fetchManifests();
  }, []);

  const fetchManifests = async () => {
    try {
      setLoading(true);
      const response = await manifestAPI.getAll();
      setManifests(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des manifests:', error);
      alert('Erreur lors du chargement des manifestes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await manifestAPI.delete(id);
      alert('Manifeste supprimé avec succès');
      fetchManifests();
      setShowDeleteModal(false);
      setSelectedManifest(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleGeneratePDF = async (manifestId: string) => {
    try {
      setActionLoading(true);
      const response = await manifestAPI.generatePDF(manifestId);
      
      // Créer un blob et télécharger le PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `manifest-${manifestId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF manifest téléchargé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintPDF = async (manifestId: string) => {
    try {
      setActionLoading(true);
      const response = await manifestAPI.generatePDF(manifestId);
      
      // Créer un blob et ouvrir dans un nouvel onglet pour impression
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.onload = () => {
          newWindow.print();
        };
      }
      
      // Nettoyer l'URL après un délai
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
      console.log('✅ PDF manifest ouvert pour impression');
    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF');
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

  const filteredManifests = manifests.filter(manifest => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      manifest.numeroManifest.toLowerCase().includes(searchLower) ||
      manifest.compagnieTransport.toLowerCase().includes(searchLower) ||
      manifest.destination.toLowerCase().includes(searchLower)
    );

    const compagnieFilter = activeFilters.compagnie;

    const matchesCompagnie = !compagnieFilter || compagnieFilter === 'tous' || 
                            manifest.compagnieTransport.toLowerCase().includes(compagnieFilter.toLowerCase());

    return matchesSearch && matchesCompagnie;
  });

  const stats = {
    total: manifests.length,
    totalPassagers: manifests.reduce((sum, m) => sum + (m.nombrePassagers || 0), 0)
  };

  const renderManifestCard = (manifest: Manifest) => (
    <Card key={manifest._id} hover className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900">{manifest.numeroManifest}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Compagnie: {manifest.compagnieTransport}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Plane className="w-4 h-4 mr-2" />
          {manifest.destination}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          Départ: {new Date(manifest.dateDepart).toLocaleString('fr-FR')}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2" />
          {manifest.nombrePassagers} passager{manifest.nombrePassagers > 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm">
          <span className="text-gray-600">Création: </span>
          <span className="font-medium text-gray-900">{new Date(manifest.createdAt || Date.now()).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={() => {
            setSelectedManifest(manifest);
          }}
          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          title="Voir les détails"
        >
          <Eye className="w-4 h-4" />
        </button>
        
        {hasPermission('manifest', 'modifier') && (
          <Link
            to={`/manifest/${manifest._id}/modifier`}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </Link>
        )}

        {hasPermission('manifest', 'supprimer') && (
          <button
            onClick={() => {
              setSelectedManifest(manifest);
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
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Liste des Manifest</h1>
          <p className="text-gray-600">Gestion des manifests</p>
        </div>
        <Link to="/manifest/nouveau" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Manifest
        </Link>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Total manifests"
          value={stats.total}
          icon={FileSpreadsheet}
          color="blue"
        />
        <StatCard
          title="Total passagers"
          value={stats.totalPassagers}
          icon={User}
          color="green"
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
        placeholder="Rechercher un manifest..."
      />

      {/* Contrôles de vue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {filteredManifests.length} manifest{filteredManifests.length > 1 ? 's' : ''} trouvé{filteredManifests.length > 1 ? 's' : ''}
          </span>
        </div>
        <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Contenu principal */}
      {viewMode === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Référence</TableHeaderCell>
                <TableHeaderCell>Compagnie</TableHeaderCell>
                <TableHeaderCell>Destination</TableHeaderCell>
                <TableHeaderCell>Date de départ</TableHeaderCell>
                <TableHeaderCell>Passagers</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredManifests.map((manifest) => (
                <TableRow key={manifest._id}>
                  <TableCell>
                    <span className="font-medium text-gray-900">{manifest.numeroManifest}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{manifest.compagnieTransport}</p>
                      <p className="text-sm text-gray-500">{manifest.typeTransport}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{manifest.destination}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(manifest.dateDepart).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{manifest.nombrePassagers}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => { setSelectedManifest(manifest); }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Voir détail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Bouton de prévisualisation PDF */}
                      <button
                        onClick={() => handlePrintPDF(manifest._id)}
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                        title="Prévisualiser et imprimer"
                        disabled={actionLoading}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      
                      {/* Bouton de téléchargement PDF */}
                      <button
                        onClick={() => handleGeneratePDF(manifest._id)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Télécharger PDF"
                        disabled={actionLoading}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {hasPermission('manifest', 'modifier') && (
                        <Link
                          to={`/manifest/${manifest._id}/modifier`}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                      {hasPermission('manifest', 'supprimer') && (
                        <button
                          onClick={() => { setSelectedManifest(manifest); setShowDeleteModal(true); }}
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

      {viewMode === 'grid' && (
        <GridView columns={3}>
          {filteredManifests.map(renderManifestCard)}
        </GridView>
      )}

      {viewMode === 'list' && (
        <Card>
          <div className="space-y-4">
            {filteredManifests.map((manifest) => (
              <div key={manifest._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{manifest.numeroManifest}</h3>
                        <p className="text-sm text-gray-500">{manifest.compagnieTransport} - {manifest.typeTransport}</p>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm">{manifest.destination}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm">{manifest.nombrePassagers} passagers</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setSelectedManifest(manifest);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {hasPermission('manifest', 'modifier') && (
                        <Link
                          to={`/manifest/${manifest._id}/modifier`}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}

                      {hasPermission('manifest', 'supprimer') && (
                        <button
                          onClick={() => {
                            setSelectedManifest(manifest);
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
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
      >
        {selectedManifest && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer le manifest <strong>{selectedManifest.numeroManifest}</strong> ?
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
                onClick={() => handleDelete(selectedManifest._id)}
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

export default ManifestListPage;