import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  Building,
  DollarSign,
  RefreshCw,
  Mail,
  Phone,
  Users,
  Building2,
  MapPin,
  Euro,
  Upload,
  Calculator
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ViewToggle from '../../components/ui/ViewToggle';
import GridView from '../../components/ui/GridView';
import ListView from '../../components/ui/ListView';
import Card from '../../components/ui/Card';
import SearchFilter from '../../components/ui/SearchFilter';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import FacturesFournisseursPage from '../factures-fournisseurs/FacturesFournisseursPage';
import api from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import TransactionsPage from './TransactionsPage';

interface Fournisseur {
  _id: string;
  entreprise: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  soldeCrediteur: number;
  detteFournisseur: number;
  detteCalculee: number;
  soldeCalcule: number;
  details?: any;
  createdAt: string;
}

const FournisseursPage: React.FC = () => {
  const navigate = useNavigate();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'table' | 'grid' | 'list'>('table');
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'liste' | 'factures' | 'transactions'>('liste');
  const { hasPermission } = usePermissions();

  const filterOptions = [
    {
      id: 'dette',
      label: 'Dette',
      options: [
        { value: 'avec_dette', label: 'Avec dette' },
        { value: 'sans_dette', label: 'Sans dette' },
        { value: 'dette_elevee', label: 'Dette élevée (>1000 DA)' }
      ]
    },
    {
      id: 'solde',
      label: 'Solde',
      options: [
        { value: 'avec_solde', label: 'Avec solde' },
        { value: 'sans_solde', label: 'Sans solde' },
        { value: 'solde_eleve', label: 'Solde élevé (>1000 DA)' }
      ]
    }
  ];

  const formatMontant = (montant: number): string => {
    return montant.toLocaleString('fr-FR');
  };

  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Fonction de rafraîchissement avec indicateur visuel
  const fetchFournisseurs = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await api.get('/fournisseurs');
      const fournisseursData = response.data.data || [];
      setFournisseurs(fournisseursData);
      
      console.log('✅ Fournisseurs mis à jour:', fournisseursData.length, 'fournisseurs');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des fournisseurs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Rafraîchissement automatique toutes les 30 secondes
  useEffect(() => {
    fetchFournisseurs();
    
    const interval = setInterval(() => {
      fetchFournisseurs(true);
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [fetchFournisseurs]);

  // Fonction de rafraîchissement manuel
  const handleManualRefresh = async () => {
    await fetchFournisseurs(true);
  };

  const handleDetail = (fournisseur: Fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setShowDetailModal(true);
  };

  const handleEdit = (fournisseur: Fournisseur) => {
    navigate(`/fournisseurs/${fournisseur._id}/modifier`);
  };

  const handleCreate = () => {
    navigate('/fournisseurs/nouveau');
  };

  const handleFournisseurSuccess = async () => {
    // Rafraîchir les données après création/modification
    await fetchFournisseurs(true);
    setShowDetailModal(false);
  };

  const handleDelete = async (fournisseur: Fournisseur) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      try {
        await api.delete(`/fournisseurs/${fournisseur._id}`);
        await fetchFournisseurs(true);
      } catch (error: any) {
        const message = error.response?.data?.message || 'Erreur lors de la suppression';
        alert(message);
      }
    }
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const filteredFournisseurs = fournisseurs.filter(fournisseur => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      fournisseur.nom.toLowerCase().includes(searchLower) ||
      (fournisseur.prenom && fournisseur.prenom.toLowerCase().includes(searchLower)) ||
      (fournisseur.entreprise && fournisseur.entreprise.toLowerCase().includes(searchLower)) ||
      fournisseur.email.toLowerCase().includes(searchLower)
    );

    // Filtres
    const detteFilter = activeFilters.dette;
    const soldeFilter = activeFilters.solde;

    let matchesDette = true;
    if (detteFilter && detteFilter !== 'tous') {
      const dette = fournisseur.detteCalculee || 0;
      switch (detteFilter) {
        case 'avec_dette':
          matchesDette = dette > 0;
          break;
        case 'sans_dette':
          matchesDette = dette === 0;
          break;
        case 'dette_elevee':
          matchesDette = dette > 1000;
          break;
      }
    }

    let matchesSolde = true;
    if (soldeFilter && soldeFilter !== 'tous') {
      const solde = fournisseur.soldeCalcule || 0;
      switch (soldeFilter) {
        case 'avec_solde':
          matchesSolde = solde > 0;
          break;
        case 'sans_solde':
          matchesSolde = solde === 0;
          break;
        case 'solde_eleve':
          matchesSolde = solde > 1000;
          break;
      }
    }

    return matchesSearch && matchesDette && matchesSolde;
  });

  const stats = {
    total: fournisseurs.length,
    avecDette: fournisseurs.filter(f => (f.detteCalculee || 0) > 0).length,
    avecSolde: fournisseurs.filter(f => (f.soldeCalcule || 0) > 0).length,
    totalDette: fournisseurs.reduce((sum, f) => sum + (f.detteCalculee || 0), 0),
    totalSolde: fournisseurs.reduce((sum, f) => sum + (f.soldeCalcule || 0), 0)
  };

  const renderFournisseurCard = (fournisseur: Fournisseur) => (
    <Card key={fournisseur._id} hover className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {fournisseur.entreprise || `${fournisseur.prenom} ${fournisseur.nom}`}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                variant={(fournisseur.detteCalculee || 0) > 0 ? 'danger' : 'success'}
                size="sm"
              >
                Dette: {(fournisseur.detteCalculee || 0).toLocaleString('fr-FR')} DA
              </Badge>
              {(fournisseur.soldeCalcule || 0) > 0 && (
                <Badge variant="success" size="sm">
                  Solde: {(fournisseur.soldeCalcule || 0).toLocaleString('fr-FR')} DA
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-2" />
          {fournisseur.email}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-2" />
          {fournisseur.telephone}
        </div>
        <div className="flex items-start text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{fournisseur.adresse}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1 inline" />
          {formatDate(fournisseur.createdAt)}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDetail(fournisseur)}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {hasPermission('fournisseurs', 'modifier') && (
            <button
              onClick={() => handleEdit(fournisseur)}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {hasPermission('fournisseurs', 'supprimer') && (
            <button
              onClick={() => {
                setSelectedFournisseur(fournisseur);
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

  const renderFournisseurListItem = (fournisseur: Fournisseur) => (
    <Card key={fournisseur._id} padding="sm" className="hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h3 className="font-medium text-gray-900 truncate">
                {fournisseur.entreprise || `${fournisseur.prenom} ${fournisseur.nom}`}
              </h3>
              <Badge 
                variant={(fournisseur.detteCalculee || 0) > 0 ? 'danger' : 'success'}
                size="sm"
              >
                Dette: {(fournisseur.detteCalculee || 0).toLocaleString('fr-FR')} DA
              </Badge>
              {(fournisseur.soldeCalcule || 0) > 0 && (
                <Badge variant="success" size="sm">
                  Solde: {(fournisseur.soldeCalcule || 0).toLocaleString('fr-FR')} DA
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-600">{fournisseur.email}</span>
              <span className="text-sm text-gray-600">{fournisseur.telephone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDetail(fournisseur)}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {hasPermission('fournisseurs', 'modifier') && (
            <button
              onClick={() => handleEdit(fournisseur)}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {hasPermission('fournisseurs', 'supprimer') && (
            <button
              onClick={() => {
                setSelectedFournisseur(fournisseur);
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

  const tabs = [
    { id: 'liste', label: 'Liste des fournisseurs', icon: Building2 },
    { id: 'factures', label: 'Situation fournisseurs', icon: FileText },
    { id: 'transactions', label: 'Transactions fournisseurs', icon: Calculator }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Fournisseurs</h1>
          <p className="text-gray-600">Gestion des partenaires et prestataires</p>
        </div>
        <button 
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau Fournisseur
        </button>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Onglets */}
      <nav className="-mb-px flex space-x-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Contenu selon l'onglet */}
      {activeTab === 'liste' ? (
        <div className="space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total fournisseurs"
              value={stats.total}
              icon={Building2}
              color="blue"
            />
            <StatCard
              title="Avec dette"
              value={stats.avecDette}
              icon={AlertCircle}
              color="red"
            />
            <StatCard
              title="Avec solde"
              value={stats.avecSolde}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Dette totale"
              value={(stats.totalDette || 0).toLocaleString('fr-FR') + ' DA'}
              icon={DollarSign}
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
            placeholder="Rechercher un fournisseur..."
          />

          {/* Contrôles de vue */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {filteredFournisseurs.length} fournisseur{filteredFournisseurs.length > 1 ? 's' : ''} trouvé{filteredFournisseurs.length > 1 ? 's' : ''}
              </span>
            </div>
            <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
          </div>

          {/* Contenu principal */}
          {filteredFournisseurs.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Aucun fournisseur trouvé"
              description="Aucun fournisseur ne correspond à vos critères de recherche. Essayez de modifier vos filtres ou ajoutez un nouveau fournisseur."
              action={hasPermission('fournisseurs', 'creer') ? {
                label: "Ajouter un fournisseur",
                onClick: handleCreate
              } : undefined}
            />
          ) : (
            <>
              {currentView === 'table' && (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow key="header">
                        <TableHeaderCell>Fournisseur</TableHeaderCell>
                        <TableHeaderCell>Contact</TableHeaderCell>
                        <TableHeaderCell>Dette</TableHeaderCell>
                        <TableHeaderCell>Solde</TableHeaderCell>
                        <TableHeaderCell>Date création</TableHeaderCell>
                        <TableHeaderCell>Actions</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFournisseurs.map((fournisseur, index) => (
                        <TableRow key={fournisseur._id || `fournisseur-${index}`}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <Building2 className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {fournisseur.entreprise || `${fournisseur.prenom} ${fournisseur.nom}`}
                                </p>
                                <p className="text-sm text-gray-500">{fournisseur.adresse}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-900">
                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                {fournisseur.email}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                {fournisseur.telephone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={(fournisseur.detteCalculee || 0) > 0 ? 'danger' : 'success'}
                            >
                              {(fournisseur.detteCalculee || 0).toLocaleString('fr-FR')} DA
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={(fournisseur.soldeCalcule || 0) > 0 ? 'success' : 'default'}
                            >
                              {(fournisseur.soldeCalcule || 0).toLocaleString('fr-FR')} DA
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(fournisseur.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDetail(fournisseur)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {hasPermission('fournisseurs', 'modifier') && (
                                <button
                                  onClick={() => handleEdit(fournisseur)}
                                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                  title="Modifier"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}

                              {hasPermission('fournisseurs', 'supprimer') && (
                                <button
                                  onClick={() => {
                                    setSelectedFournisseur(fournisseur);
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
                <GridView>
                  {filteredFournisseurs.map(fournisseur => renderFournisseurCard(fournisseur))}
                </GridView>
              )}

              {currentView === 'list' && (
                <ListView>
                  {filteredFournisseurs.map(fournisseur => renderFournisseurListItem(fournisseur))}
                </ListView>
              )}
            </>
          )}
        </div>
      ) : activeTab === 'factures' ? (
        <FacturesFournisseursPage />
      ) : activeTab === 'transactions' && <TransactionsPage />}

      {/* Modals */}
      {showDetailModal && selectedFournisseur && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Détails - ${selectedFournisseur.entreprise || `${selectedFournisseur.prenom} ${selectedFournisseur.nom}`}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Entreprise</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFournisseur.entreprise || 'Non spécifié'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFournisseur.prenom} {selectedFournisseur.nom}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFournisseur.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFournisseur.telephone}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Adresse</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFournisseur.adresse}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dette calculée</label>
                  <p className="mt-1 text-lg font-semibold text-red-600">
                    {(selectedFournisseur.detteCalculee || 0).toLocaleString('fr-FR')} DA
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Solde calculé</label>
                  <p className="mt-1 text-lg font-semibold text-green-600">
                    {(selectedFournisseur.soldeCalcule || 0).toLocaleString('fr-FR')} DA
                  </p>
                </div>
              </div>
            </div>
            {/* BOUTON VOIR LE PROFIL FOURNISSEUR */}
            {selectedFournisseur._id && (
              <div className="flex justify-end mt-8">
                <button
                  className="btn-primary px-5 py-2 shadow-lg rounded-md"
                  style={{ minWidth: 200 }}
                  onClick={() => {
                    setShowDetailModal(false);
                    navigate(`/fournisseurs/${selectedFournisseur._id}`);
                  }}
                >
                  Voir le profil fournisseur
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showDeleteModal && selectedFournisseur && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirmer la suppression"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer le fournisseur <strong>{selectedFournisseur.entreprise || `${selectedFournisseur.prenom} ${selectedFournisseur.nom}`}</strong> ?
            </p>
            <p className="text-sm text-red-600">
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handleDelete(selectedFournisseur);
                  setShowDeleteModal(false);
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FournisseursPage;