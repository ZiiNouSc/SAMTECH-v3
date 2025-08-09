import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Calendar, Building, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, FileText, CreditCard } from 'lucide-react';
import Badge from '../components/ui/Badge';
import PaiementFactureFournisseurModal from '../components/PaiementFactureFournisseurModal';
import api from '../services/api';

interface Fournisseur {
  _id: string;
  entreprise: string;
  nom: string;
  prenom: string;
  soldeCrediteur: number;
  detteFournisseur: number;
}

interface FactureFournisseur {
  _id: string;
  numero: string;
  fournisseurId: Fournisseur;
  dateEmission: string;
  dateEcheance: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  statut: string;
  notes?: string;
  articles: Array<{
    designation: string;
    quantite: number;
    prixUnitaire: number;
    montant: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

const FacturesFournisseurs: React.FC = () => {
  const [factures, setFactures] = useState<FactureFournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedFacturePaiement, setSelectedFacturePaiement] = useState<FactureFournisseur | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [fournisseurFilter, setFournisseurFilter] = useState('');
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);

  useEffect(() => {
    fetchFactures();
    fetchFournisseurs();
  }, []);

  const fetchFactures = async () => {
    try {
      setLoading(true);
      const response = await api.get('/factures-fournisseurs');
      setFactures(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFournisseurs = async () => {
    try {
      const response = await api.get('/fournisseurs');
      setFournisseurs(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;

    try {
      await api.delete(`/factures-fournisseurs/${id}`);
      fetchFactures();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de la suppression';
      alert(message);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'payee': return 'success';
      case 'en_attente': return 'warning';
      case 'en_retard': return 'danger';
      case 'brouillon': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'payee': return <CheckCircle className="h-4 w-4" />;
      case 'en_attente': return <Clock className="h-4 w-4" />;
      case 'en_retard': return <AlertCircle className="h-4 w-4" />;
      case 'brouillon': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'payee': return 'Payée';
      case 'en_attente': return 'En attente';
      case 'en_retard': return 'En retard';
      case 'brouillon': return 'Brouillon';
      default: return statut;
    }
  };

  const isOverdue = (dateEcheance: string) => {
    return new Date(dateEcheance) < new Date();
  };

  const filteredFactures = factures.filter(facture => {
    const matchesSearch = facture.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facture.fournisseurId.entreprise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${facture.fournisseurId.prenom} ${facture.fournisseurId.nom}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || facture.statut === statusFilter;
    
    const matchesFournisseur = fournisseurFilter === '' || facture.fournisseurId._id === fournisseurFilter;
    
    let matchesDate = true;
    if (dateFilter === 'this_month') {
      const thisMonth = new Date();
      const factureDate = new Date(facture.dateEmission);
      matchesDate = factureDate.getMonth() === thisMonth.getMonth() && 
                   factureDate.getFullYear() === thisMonth.getFullYear();
    } else if (dateFilter === 'overdue') {
      matchesDate = isOverdue(facture.dateEcheance);
    }
    
    return matchesSearch && matchesStatus && matchesFournisseur && matchesDate;
  });

  const stats = {
    total: factures.length,
    payees: factures.filter(f => f.statut === 'payee').length,
    enAttente: factures.filter(f => f.statut === 'en_attente').length,
    enRetard: factures.filter(f => f.statut === 'en_retard' || isOverdue(f.dateEcheance)).length,
    montantTotal: factures.reduce((sum, f) => sum + f.montantTTC, 0),
    montantPaye: factures.filter(f => f.statut === 'payee').reduce((sum, f) => sum + f.montantTTC, 0),
    montantEnAttente: factures.filter(f => f.statut === 'en_attente').reduce((sum, f) => sum + f.montantTTC, 0)
  };

  const openPaiementModal = (facture: FactureFournisseur) => {
    setSelectedFacturePaiement(facture);
    setShowPaiementModal(true);
  };

  const closePaiementModal = () => {
    setShowPaiementModal(false);
    setSelectedFacturePaiement(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures Fournisseurs</h1>
          <p className="text-gray-600">Gérez les factures de vos fournisseurs</p>
        </div>
        <Link
          to="/factures-fournisseurs/new"
          className="mt-4 sm:mt-0 btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle facture
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total factures</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Payées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.payees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.enAttente}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En retard</p>
              <p className="text-2xl font-bold text-gray-900">{stats.enRetard}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Montants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Montant total</p>
              <p className="text-2xl font-bold">{stats.montantTotal.toLocaleString('fr-FR')} DA</p>
            </div>
            <DollarSign className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Montant payé</p>
              <p className="text-2xl font-bold">{stats.montantPaye.toLocaleString('fr-FR')} DA</p>
            </div>
            <CheckCircle className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Montant en attente</p>
              <p className="text-2xl font-bold">{stats.montantEnAttente.toLocaleString('fr-FR')} DA</p>
            </div>
            <Clock className="h-8 w-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Numéro, fournisseur..."
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="en_attente">En attente</option>
              <option value="payee">Payée</option>
              <option value="en_retard">En retard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur</label>
            <select
              value={fournisseurFilter}
              onChange={(e) => setFournisseurFilter(e.target.value)}
              className="input-field"
            >
              <option value="">Tous les fournisseurs</option>
              {fournisseurs.map((fournisseur) => (
                <option key={fournisseur._id} value={fournisseur._id}>
                  {fournisseur.entreprise || `${fournisseur.prenom} ${fournisseur.nom}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Toutes les dates</option>
              <option value="this_month">Ce mois</option>
              <option value="overdue">En retard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des factures */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Factures ({filteredFactures.length})
          </h3>
        </div>

        {filteredFactures.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture trouvée</h3>
            <p className="text-gray-500">Commencez par créer votre première facture fournisseur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fournisseur
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFactures.map((facture) => (
                  <tr key={facture._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{facture.numero}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(facture.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {facture.fournisseurId.entreprise || `${facture.fournisseurId.prenom} ${facture.fournisseurId.nom}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                          Émission: {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                          Échéance: {new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}
                          {isOverdue(facture.dateEcheance) && (
                            <Badge variant="danger" className="ml-2 text-xs">En retard</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{facture.montantTTC.toLocaleString('fr-FR')} DA</div>
                        <div className="text-gray-500">
                          HT: {facture.montantHT.toLocaleString('fr-FR')} DA
                          {facture.montantTVA > 0 && (
                            <span className="ml-1">
                              (TVA: {facture.montantTVA.toLocaleString('fr-FR')} DA)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(facture.statut)} className="flex items-center w-fit">
                        {getStatusIcon(facture.statut)}
                        <span className="ml-1">{getStatusLabel(facture.statut)}</span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {facture.statut !== 'payee' && (
                          <button
                            onClick={() => openPaiementModal(facture)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Payer"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                        <Link
                          to={`/factures-fournisseurs/edit/${facture._id}`}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(facture._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de paiement */}
      {selectedFacturePaiement && (
        <PaiementFactureFournisseurModal
          isOpen={showPaiementModal}
          onClose={closePaiementModal}
          facture={selectedFacturePaiement}
          onSuccess={fetchFactures}
        />
      )}
    </div>
  );
};

export default FacturesFournisseurs; 