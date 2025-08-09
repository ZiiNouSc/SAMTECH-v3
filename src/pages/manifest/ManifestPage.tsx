import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { manifestAPI } from '../../services/api';

interface Passager {
  nom: string;
  prenom: string;
  dateNaissance: string;
  numeroPasseport: string;
  numeroCarteIdentite: string;
  telephone: string;
  email: string;
}

interface Manifest {
  _id: string;
  numeroManifest: string;
  compagnieTransport: string;
  typeTransport: string;
  destination: string;
  dateDepart: string;
  dateRetour: string;
  nombrePassagers: number;
  passagers: Passager[];
  statut: string;
  dateSoumission: string;
  dateApprobation?: string;
  observations: string;
  notes: string;
  agentId: {
    nom: string;
    prenom: string;
  };
}

const ManifestPage: React.FC = () => {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadManifests();
    loadStats();
  }, []);

  const loadManifests = async () => {
    try {
      setLoading(true);
      const response = await manifestAPI.getAll();
      setManifests(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des manifestes:', error);
      alert('Erreur lors du chargement des manifestes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await manifestAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce manifeste ?')) {
      try {
        await manifestAPI.delete(id);
        alert('Manifeste supprimé avec succès');
        loadManifests();
        loadStats();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'approuve': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'rejete': return 'bg-red-100 text-red-800';
      case 'soumis': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'approuve': return 'Approuvé';
      case 'en_attente': return 'En attente';
      case 'rejete': return 'Rejeté';
      case 'soumis': return 'Soumis';
      default: return statut;
    }
  };

  const getTypeTransportText = (type: string) => {
    switch (type) {
      case 'avion': return 'Avion';
      case 'bateau': return 'Bateau';
      case 'bus': return 'Bus';
      case 'train': return 'Train';
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
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Manifestes</h1>
        <p className="text-gray-600">Gestion des manifestes de voyage</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total manifestes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalManifests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approuvés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.manifestsApprouves}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{stats.manifestsEnAttente}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total passagers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPassagers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des manifestes */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Liste des manifestes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compagnie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transport
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Passagers
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
              {manifests.map((manifest) => (
                <tr key={manifest._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{manifest.numeroManifest}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(manifest.dateSoumission).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{manifest.compagnieTransport}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {getTypeTransportText(manifest.typeTransport)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{manifest.destination}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(manifest.dateDepart).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(manifest.dateRetour).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{manifest.nombrePassagers} passagers</div>
                    <div className="text-sm text-gray-500">
                      {manifest.passagers.length} enregistrés
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(manifest.statut)}`}>
                      {getStatusText(manifest.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        to={`/manifest/${manifest._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/manifest/${manifest._id}/modifier`}
                        className="text-green-600 hover:text-green-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(manifest._id)}
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
        
        {manifests.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun manifeste</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre premier manifeste.
            </p>
            <div className="mt-6">
              <Link
                to="/manifest/nouveau"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Nouveau manifeste
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManifestPage; 