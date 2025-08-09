import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Download,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  PieChart,
  CreditCard,
  Banknote,
  Receipt,
  RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { OperationCaisse } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { caisseAPI, agentsAPI, clientsAPI, facturesAPI, fournisseursAPI } from '../../services/api';
import { Link } from 'react-router-dom';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const CaissePage: React.FC = () => {
  const [operations, setOperations] = useState<OperationCaisse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<OperationCaisse | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [solde, setSolde] = useState({ total: 0, entrees: 0, sorties: 0 });
  const [statistics, setStatistics] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { hasPermission } = usePermissions();

  // Filtres avancés
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    categorie: 'toutes',
    modePaiement: 'tous',
    type: 'tous'
  });

  const [formData, setFormData] = useState({
    type: 'entree',
    montant: '',
    description: '',
    categorie: 'autre_entree',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    modePaiement: 'especes',
    type_operation: 'autre',
    remboursementType: ''
  });

  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedFacture, setSelectedFacture] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [factures, setFactures] = useState<any[]>([]);
  const [clientFactures, setClientFactures] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [selectedFournisseur, setSelectedFournisseur] = useState('');

  // Ajout d'une variable d'état pour tracer la dernière remise sur dette
  const [remisesSurDette, setRemisesSurDette] = useState<any[]>([]);

  // Catégories dynamiques selon le type
  const getCategoriesForType = (type: 'entree' | 'sortie') => {
    if (type === 'entree') {
      return [
        'remboursement_fournisseur',
        'vente_directe_prestation',
        'versement_initial_capital',
        'autre_entree'
      ];
    } else {
      return [
        'avance_fournisseur',
        'remboursement_client',
        'achat_direct',
        'salaire_commission',
        'retrait_de_fonds',
        'autre_sortie'
      ];
    }
  };

  // Fonction pour formater l'affichage des catégories
  const formatCategorie = (categorie: string) => {
    const categories = {
      'remboursement_fournisseur': 'Remboursement fournisseur',
      'vente_directe_prestation': 'Vente directe / prestation',
      'versement_initial_capital': 'Versement initial / capital',
      'autre_entree': 'Autre entrée',
      'avance_fournisseur': 'Avance fournisseur',
      'remboursement_client': 'Remboursement client',
      'achat_direct': 'Achat direct',
      'salaire_commission': 'Salaire / commission',
      'retrait_de_fonds': 'Retrait de fonds',
      'autre_sortie': 'Autre sortie',
      'encaissement_facture_client': 'Encaissement facture client',
      'encaissement_facture_fournisseur': 'Encaissement facture fournisseur',
      'reglement_facture_fournisseur': 'Règlement facture fournisseur',
      'reglement_facture_client': 'Règlement facture client',
      'remboursement_fournisseur_remise': 'Remise sur dette fournisseur',
      'remboursement_client_remise': 'Remise sur dette client',
      'reglement_automatique_facture': 'Règlement automatique facture',
      'versement_client': 'Versement client',
      'versement_fournisseur': 'Versement fournisseur',
      'sortie_caisse': 'Sortie de caisse',
      'entree_caisse': 'Entrée de caisse',
    };
    if (categories[categorie as keyof typeof categories]) {
      return categories[categorie as keyof typeof categories];
    }
    // Fallback automatique : underscore -> espace, majuscule
    return categorie.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Réinitialiser la catégorie quand le type change
  useEffect(() => {
    if (formData.type) {
      const categoriesValides = getCategoriesForType(formData.type as 'entree' | 'sortie');
      const categorieDefaut = formData.type === 'entree' ? 'autre_entree' : 'autre_sortie';
      
      if (!categoriesValides.includes(formData.categorie)) {
        setFormData(prev => ({ ...prev, categorie: categorieDefaut }));
      }
    }
  }, [formData.type]);

  useEffect(() => {
    fetchOperations();
    fetchSolde();
    fetchStatistics();
    loadInitialData();
  }, [filters]);

  useEffect(() => {
    if (formData.categorie === 'remboursement_client' && selectedClient) {
      console.log('🔍 Recherche factures pour client:', selectedClient);
      console.log('📋 Toutes les factures disponibles:', factures);
      console.log('👥 Tous les clients:', clients);
      
      // Trouver le client sélectionné
      const clientSelectionne = clients.find(c => c._id === selectedClient);
      console.log('🎯 Client sélectionné:', clientSelectionne);
      
      // Filtrer les factures du client sélectionné avec des statuts appropriés
      const facturesClient = factures.filter((facture: any) => {
        const factureClientId = facture.clientId?._id || facture.clientId?.id || facture.clientId;
        const isClientMatch = factureClientId === selectedClient;
        const hasValidStatus = ['envoyee', 'partiellement_payee', 'en_retard', 'payee', 'brouillon'].includes(facture.statut);
        
        console.log('🔍 Facture:', facture.numero, 'Client ID:', factureClientId, 'Match:', isClientMatch, 'Status:', facture.statut, 'Valid:', hasValidStatus);
        console.log('🔍 Structure facture.clientId:', facture.clientId);
        
        return isClientMatch && hasValidStatus;
      });
      
      setClientFactures(facturesClient);
      console.log('✅ Factures client trouvées:', facturesClient);
      console.log('📊 Nombre de factures trouvées:', facturesClient.length);
    } else {
      setClientFactures([]);
    }
  }, [formData.categorie, selectedClient, factures, clients]);

  useEffect(() => {
    if (formData.categorie === 'remboursement_client' && selectedFacture) {
      const facture = clientFactures.find(f => f._id === selectedFacture);
      if (facture) {
        const montantRestant = facture.montantTTC - (facture.montantPaye || 0);
        setFormData(prev => ({ ...prev, montant: montantRestant.toString() }));
      }
    }
  }, [formData.categorie, selectedFacture, clientFactures]);

  // Réinitialiser les factures quand la catégorie change
  useEffect(() => {
    if (formData.categorie !== 'remboursement_client') {
      setClientFactures([]);
      setSelectedClient('');
      setSelectedFacture('');
    }
  }, [formData.categorie]);

  const loadInitialData = async () => {
    try {
      const [agentsRes, clientsRes, fournisseursRes, facturesRes] = await Promise.all([
        agentsAPI.getAll(),
        clientsAPI.getAll(),
        fournisseursAPI.getAll(),
        facturesAPI.getAll()
      ]);
      setAgents(agentsRes.data.data || []);
      setClients(clientsRes.data.data || []);
      setFournisseurs(fournisseursRes.data.data || []);
      setFactures(facturesRes.data.data || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const fetchOperations = async () => {
    try {
      const params: any = {
        page: 1,
        limit: 50
      };
      
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] !== '' && filters[key as keyof typeof filters] !== 'tous') {
          params[key] = filters[key as keyof typeof filters];
        }
      });

      const response = await caisseAPI.getOperations(params);
      
      if (response.data.success) {
        const operationsData = response.data.data.operations || [];
        setOperations(operationsData);
        
        // Calcul des totaux en excluant les remises sur dette
        const totalEntrees = operationsData
          .filter((op: any) => op.type === 'entree' && op.categorie !== 'remboursement_fournisseur_remise')
          .reduce((sum: number, op: any) => sum + (op.montant || 0), 0);
          
        const totalSorties = operationsData
          .filter((op: any) => op.type === 'sortie')
          .reduce((sum: number, op: any) => sum + (op.montant || 0), 0);
        
        const soldeCaisse = totalEntrees - totalSorties;
        
        setSolde(prev => ({
          ...prev,
          entrees: totalEntrees,
          sorties: totalSorties,
          total: soldeCaisse
        }));
      } else {
        throw new Error(response.data.message || 'Failed to load operations');
      }
    } catch (error: any) {
      console.error('Error loading operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSolde = async () => {
    try {
      const response = await caisseAPI.getSolde();
      if (response.data.success) {
        setSolde(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading solde:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await caisseAPI.getStatistics({ periode: '30' });
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleAddOperation = async () => {
    // Validation stricte des champs obligatoires
    if (!formData.montant || !formData.description || !formData.categorie) {
      alert('Veuillez remplir tous les champs obligatoires : montant, description et catégorie');
      return;
    }

    // Validation du montant
    const montant = parseFloat(formData.montant);
    if (isNaN(montant) || montant <= 0) {
      alert('Le montant doit être un nombre positif');
      return;
    }

    // Validation selon la catégorie
    if (formData.categorie === 'salaire_commission' && !selectedAgent) {
      alert('Veuillez sélectionner un agent pour cette opération');
      return;
    }

    if (formData.categorie === 'remboursement_client' && !selectedClient) {
      alert('Veuillez sélectionner un client pour cette opération');
      return;
    }

    // Validation pour remboursement fournisseur - supprimer le blocage sur le solde créditeur
    // if (formData.categorie === 'remboursement_fournisseur' && selectedFournisseur) {
    //   const fournisseur = fournisseurs.find(f => f._id === selectedFournisseur);
    //   if (fournisseur && (fournisseur.soldeCrediteur || 0) <= 0) {
    //     alert('Ce fournisseur n\'a pas de solde créditeur à rembourser');
    //     return;
    //   }
    // }

    try {
      setActionLoading(true);
      
      const payload: any = {
        type: formData.type,
        montant: montant,
        description: formData.description.trim(),
        categorie: formData.categorie,
        reference: formData.reference?.trim() || '',
        date: formData.date,
        moyenPaiement: formData.modePaiement,
        type_operation: formData.type_operation
      };

      // Ajouter les relations selon le contexte
      if (formData.categorie === 'salaire_commission' && selectedAgent) {
        payload.agentId = selectedAgent;
      }
      
      if (formData.categorie === 'remboursement_client' && selectedClient) {
        payload.clientId = selectedClient;
      }
      
      if (formData.categorie === 'remboursement_client' && selectedFacture) {
        payload.factureId = selectedFacture;
      }
      
      // Relations avec les fournisseurs
      if (formData.categorie === 'avance_fournisseur' && selectedFournisseur) {
        payload.fournisseurId = selectedFournisseur;
      }
      
      if (formData.categorie === 'remboursement_fournisseur' && selectedFournisseur) {
        payload.fournisseurId = selectedFournisseur;
        payload.remboursementType = formData.remboursementType;
      }

      console.log('📤 Données envoyées à l\'API:', payload);
      console.log('📋 Données transformées complètes:', JSON.stringify(payload, null, 2));

      const response = await caisseAPI.addOperation(payload);
      
      console.log('✅ Réponse API:', response.data);
      
      if (response.data.success) {
        if (response.data.message === 'Remise sur dette enregistrée') {
          await loadInitialData(); // recharge fournisseurs
          setRemisesSurDette(prev => [
            {
              id: Date.now(),
              type: 'info',
              description: formData.description + ' (remise sur dette)',
              montant: formData.montant,
              date: formData.date,
              fournisseur: fournisseurs.find(f => f._id === selectedFournisseur),
              createdAt: new Date().toISOString()
            },
            ...prev
          ]);
        setShowAddModal(false);
        resetForm();
          alert('Remise sur dette enregistrée, aucune entrée en caisse.');
          return;
      } else {
          // Cas normal : opération caisse créée
        await fetchOperations();
        await fetchSolde();
        await fetchStatistics();
          await loadInitialData();
          setShowAddModal(false);
        resetForm();
          alert('Entrée enregistrée avec succès.');
          return;
        }
      } else {
        throw new Error(response.data.message || 'Failed to add operation');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ajout:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data);
      alert('Une erreur est survenue lors de l\'ajout: ' + (error.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'entree',
      montant: '',
      description: '',
      categorie: 'autre_entree',
      reference: '',
      date: new Date().toISOString().split('T')[0],
      modePaiement: 'especes',
      type_operation: 'autre',
      remboursementType: ''
    });
    setSelectedAgent('');
    setSelectedClient('');
    setSelectedFacture('');
    setSelectedFournisseur('');
  };

  const filteredOperations = (Array.isArray(operations) ? operations : []).filter(operation => {
    const matchesSearch = operation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operation.categorie.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (operation.reference && operation.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
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
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Caisse</h1>
          <p className="text-gray-600">Gestion de la caisse et des mouvements</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau Mouvement
        </button>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Entrées</p>
              <p className="text-2xl font-bold text-green-600">
                {(statistics && typeof statistics.totalEntrees === 'number' ? statistics.totalEntrees : 0).toLocaleString('fr-FR') + ' DA'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sorties</p>
              <p className="text-2xl font-bold text-red-600">
                {(statistics && typeof statistics.totalSorties === 'number' ? statistics.totalSorties : 0).toLocaleString('fr-FR') + ' DA'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${(typeof solde === 'object' ? solde.total : solde) >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <Wallet className={`w-6 h-6 ${(typeof solde === 'object' ? solde.total : solde) >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Solde</p>
              <p className={`text-2xl font-bold ${(typeof solde === 'object' ? solde.total : solde) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {(typeof solde === 'object' ? solde.total : solde || 0).toLocaleString('fr-FR') + ' DA'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Opérations</p>
              <p className="text-2xl font-bold text-gray-900">{(Array.isArray(operations) ? operations : []).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <select
              className="input-field"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="tous">Tous les types</option>
              <option value="entree">Entrées</option>
              <option value="sortie">Sorties</option>
            </select>
          </div>

          <div>
            <select
              className="input-field"
              value={filters.modePaiement}
              onChange={(e) => setFilters(prev => ({ ...prev, modePaiement: e.target.value }))}
            >
              <option value="tous">Tous les modes</option>
              <option value="especes">Espèces</option>
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              className="input-field"
              value={filters.dateDebut}
              onChange={(e) => setFilters(prev => ({ ...prev, dateDebut: e.target.value }))}
              placeholder="Date début"
            />
          </div>

          <div>
            <input
              type="date"
              className="input-field"
              value={filters.dateFin}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFin: e.target.value }))}
              placeholder="Date fin"
            />
          </div>

          <div>
            <button 
              onClick={() => setFilters({
                dateDebut: '',
                dateFin: '',
                categorie: 'toutes',
                modePaiement: 'tous',
                type: 'tous'
              })}
              className="btn-secondary w-full"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des opérations */}
      <div className="card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Type</TableHeaderCell>
              {/* <TableHeaderCell>Description</TableHeaderCell> */}
              <TableHeaderCell>Catégorie</TableHeaderCell>
              <TableHeaderCell>Mode Paiement</TableHeaderCell>
              <TableHeaderCell>Référence</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Montant</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {remisesSurDette.map((remise, index) => (
              <TableRow key={remise.id || `remise-${index}`}> 
                <TableCell>
                  <div className="flex items-center">
                    <Badge variant="warning">Remise sur dette</Badge>
                  </div>
                </TableCell>
                {/* <TableCell>
                  <p className="font-medium text-gray-900">{remise.description}</p>
                </TableCell> */}
                <TableCell>
                  <span className="text-sm text-orange-600">Remise sur dette</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">-</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">-</span>
                </TableCell>
                <TableCell>
                  {new Date(remise.date).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-orange-600">-{remise.montant} DA</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-400">Traçabilité</span>
                </TableCell>
              </TableRow>
            ))}
            {(Array.isArray(filteredOperations) ? filteredOperations : []).map((operation, index) => (
              <TableRow key={operation.id || (operation as any)._id || `operation-${index}`}>
                <TableCell>
                  <div className="flex items-center">
                    {operation.type === 'entree' ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-2" />
                    )}
                    {operation.categorie === 'remboursement_fournisseur_remise' ? (
                      <Badge variant="warning">Remise sur dette</Badge>
                    ) : (
                    <Badge variant={operation.type === 'entree' ? 'success' : 'danger'}>
                      {operation.type === 'entree' ? 'Entrée' : 'Sortie'}
                    </Badge>
                    )}
                  </div>
                </TableCell>
                {/* <TableCell>
                  <p className="font-medium text-gray-900">{operation.description}</p>
                </TableCell> */}
                <TableCell>
                  <span className="text-sm text-gray-600">{formatCategorie(operation.categorie)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {operation.modePaiement === 'especes' && <Banknote className="w-4 h-4 mr-1" />}
                    {operation.modePaiement === 'virement' && <CreditCard className="w-4 h-4 mr-1" />}
                    {operation.modePaiement === 'cheque' && <Receipt className="w-4 h-4 mr-1" />}
                    <span className="text-sm text-gray-600">
                      {operation.modePaiement === 'especes' && 'Espèces'}
                      {operation.modePaiement === 'virement' && 'Virement'}
                      {operation.modePaiement === 'cheque' && 'Chèque'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">{operation.reference || '-'}</span>
                </TableCell>
                <TableCell>
                  {new Date(operation.date).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <span className={`font-medium ${
                    operation.type === 'entree' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {operation.type === 'entree' ? '+' : '-'}
                    {(typeof operation.montant === 'number' ? operation.montant : 0).toLocaleString('fr-FR')} DA
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => { setSelectedOperation(operation); setShowDetailModal(true); }}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Voir détail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {hasPermission('caisse', 'modifier') && (
                      <button
                        onClick={() => { setSelectedOperation(operation); setShowEditModal(true); }}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {hasPermission('caisse', 'supprimer') && (
                      <button
                        onClick={() => { setSelectedOperation(operation); setShowDeleteModal(true); }}
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

        {filteredOperations.length === 0 && (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm 
                ? 'Aucune opération ne correspond à votre recherche.'
                : 'Aucune opération enregistrée.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal d'ajout */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nouvelle Opération"
        size="lg"
      >
        <div className="space-y-6">
          {/* Type d'opération */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type d'opération *</label>
              <select
                className="input-field"
                value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="entree">Entrée</option>
              <option value="sortie">Sortie</option>
              </select>
            </div>
            
          {/* Catégorie */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
              <select
                className="input-field"
                value={formData.categorie}
                onChange={(e) => setFormData(prev => ({ ...prev, categorie: e.target.value }))}
              >
                {getCategoriesForType(formData.type as 'entree' | 'sortie').map(cat => (
                  <option key={cat} value={cat}>{formatCategorie(cat)}</option>
                ))}
              </select>
            </div>
            
          {/* Montant */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Montant *</label>
              <input
              type="number"
              step="0.01"
                className="input-field"
              value={formData.montant}
              onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
              placeholder="0.00"
              />
            </div>

          {/* Description */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
                className="input-field"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de l'opération"
            />
          </div>

          {/* Remboursement fournisseur : UX flexible */}
          {formData.categorie === 'remboursement_fournisseur' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur *</label>
              <select 
                className="input-field" 
                value={selectedFournisseur} 
                onChange={e => setSelectedFournisseur(e.target.value)}
                required
              >
                <option value="">Sélectionner un fournisseur</option>
                {Array.isArray(fournisseurs) && fournisseurs.map((f: any, index: number) => (
                  <option key={`fournisseur-remboursement-${f._id || `index-${index}`}`} value={f._id}>
                    {f.entreprise || f.nom} - Solde créditeur: {(f.soldeCrediteur || 0).toFixed(2)} DA / Dette: {(f.detteFournisseur || 0).toFixed(2)} DA
                  </option>
                ))}
              </select>
              {selectedFournisseur && (() => {
                const fournisseur = fournisseurs.find(f => f._id === selectedFournisseur);
                if (!fournisseur) return null;
                return (
                  <div className="text-xs text-gray-500">
                    Situation : Solde créditeur = <span className="text-green-600">{(fournisseur.soldeCrediteur || 0).toFixed(2)} DA</span> / Dette = <span className="text-orange-600">{(fournisseur.detteFournisseur || 0).toFixed(2)} DA</span>
            </div>
                );
              })()}
              {/* Type de remboursement */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">Type de remboursement *</label>
              <select 
                className="input-field" 
                  value={formData.remboursementType || ''}
                  onChange={e => setFormData(prev => ({ ...prev, remboursementType: e.target.value }))}
                required
              >
                  <option value="">Choisir l'action</option>
                  <option value="solde">Diminuer le solde créditeur</option>
                  <option value="dette">Diminuer la dette</option>
                  <option value="exceptionnel">Exceptionnel (entrée réelle en caisse)</option>
              </select>
                <p className="text-xs text-gray-400 mt-1">
                  Choisis l'action à appliquer, peu importe la situation du fournisseur.
              </p>
              </div>
            </div>
          )}

          {formData.categorie === 'remboursement_client' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <select 
                  className="input-field" 
                  value={selectedClient} 
                  onChange={e => {
                    setSelectedClient(e.target.value);
                    setSelectedFacture('');
                  }}
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {Array.isArray(clients) && clients.map((client: any, index: number) => (
                    <option key={`client-remboursement-${client._id || `index-${index}`}`} value={client._id}>
                      {client.entreprise || `${client.prenom} ${client.nom}`}
                    </option>
                  ))}
                </select>
              </div>
              {selectedClient && clientFactures.length > 0 && (
              <div>
                  <label className="block text-sm font-medium text-gray-700">Facture liée (optionnel)</label>
                  <select 
                    className="input-field" 
                    value={selectedFacture} 
                    onChange={e => setSelectedFacture(e.target.value)}
                  >
                  <option value="">Sélectionner une facture</option>
                    {clientFactures.map((facture: any, index: number) => {
                      const montantRestant = facture.montantTTC - (facture.montantPaye || 0);
                      return (
                        <option key={`client-facture-remboursement-${facture._id || `index-${index}`}`} value={facture._id}>
                          {facture.numero} - {montantRestant.toFixed(2)} DA restant
                        </option>
                      );
                    })}
                </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Sélectionnez une facture pour lier le remboursement (optionnel)
                  </p>
              </div>
              )}
              {selectedClient && clientFactures.length === 0 && (
                <div className="text-sm text-gray-500">
                  Aucune facture en attente de paiement pour ce client
            </div>
          )}
            </>
          )}

          {/* Avance fournisseur : sélection du fournisseur obligatoire */}
          {formData.categorie === 'avance_fournisseur' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur *</label>
              <select
                className="input-field"
                value={selectedFournisseur}
                onChange={e => setSelectedFournisseur(e.target.value)}
                required
              >
                <option value="">Sélectionner un fournisseur</option>
                {Array.isArray(fournisseurs) && fournisseurs.map((f: any, index: number) => (
                  <option key={`fournisseur-avance-${f._id || `index-${index}`}`} value={f._id}>
                    {f.entreprise || f.nom} - Solde créditeur: {(f.soldeCrediteur || 0).toFixed(2)} DA
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Cette opération augmentera le solde créditeur du fournisseur sélectionné.
              </p>
            </div>
          )}
            
          {/* Mode de paiement */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
              <select
                className="input-field"
                value={formData.modePaiement}
                onChange={(e) => setFormData(prev => ({ ...prev, modePaiement: e.target.value }))}
              >
                <option value="especes">Espèces</option>
                <option value="virement">Virement</option>
                <option value="cheque">Chèque</option>
              </select>
          </div>

          {/* Référence */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Référence</label>
              <input
                type="text"
                className="input-field"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="Référence (optionnel)"
              />
            </div>

          {/* Date */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                className="input-field"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
            type="button"
            onClick={() => setShowAddModal(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
            type="button"
            onClick={handleAddOperation}
            disabled={actionLoading}
            className="btn-primary disabled:opacity-50"
          >
            {actionLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Ajout en cours...
              </>
            ) : (
              'Ajouter l\'opération'
            )}
            </button>
        </div>
      </Modal>

      {/* Modal de détail */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détail de l'opération"
        size="md"
      >
        {selectedOperation && (() => {
          const op: any = selectedOperation;
          return (
              <div className="space-y-4">
              {/* Description en haut */}
              <div className="bg-gray-100 rounded p-3 text-lg font-semibold text-gray-800 border border-gray-200">
                {op.description}
                  </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded p-3 border border-gray-100">
                  <div><b>Date :</b> {new Date(op.date).toLocaleDateString('fr-FR')}</div>
                  <div><b>Type :</b> {op.type === 'entree' ? 'Entrée' : 'Sortie'}</div>
                  <div><b>Catégorie :</b> {formatCategorie(op.categorie)}</div>
                  <div><b>Montant :</b> {op.montant.toLocaleString('fr-FR')} DA</div>
                </div>
                <div className="bg-gray-50 rounded p-3 border border-gray-100">
                  {op.reference && <div><b>Référence :</b> {op.reference}</div>}
                  {op.fournisseurId && (
                    <div><b>Fournisseur :</b> {op.fournisseurId.entreprise || op.fournisseurId.nom}</div>
                  )}
                  {op.clientId && (
                    <div><b>Client :</b> {op.clientId?.entreprise || op.clientId?.nom}</div>
                  )}
                </div>
                </div>
              {/* Section utilisateur en bas */}
              <div className="mt-6 pt-4 border-t text-xs text-gray-500 flex flex-col md:flex-row md:items-center md:justify-between bg-gray-50 rounded p-3 border border-gray-100">
                <div>
                  Opération effectuée par :
                  <span className="ml-1 font-semibold text-gray-700">
                    {op.userId?.prenom || op.userId?.nom ? `${op.userId?.prenom || ''} ${op.userId?.nom || ''}`.trim() : 'Utilisateur inconnu'}
                    </span>
                  </div>
                {op.userId?.email && (
                  <div className="text-xs text-gray-400 mt-2 md:mt-0 md:ml-4">
                    Email : {op.userId.email}
          </div>
        )}
            </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default CaissePage;