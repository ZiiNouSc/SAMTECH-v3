import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  StarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { autresPrestationsAPI } from '../../services/api';

interface AutrePrestation {
  _id: string;
  clientId: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  typePrestation: string;
  titre: string;
  description: string;
  destination: string;
  dateDebut: string;
  dateFin?: string;
  nombrePersonnes: number;
  prix: number;
  devise: string;
  fournisseur: string;
  statut: string;
  reference: string;
  notes: string;
  agentId: {
    nom: string;
    prenom: string;
  };
}

const AutresPrestationsPage: React.FC = () => {
  const [prestations, setPrestations] = useState<AutrePrestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadPrestations();
    loadStats();
  }, []);

  const loadPrestations = async () => {
    try {
      setLoading(true);
      const response = await autresPrestationsAPI.getAll();
      setPrestations(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des prestations:', error);
      alert('Erreur lors du chargement des prestations');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await autresPrestationsAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette prestation ?')) {
      try {
        await autresPrestationsAPI.delete(id);
        alert('Prestation supprimée avec succès');
        loadPrestations();
        loadStats();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'confirmee': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      case 'terminee': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'confirmee': return 'Confirmée';
      case 'en_attente': return 'En attente';
      case 'annulee': return 'Annulée';
      case 'terminee': return 'Terminée';
      default: return statut;
    }
  };

  const getTypePrestationText = (type: string) => {
    switch (type) {
      case 'excursion': return 'Excursion';
      case 'guide': return 'Guide';
      case 'transfert': return 'Transfert';
      case 'location_voiture': return 'Location de voiture';
      case 'restaurant': return 'Restaurant';
      case 'spectacle': return 'Spectacle';
      case 'autre': return 'Autre';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Autres prestations</h1>
          <p className="text-gray-600 mt-2">Gestion des prestations supplémentaires</p>
        </div>
        <Link
          to="/autres-prestations/nouveau"
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Nouvelle prestation
        </Link>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <StarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total prestations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPrestations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prestationsConfirmees}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">{stats.chiffreAffaires?.toLocaleString()} DA</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prestationsEnAttente}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des prestations */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Liste des prestations</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prestation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prestations.map((prestation) => (
                <tr key={prestation._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {prestation.clientId?.nom} {prestation.clientId?.prenom}
                      </div>
                      <div className="text-sm text-gray-500">{prestation.clientId?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{prestation.titre}</div>
                    <div className="text-sm text-gray-500">{prestation.reference}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {getTypePrestationText(prestation.typePrestation)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{prestation.destination}</div>
                    <div className="text-sm text-gray-500">{prestation.nombrePersonnes} pers.</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(prestation.dateDebut).toLocaleDateString()}
                    </div>
                    {prestation.dateFin && (
                      <div className="text-sm text-gray-500">
                        {new Date(prestation.dateFin).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {prestation.prix.toLocaleString()} {prestation.devise}
                    </div>
                    <div className="text-sm text-gray-500">{prestation.fournisseur}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prestation.statut)}`}>
                      {getStatusText(prestation.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        to={`/autres-prestations/${prestation._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/autres-prestations/${prestation._id}/modifier`}
                        className="text-green-600 hover:text-green-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(prestation._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {prestations.length === 0 && (
          <div className="text-center py-12">
            <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune prestation</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre première prestation.
            </p>
            <div className="mt-6">
              <Link
                to="/autres-prestations/nouveau"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Nouvelle prestation
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutresPrestationsPage; 