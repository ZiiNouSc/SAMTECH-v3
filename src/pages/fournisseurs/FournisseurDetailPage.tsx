import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Calendar, 
  History, 
  Edit, 
  Trash2, 
  CreditCard, 
  Wallet, 
  Banknote,
  Euro,
  FileText,
  Clock
} from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatMontantCurrency } from '../../utils/formatters';

interface Fournisseur {
  _id: string;
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  nif: string;
  nis: string;
  art: string;
  siret: string;
  tva: string;
  notes: string;
  detteFournisseur: number;
  soldeCrediteur: number;
  createdAt: string;
  updatedAt: string;
}

const FournisseurDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'historique'>('details');

  useEffect(() => {
    if (id) {
      fetchFournisseurData();
    }
  }, [id]);

  const fetchFournisseurData = async () => {
    try {
      const response = await api.get(`/fournisseurs/${id}`);
      console.log('✅ Réponse API fournisseur:', response.data);
      
      // Gérer différents formats de réponse
      const fournisseurData = response.data.data || response.data;
      console.log('✅ Données fournisseur extraites:', fournisseurData);
      
      setFournisseur(fournisseurData);
    } catch (error) {
      console.error('❌ Erreur lors du chargement du fournisseur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!fournisseur || !window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      return;
    }

    try {
      await api.delete(`/fournisseurs/${fournisseur._id}`);
      navigate('/fournisseurs');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Erreur inconnue";
      alert("Erreur lors de la suppression : " + msg);
    }
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

  const formatMontant = (montant: number): string => {
    return montant.toLocaleString('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!fournisseur) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Fournisseur non trouvé</p>
          <button
            onClick={() => navigate('/fournisseurs')}
          className="btn-primary mt-4"
          >
            Retour à la liste
          </button>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
  return (
          <div className="space-y-8">
                {/* Informations de base */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entreprise
                    </label>
                    <p className="text-lg font-semibold text-gray-900">{fournisseur.entreprise || 'Non renseigné'}</p>
                    </div>
                    
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact</label>
                      <p className="text-gray-900">{fournisseur.nom || 'Non renseigné'}</p>
                    </div>
                    </div>
                    
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <a href={`mailto:${fournisseur.email}`} className="text-blue-600 hover:text-blue-700">
                        {fournisseur.email || 'Non renseigné'}
                      </a>
                    </div>
                    </div>
                    
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                      <a href={`tel:${fournisseur.telephone}`} className="text-blue-600 hover:text-blue-700">
                        {fournisseur.telephone || 'Non renseigné'}
                      </a>
                    </div>
                  </div>
                </div>
                  
                  <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Adresse</label>
                      <p className="text-gray-900">{fournisseur.adresse || 'Non renseignée'}</p>
                    </div>
                      </div>
                      
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ville</label>
                      <p className="text-gray-900">{fournisseur.ville || 'Non renseignée'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fournisseur depuis</label>
                      <p className="text-gray-900">{formatDate(fournisseur.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations fiscales */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations fiscales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
                    <p className="text-gray-900">{fournisseur.nif || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIS</label>
                    <p className="text-gray-900">{fournisseur.nis || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Article d'imposition</label>
                    <p className="text-gray-900">{fournisseur.art || 'Non renseigné'}</p>
                  </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {fournisseur.notes && (
              <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900">{fournisseur.notes}</p>
                </div>
                </div>
              )}
          </div>
        );

      case 'historique':
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Historique</h3>
            
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">L'historique des paiements sera bientôt disponible</p>
            </div>
                </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/fournisseurs')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fournisseur.entreprise}</h1>
            <p className="text-gray-600">Détails du fournisseur</p>
                    </div>
                    </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(`/fournisseurs/${fournisseur._id}/modifier`)}
            className="btn-primary"
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </button>
          <button
            onClick={handleDelete}
            className="btn-danger"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </button>
                    </div>
                  </div>

      {/* Résumé rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <DollarSign className="w-6 h-6 text-red-600" />
                                    </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dette</p>
              <p className="text-xl font-bold text-red-600">
                {formatMontant(fournisseur.detteFournisseur || 0)}
              </p>
                                    </div>
                                    </div>
                                    </div>
                                    
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <Wallet className="w-6 h-6 text-green-600" />
                                        </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Solde créditeur</p>
              <p className="text-xl font-bold text-green-600">
                {formatMontant(fournisseur.soldeCrediteur || 0)}
              </p>
                                        </div>
                                        </div>
                                    </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <FileText className="w-6 h-6 text-blue-600" />
                                          </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Factures</p>
              <p className="text-xl font-bold text-gray-900">0</p>
                              </div>
                            </div>
                          </div>
                      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
                        <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Détails
                        </button>
                        <button
            onClick={() => setActiveTab('historique')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'historique'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historique
                        </button>
        </nav>
                      </div>

      {/* Contenu de l'onglet */}
      <div className="card">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default FournisseurDetailPage; 