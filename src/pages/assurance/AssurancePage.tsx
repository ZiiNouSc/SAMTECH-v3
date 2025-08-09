import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { assuranceAPI } from '../../services/api';

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
  agentId: {
    nom: string;
    prenom: string;
  };
}

const AssurancePage: React.FC = () => {
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadAssurances();
    loadStats();
  }, []);

  const loadAssurances = async () => {
    try {
      setLoading(true);
      const response = await assuranceAPI.getAll();
      setAssurances(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des assurances:', error);
      alert('Erreur lors du chargement des assurances');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await assuranceAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette assurance ?')) {
      try {
        await assuranceAPI.delete(id);
        alert('Assurance supprimée avec succès');
        loadAssurances();
        loadStats();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'expiree': return 'bg-red-100 text-red-800';
      case 'annulee': return 'bg-gray-100 text-gray-800';
      case 'resiliee': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'active': return 'Active';
      case 'en_attente': return 'En attente';
      case 'expiree': return 'Expirée';
      case 'annulee': return 'Annulée';
      case 'resiliee': return 'Résiliée';
      default: return statut;
    }
  };

  const getTypeAssuranceText = (type: string) => {
    switch (type) {
      case 'voyage': return 'Voyage';
      case 'medicale': return 'Médicale';
      case 'annulation': return 'Annulation';
      case 'bagages': return 'Bagages';
      case 'responsabilite_civile': return 'Responsabilité civile';
      case 'comprehensive': return 'Comprehensive';
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
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Assurances</h1>
          <p className="text-gray-600">Gestion des assurances voyage</p>
        </div>
        <Link to="/assurance/nouveau" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Nouvelle Assurance
        </Link>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total assurances</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssurances}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Actives</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assurancesActives}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.assurancesEnAttente}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des assurances */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Liste des assurances</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compagnie
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
                  Montant
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
              {assurances.map((assurance) => (
                <tr key={assurance._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {assurance.clientId?.nom} {assurance.clientId?.prenom}
                      </div>
                      <div className="text-sm text-gray-500">{assurance.clientId?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{assurance.compagnieAssurance}</div>
                    <div className="text-sm text-gray-500">{assurance.numeroPolice}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {getTypeAssuranceText(assurance.typeAssurance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{assurance.paysDestination}</div>
                    <div className="text-sm text-gray-500">{assurance.nombrePersonnes} pers.</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(assurance.dateDepart).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(assurance.dateRetour).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {assurance.montantAssure.toLocaleString()} {assurance.devise}
                    </div>
                    <div className="text-sm text-gray-500">
                      Prime: {assurance.prime.toLocaleString()} {assurance.devise}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assurance.statut)}`}>
                      {getStatusText(assurance.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        to={`/assurance/${assurance._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/assurance/${assurance._id}/modifier`}
                        className="text-green-600 hover:text-green-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(assurance._id)}
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
        
        {assurances.length === 0 && (
          <div className="text-center py-12">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune assurance</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre première assurance.
            </p>
            <div className="mt-6">
              <Link
                to="/assurance/nouveau"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Nouvelle assurance
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssurancePage; 