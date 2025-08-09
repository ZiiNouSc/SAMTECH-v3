import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye,
  Edit,
  Trash2,
  Globe,
  EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Package } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { packagesAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import { formatMontantCurrency } from '../../utils/formatters';

const PackagesListPage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await packagesAPI.getAll();
      if (response.data && response.data.success) {
        setPackages(response.data.data || []);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (packageId: string) => {
    if (!packageId) return;
    
    try {
      setActionLoading(true);
      const response = await packagesAPI.toggleVisibility(packageId);
      
      if (response.data && response.data.success) {
        const updatedPackage = response.data.data;
        setPackages(prev => 
          (Array.isArray(prev) ? prev : []).map(p => 
            (p.id || p._id) === (updatedPackage.id || updatedPackage._id) ? updatedPackage : p
          )
        );

        if (selectedPackage && (selectedPackage.id || selectedPackage._id) === (updatedPackage.id || updatedPackage._id)) {
          setSelectedPackage(updatedPackage);
        }
      } else {
        throw new Error(response.data.message || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Erreur lors du changement de visibilité:', error);
      alert('Erreur: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (packageId: string) => {
    if (!packageId) return;
    
    try {
      setActionLoading(true);
      const response = await packagesAPI.delete(packageId);

      if (response.data && response.data.success) {
        setPackages(prev => 
          (Array.isArray(prev) ? prev : []).filter(p => (p.id || p._id) !== packageId)
        );
        setShowDeleteModal(false);
        setSelectedPackage(null);
      } else {
        throw new Error(response.data.message || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPackages = (Array.isArray(packages) ? packages : []).filter(pkg => {
    const searchLower = searchTerm.toLowerCase();
    return (
      pkg.nom.toLowerCase().includes(searchLower) ||
      pkg.description.toLowerCase().includes(searchLower)
    );
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
      {/* Header harmonisé */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Packages</h1>
          <p className="text-gray-600">Gestion des offres et packages</p>
        </div>
        <Link to="/packages/nouveau" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Package
        </Link>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total packages</p>
              <p className="text-2xl font-bold text-gray-900">{(Array.isArray(packages) ? packages : []).length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Packages visibles</p>
              <p className="text-2xl font-bold text-gray-900">
                {(Array.isArray(packages) ? packages : []).filter(pkg => pkg.visible).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <EyeOff className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Packages masqués</p>
              <p className="text-2xl font-bold text-gray-900">
                {(Array.isArray(packages) ? packages : []).filter(pkg => !pkg.visible).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un package..."
                className="w-full pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des packages en cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Array.isArray(filteredPackages) ? filteredPackages : []).map((pkg) => (
          <Card key={pkg.id || pkg._id} className="flex flex-col !p-0">
            <img src={pkg.image || 'https://placehold.co/600x400'} alt={pkg.nom} className="w-full h-48 object-cover rounded-t-2xl" />
            <div className="p-4 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg line-clamp-1">{pkg.nom}</h3>
                  <p className="text-sm text-gray-500">{pkg.pays}</p>
                </div>
                <Badge variant={pkg.visible ? 'success' : 'default'}>
                  {pkg.visible ? 'Visible' : 'Masqué'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-grow">{pkg.description}</p>
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-blue-600">
                  {(pkg.prix || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}
                </p>
                <p className="text-sm text-gray-500">{pkg.duree}</p>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end items-center space-x-2 bg-gray-50 rounded-b-2xl">
               <button
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setShowDetailModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                  title="Voir les détails"
                >
                  <Eye className="w-5 h-5" />
                </button>
                
                {hasPermission('packages', 'modifier') && (pkg.id || pkg._id) && (
                  <Link
                    to={`/packages/${pkg.id || pkg._id}/modifier`}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                    title="Modifier"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                )}

                {hasPermission('packages', 'modifier') && (pkg.id || pkg._id) && (
                  <button
                    onClick={() => handleToggleVisibility(pkg.id || pkg._id!)}
                    disabled={actionLoading}
                    className={`p-2 rounded-full ${
                      pkg.visible 
                        ? 'text-orange-600 hover:bg-orange-100' 
                        : 'text-green-600 hover:bg-green-100'
                    }`}
                    title={pkg.visible ? 'Masquer' : 'Rendre visible'}
                  >
                    {pkg.visible ? <EyeOff className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                  </button>
                )}

                {hasPermission('packages', 'supprimer') && (pkg.id || pkg._id) && (
                  <button
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
            </div>
          </Card>
        ))}
      </div>

      {(Array.isArray(filteredPackages) ? filteredPackages : []).length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun package trouvé</p>
        </div>
      )}

      {/* Modal détails package */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails du package"
        size="lg"
      >
        {selectedPackage && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du package
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPackage.nom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-sm text-gray-900">{selectedPackage.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visibilité
                  </label>
                  <Badge variant={selectedPackage.visible ? 'success' : 'default'}>
                    {selectedPackage.visible ? 'Visible sur la vitrine' : 'Masqué'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix
                  </label>
                  <p className="text-2xl font-bold text-gray-900">
                    {(selectedPackage.prix || 0).toLocaleString('fr-FR', { 
                      style: 'currency', 
                      currency: 'DZD' 
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée
                  </label>
                  <p className="text-sm text-gray-900">{selectedPackage.duree}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de création
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedPackage.dateCreation).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Inclusions
              </label>
              <ul className="space-y-2">
                {(selectedPackage.inclusions || []).map((inclusion, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-900">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    {inclusion}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              {selectedPackage.id && (
                <button
                  onClick={() => handleToggleVisibility(selectedPackage.id)}
                  disabled={actionLoading}
                  className={selectedPackage.visible ? 'btn-secondary' : 'btn-primary'}
                >
                  {actionLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : selectedPackage.visible ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Masquer
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Rendre visible
                    </>
                  )}
                </button>
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
        {selectedPackage && (
          <div>
            <p>
              Êtes-vous sûr de vouloir supprimer le package 
              <strong> "{selectedPackage.nom}"</strong> ? 
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(selectedPackage.id || selectedPackage._id!)}
                disabled={actionLoading}
                className="btn-danger"
              >
                {actionLoading ? <LoadingSpinner size="sm" /> : 'Supprimer'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PackagesListPage;