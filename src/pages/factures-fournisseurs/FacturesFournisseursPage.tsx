import React, { useState, useEffect, useCallback } from 'react';
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
  Receipt,
  Printer
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import PaiementFactureFournisseurModal from '../../components/PaiementFactureFournisseurModal';
import FactureFournisseurModal from '../../components/FactureFournisseurModal';
import api from '../../services/api';
import { formatStatut } from '../../utils/formatters';

interface FactureFournisseur {
  _id: string;
  numero: string;
  dateEmission: string;
  dateEcheance: string;
  montantTTC: number;
  montantPaye: number;
  netFournisseur?: number; // Ajout du net fournisseur
  statut: string;
  fournisseurId: {
    _id: string;
    entreprise: string;
    nom: string;
    prenom: string;
    soldeCrediteur: number;
    detteFournisseur?: number;
  } | null;
  agenceId: string;
  createdAt: string;
  billetsAssocies?: any[]; // Added for billets associés
}

const FacturesFournisseursPage: React.FC = () => {
  const [factures, setFactures] = useState<FactureFournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [selectedFacture, setSelectedFacture] = useState<FactureFournisseur | null>(null);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [editingFacture, setEditingFacture] = useState<FactureFournisseur | null>(null);

  // Fonction de rafraîchissement avec indicateur visuel
  const fetchFactures = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await api.get('/factures-fournisseurs');
      const facturesData = response.data.data || [];
      setFactures(facturesData);
      
      console.log('✅ Factures mises à jour:', facturesData.length, 'factures');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des factures:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Rafraîchissement automatique toutes les 30 secondes
  useEffect(() => {
    fetchFactures();
    
    const interval = setInterval(() => {
      fetchFactures(true);
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [fetchFactures]);

  // Fonction de rafraîchissement manuel
  const handleManualRefresh = async () => {
    await fetchFactures(true);
  };

  const handlePaiement = (facture: FactureFournisseur) => {
    setSelectedFacture(facture);
    setShowPaiementModal(true);
  };

  const handlePaiementSuccess = () => {
    fetchFactures(true);
    setSelectedFacture(null);
  };

  // Fonction pour générer et afficher le PDF
  const handleGeneratePDF = async (facture: FactureFournisseur) => {
    try {
      console.log('🔄 Début génération PDF pour facture fournisseur:', facture.numero);
      
      const response = await api.get(`/factures-fournisseurs/${facture._id}/pdf`, {
        responseType: 'blob'
      });
      
      // Créer un blob et l'afficher dans un nouvel onglet
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Ouvrir le PDF dans un nouvel onglet
      window.open(url, '_blank');
      
      console.log('✅ PDF affiché avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  const handleDetail = (facture: FactureFournisseur) => {
    setSelectedFacture(facture);
    setShowDetailModal(true);
  };

  const handleEdit = (facture: FactureFournisseur) => {
    setEditingFacture(facture);
    setShowFactureModal(true);
  };

  const handleCreate = () => {
    setEditingFacture(null);
    setShowFactureModal(true);
  };

  const handleFactureSuccess = async () => {
    // Rafraîchir les données après création/modification
    await fetchFactures(true);
    setShowFactureModal(false);
    setEditingFacture(null);
  };

  const handleDelete = async (facture: FactureFournisseur) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await api.delete(`/factures-fournisseurs/${facture._id}`);
        await fetchFactures(true);
      } catch (error: any) {
        const message = error.response?.data?.message || 'Erreur lors de la suppression';
        alert(message);
      }
    }
  };

  const getStatutBadge = (statut: string) => {
    const statutFormate = formatStatut(statut);
    
    switch (statut) {
      case 'payee':
        return <Badge variant="success" className="flex items-center"><CheckCircle className="h-3 w-3 mr-1" />{statutFormate}</Badge>;
      case 'partiellement_payee':
        return <Badge variant="warning" className="flex items-center"><Clock className="h-3 w-3 mr-1" />{statutFormate}</Badge>;
      case 'en_retard':
        return <Badge variant="danger" className="flex items-center"><AlertCircle className="h-3 w-3 mr-1" />{statutFormate}</Badge>;
      case 'en_attente':
        return <Badge variant="default" className="flex items-center"><Clock className="h-3 w-3 mr-1" />{statutFormate}</Badge>;
      case 'recue':
        return <Badge variant="default" className="flex items-center"><FileText className="h-3 w-3 mr-1" />{statutFormate}</Badge>;
      case 'brouillon':
        return <Badge variant="default" className="flex items-center"><FileText className="h-3 w-3 mr-1" />{statutFormate}</Badge>;
      default:
        return <Badge variant="default">{statutFormate}</Badge>;
    }
  };

  const getMontantRestant = (facture: FactureFournisseur) => {
    const montantTotal = facture.netFournisseur || facture.montantTTC;
    return montantTotal - (facture.montantPaye || 0);
  };

  const filteredFactures = factures.filter(facture => {
    const matchesSearch = 
      facture.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (facture.fournisseurId?.entreprise?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (facture.fournisseurId?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (facture.fournisseurId?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesFilter = filterStatut === 'tous' || facture.statut === filterStatut;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: factures.length,
    payees: factures.filter(f => f.statut === 'payee').length,
    impayees: factures.filter(f => f.statut !== 'payee').length,
    enRetard: factures.filter(f => f.statut === 'en_retard').length,
    montantTotal: factures.reduce((sum, f) => sum + (f.netFournisseur || f.montantTTC), 0),
    montantPaye: factures.reduce((sum, f) => sum + (f.montantPaye || 0), 0),
    montantRestant: factures.reduce((sum, f) => sum + getMontantRestant(f), 0)
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Factures Fournisseurs</h1>
          <p className="text-gray-600">Gestion des factures reçues des fournisseurs</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
          <button 
            onClick={() => {/* TODO: Export */}}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>
          <button onClick={handleCreate} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Facture
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total factures"
          value={stats.total}
          icon={Receipt}
          color="blue"
        />
        <StatCard
          title="Payées"
          value={stats.payees}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="En retard"
          value={stats.enRetard}
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          title="Net à payer"
          value={(stats.montantRestant || 0).toLocaleString('fr-FR') + ' DA'}
          icon={DollarSign}
          color="yellow"
        />
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par numéro, fournisseur..."
                className="w-full pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="input-field"
            >
              <option value="tous">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="recue">Reçue</option>
              <option value="partiellement_payee">Partiellement payée</option>
              <option value="payee">Payée</option>
              <option value="en_retard">En retard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des factures */}
      <div className="card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Facture</TableHeaderCell>
              <TableHeaderCell>Fournisseur</TableHeaderCell>
              <TableHeaderCell>Net Fournisseur</TableHeaderCell>
              <TableHeaderCell>Restant</TableHeaderCell>
              <TableHeaderCell>Échéance</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
              {filteredFactures.map((facture) => {
                const montantRestant = getMontantRestant(facture);
                const isEnRetard = new Date(facture.dateEcheance) < new Date() && facture.statut !== 'payee';
                
                return (
                <TableRow key={facture._id}>
                  <TableCell>
                      <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{facture.numero}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <Building className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {facture.fournisseurId?.entreprise || 'Fournisseur inconnu'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {facture.fournisseurId?.nom || ''}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-green-600">
                        {(facture.netFournisseur || facture.montantTTC).toLocaleString('fr-FR')} DA
                      </p>
                      <p className="text-xs text-gray-500">
                        Net à payer au fournisseur
                      </p>
                      {facture.billetsAssocies && facture.billetsAssocies.length > 0 && (
                        <p className="text-xs text-blue-500">
                          {facture.billetsAssocies.length} billet(s) associé(s)
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {montantRestant > 0 ? (
                        <div>
                          <Badge variant="danger">
                            {montantRestant.toLocaleString('fr-FR')} DA
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Payé: {(facture.montantPaye || 0).toLocaleString('fr-FR')} DA
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Badge variant="success">Payé intégralement</Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {(facture.montantPaye || 0).toLocaleString('fr-FR')} DA
                          </p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className={`${isEnRetard ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                  </TableCell>
                  <TableCell>
                      {getStatutBadge(facture.statut)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDetail(facture)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Voir les détails"
                        >
                        <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleGeneratePDF(facture)}
                          className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                          title="Générer le PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {montantRestant > 0 && (
                          <button
                            onClick={() => handlePaiement(facture)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Effectuer un paiement"
                          >
                          <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(facture)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                        <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(facture)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Supprimer"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                  </TableCell>
                </TableRow>
                );
              })}
          </TableBody>
        </Table>

        {filteredFactures.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterStatut !== 'tous' 
                ? 'Aucune facture ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre première facture fournisseur.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de paiement */}
      {selectedFacture && (
        <PaiementFactureFournisseurModal
          isOpen={showPaiementModal}
          onClose={() => setShowPaiementModal(false)}
          facture={{
            ...selectedFacture,
            fournisseurId: {
              ...selectedFacture.fournisseurId,
              detteFournisseur: selectedFacture.fournisseurId?.detteFournisseur ?? 0,
              _id: selectedFacture.fournisseurId?._id ?? '',
              entreprise: selectedFacture.fournisseurId?.entreprise ?? '',
              nom: selectedFacture.fournisseurId?.nom ?? '',
              prenom: selectedFacture.fournisseurId?.prenom ?? '',
              soldeCrediteur: selectedFacture.fournisseurId?.soldeCrediteur ?? 0
            }
          }}
          onSuccess={handlePaiementSuccess}
        />
      )}

      {/* Modal de création/édition */}
      <FactureFournisseurModal
        isOpen={showFactureModal}
        onClose={() => {
          setShowFactureModal(false);
          setEditingFacture(null);
        }}
        facture={editingFacture ? {
          ...editingFacture,
          montantHT: editingFacture.montantTTC || 0,
          montantTVA: 0,
          articles: [],
          fournisseurId: {
            ...editingFacture.fournisseurId,
            detteFournisseur: editingFacture.fournisseurId?.detteFournisseur ?? 0,
            _id: editingFacture.fournisseurId?._id ?? '',
            entreprise: editingFacture.fournisseurId?.entreprise ?? '',
            nom: editingFacture.fournisseurId?.nom ?? '',
            prenom: editingFacture.fournisseurId?.prenom ?? '',
            soldeCrediteur: editingFacture.fournisseurId?.soldeCrediteur ?? 0
          }
        } : null}
        onSuccess={handleFactureSuccess}
      />

      {/* Modal de détails */}
      {selectedFacture && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Détails de la facture"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro</label>
                <p className="text-sm text-gray-900">{selectedFacture.numero}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                <p className="text-sm text-gray-900">{selectedFacture.fournisseurId?.entreprise || 'Fournisseur inconnu'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Net Fournisseur</label>
                <p className="text-lg font-semibold text-green-600">{(selectedFacture.netFournisseur || selectedFacture.montantTTC).toLocaleString('fr-FR')} DA</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant payé</label>
                <p className="text-lg font-semibold text-green-600">{(selectedFacture.montantPaye || 0).toLocaleString('fr-FR')} DA</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant restant</label>
                <Badge variant={getMontantRestant(selectedFacture) > 0 ? 'danger' : 'success'} size="lg">
                  {getMontantRestant(selectedFacture).toLocaleString('fr-FR')} DA
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <div>{getStatutBadge(selectedFacture.statut)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'émission</label>
                <p className="text-sm text-gray-900">{new Date(selectedFacture.dateEmission).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <p className="text-sm text-gray-900">{new Date(selectedFacture.dateEcheance).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            {/* Détails des billets associés */}
            {selectedFacture.billetsAssocies && selectedFacture.billetsAssocies.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Billets associés à la facture
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>N° Billet</TableHeaderCell>
                      <TableHeaderCell>Passager</TableHeaderCell>
                      <TableHeaderCell>Compagnie</TableHeaderCell>
                      <TableHeaderCell>Plan de vol</TableHeaderCell>
                      <TableHeaderCell>Date départ</TableHeaderCell>
                      <TableHeaderCell>Prix TTC</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFacture.billetsAssocies.map((billet: any) => (
                      <TableRow key={billet._id}>
                        <TableCell>{billet.numero_billet || billet.numeroBillet || '-'}</TableCell>
                        <TableCell>{billet.passager || '-'}</TableCell>
                        <TableCell>{billet.compagnie || '-'}</TableCell>
                        <TableCell>{billet.origine && billet.destination ? `${billet.origine} → ${billet.destination}` : '-'}</TableCell>
                        <TableCell>{billet.dateDepart ? new Date(billet.dateDepart).toLocaleDateString('fr-FR') : '-'}</TableCell>
                        <TableCell>{billet.prix_ttc ? `${billet.prix_ttc.toLocaleString('fr-FR')} DA` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FacturesFournisseursPage; 