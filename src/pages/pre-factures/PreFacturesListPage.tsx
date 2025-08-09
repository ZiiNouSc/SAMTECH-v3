import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Trash2,
  AlertTriangle,
  Download,
  Printer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { PreFacture, ArticleCommande } from '../../types';
import { prestationConfigs } from '../../utils/prestationUtils';
import PrestationSummary from '../../components/facture/PrestationSummary';
import { usePermissions } from '../../hooks/usePermissions';
import { preFactureAPI } from '../../services/api';

const BonsCommandeListPage: React.FC = () => {
  const [preFactures, setPreFactures] = useState<PreFacture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [selectedBon, setSelectedBon] = useState<PreFacture | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{type: string, bonId: string, message: string} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    fetchBonsCommande();
  }, []);

  const fetchBonsCommande = async () => {
    try {
      setLoading(true);
      const response = await preFactureAPI.getAll();
      
      // Utiliser la nouvelle structure de réponse
      const preFacturesData = response.data?.data || response.data || [];
      const preFacturesArray = Array.isArray(preFacturesData) ? preFacturesData : [];
      
      // Mapper _id vers id pour la compatibilité
      const mappedPreFactures = preFacturesArray.map((bon: PreFacture, index: number) => ({
        ...bon,
        id: bon._id || bon.id
      }));
      
      setPreFactures(mappedPreFactures);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType: string, bonId: string) => {
    if (!bonId) {
      console.error('Bon ID is undefined');
      return;
    }
    
    try {
      setActionLoading(true);
      let response;

      switch (actionType) {
        case 'envoyer':
          response = await preFactureAPI.send(bonId);
          break;
        case 'accepter':
          response = await preFactureAPI.accept(bonId);
          break;
        case 'refuser':
          response = await preFactureAPI.reject(bonId);
          break;
        case 'convertir':
          response = await preFactureAPI.convertToInvoice(bonId);
          break;
        case 'supprimer':
          response = await preFactureAPI.delete(bonId);
          break;
        default:
          throw new Error('Action non reconnue');
      }
      
      if (response.data.success) {
        // Update the local state
        setPreFactures(prev => (Array.isArray(prev) ? prev : []).map(bon => {
          if (bon.id === bonId) {
            switch (actionType) {
              case 'envoyer':
                return { ...bon, statut: 'envoye' as const };
              case 'accepter':
                return { ...bon, statut: 'accepte' as const };
              case 'refuser':
                return { ...bon, statut: 'refuse' as const };
              case 'convertir':
                return { ...bon, statut: 'facture' as const };
              case 'supprimer':
                return null; // Will be filtered out
              default:
                return bon;
            }
          }
          return bon;
        }).filter(Boolean) as PreFacture[]);
        
        // Close modals
        setShowDetailModal(false);
        setShowConfirmModal(false);
        setConfirmAction(null);
        
        // Show success message
        const messages = {
          envoyer: 'Devis envoyé avec succès',
          accepter: 'Devis accepté avec succès',
          refuser: 'Devis refusé avec succès',
          convertir: 'Devis converti en facture avec succès',
          supprimer: 'Devis supprimé avec succès'
        };
        alert(messages[actionType as keyof typeof messages] || 'Action effectuée avec succès');
      } else {
        throw new Error(response.data.message || 'Échec de l\'action');
      }
    } catch (error: any) {
      console.error(`Error ${actionType}:`, error);
      alert('Une erreur est survenue: ' + (error.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const showConfirmDialog = (type: string, bonId: string, message: string) => {
    if (!bonId) {
      console.error('Bon ID is undefined in showConfirmDialog');
      return;
    }
    setConfirmAction({ type, bonId, message });
    setShowConfirmModal(true);
  };

  const getAvailableActions = (bon: PreFacture) => {
    const actions = [];
    
    // Actions selon le statut
    switch (bon.statut) {
      case 'brouillon':
        if (hasPermission('pre-factures', 'modifier')) {
          actions.push({
            type: 'envoyer',
            label: 'Envoyer',
            icon: Send,
            color: 'text-blue-600 hover:bg-blue-100',
            confirm: 'Êtes-vous sûr de vouloir envoyer ce devis au client ?'
          });
        }
        break;
        
      case 'envoye':
        if (hasPermission('pre-factures', 'modifier')) {
          actions.push(
            {
              type: 'accepter',
              label: 'Accepter',
              icon: CheckCircle,
              color: 'text-green-600 hover:bg-green-100',
              confirm: 'Marquer ce devis comme accepté par le client ?'
            },
            {
              type: 'refuser',
              label: 'Refuser',
              icon: XCircle,
              color: 'text-red-600 hover:bg-red-100',
              confirm: 'Marquer ce devis comme refusé par le client ?'
            }
          );
        }
        break;
        
      case 'accepte':
        if (hasPermission('factures', 'creer')) {
          actions.push({
            type: 'convertir',
            label: 'Transformer en facture',
            icon: FileText,
            color: 'text-purple-600 hover:bg-purple-100',
            confirm: 'Transformer ce devis accepté en facture ?'
          });
        }
        break;
    }
    
    // Actions communes
    if (bon.statut !== 'facture' && hasPermission('pre-factures', 'modifier')) {
      actions.push({
        type: 'modifier',
        label: 'Modifier',
        icon: Edit,
        color: 'text-gray-600 hover:bg-gray-100',
        isLink: true,
        href: `/pre-factures/${bon.id}/modifier`
      });
    }
    
    if (bon.statut === 'brouillon' && hasPermission('pre-factures', 'supprimer')) {
      actions.push({
        type: 'supprimer',
        label: 'Supprimer',
        icon: Trash2,
        color: 'text-red-600 hover:bg-red-100',
        confirm: 'Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.'
      });
    }
    
    return actions;
  };

  const handleDownloadPDF = async (bonId: string) => {
    try {
      const response = await preFactureAPI.generatePDF(bonId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${bonId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      // Optionnel : rafraîchir la liste pour voir le statut mis à jour
      fetchBonsCommande();
    } catch (err) {
      alert('Erreur lors de la génération du PDF');
    }
  };

  const handlePrintPDF = async (bonId: string) => {
    try {
      console.log('🔄 Début génération PDF pour:', bonId);
      
      // Utiliser le timeout par défaut de l'API (2 minutes)
      const response = await preFactureAPI.generatePDF(bonId);
      console.log('📄 Réponse reçue, type:', typeof response.data, 'taille:', response.data?.size || response.data?.length);
      
      // Vérifier que la réponse est valide
      if (!response.data) {
        throw new Error('Aucune donnée reçue du serveur');
      }
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      console.log('📄 Blob créé, taille:', blob.size, 'type:', blob.type);
      
      // Vérifier que le blob contient bien un PDF valide
      if (blob.size === 0) {
        throw new Error('Le PDF généré est vide');
      }
      
      const url = window.URL.createObjectURL(blob);
      console.log('🔗 URL créée:', url);
      
      // Créer un modal avec iframe pour afficher le PDF
      createPDFModal(url, bonId);
      
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'impression du PDF:', err);
      console.error('❌ Détails de l\'erreur:', err.response?.data || err.message);
      
      // Message d'erreur plus spécifique
      if (err.message?.includes('timeout')) {
        alert('Le PDF est trop volumineux et prend trop de temps à charger. Essayez de télécharger le PDF directement avec le bouton de téléchargement.');
      } else {
        alert('Erreur lors de l\'impression du PDF: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const createPDFModal = (url: string, bonId: string) => {
    // Créer un modal avec iframe pour afficher le PDF
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    
    const pdfContainer = document.createElement('div');
    pdfContainer.style.cssText = `
      width: 95%;
      height: 95%;
      background: white;
      border-radius: 8px;
      position: relative;
      display: flex;
      flex-direction: column;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 15px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f9fafb;
      border-radius: 8px 8px 0 0;
    `;
    
    const title = document.createElement('h3');
    title.textContent = `Devis ${bonId}`;
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #374151;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕ Fermer';
    closeButton.style.cssText = `
      background: #dc2626;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    
    const downloadButton = document.createElement('button');
    downloadButton.textContent = '📥 Télécharger';
    downloadButton.style.cssText = `
      background: #059669;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      margin-right: 10px;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.appendChild(downloadButton);
    buttonContainer.appendChild(closeButton);
    
    header.appendChild(title);
    header.appendChild(buttonContainer);
    
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      flex: 1;
    `;
    
    closeButton.onclick = () => {
      document.body.removeChild(modal);
      window.URL.revokeObjectURL(url);
    };
    
    downloadButton.onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${bonId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    
    pdfContainer.appendChild(header);
    pdfContainer.appendChild(iframe);
    modal.appendChild(pdfContainer);
    document.body.appendChild(modal);
    
    console.log('📄 PDF affiché dans modal avec iframe');
    fetchBonsCommande();
  };

  const filteredPreFactures = (Array.isArray(preFactures) ? preFactures : []).filter(bon => {
    const client = bon.clientId as any;
    const matchesSearch = bon.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client?.entreprise || `${client?.prenom || ''} ${client?.nom || ''}`)
                           .toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'tous' || bon.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'accepte':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'refuse':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'envoye':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'facture':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
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
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Devis</h1>
          <p className="text-gray-600">Gestion des devis</p>
        </div>
        <Link to="/pre-factures/nouveau" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Devis
        </Link>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un devis..."
                className="w-full pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="input-field w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="tous">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="envoye">Envoyé</option>
              <option value="accepte">Accepté</option>
              <option value="refuse">Refusé</option>
              <option value="facture">Facturé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des devis */}
      <div className="card">
        <Table>
          <TableHeader>
            <TableRow key="header">
              <TableHeaderCell>Numéro</TableHeaderCell>
              <TableHeaderCell>Client</TableHeaderCell>
              <TableHeaderCell>Prestations</TableHeaderCell>
              <TableHeaderCell>Date création</TableHeaderCell>
              <TableHeaderCell>Montant TTC</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(filteredPreFactures) ? filteredPreFactures : []).map((bon, index) => (
              <TableRow key={bon.id || `bon-${index}`}>
                <TableCell>
                  <div key={index} className="flex items-center">
                    {getStatusIcon(bon.statut)}
                    <span className="ml-2 font-medium text-gray-900">
                      {bon.numero}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">
                      {(bon.clientId as any)?.entreprise || `${(bon.clientId as any)?.prenom || ''} ${(bon.clientId as any)?.nom || ''}` || 'Client inconnu'}
                    </p>
                    <p className="text-sm text-gray-500">{(bon.clientId as any)?.email || 'Email non disponible'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <PrestationSummary articles={bon.articles || []} maxDisplay={2} />
                </TableCell>
                <TableCell>
                  {new Date(bon.dateCreation).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {(bon.montantTTC || 0).toLocaleString('fr-FR') + ' DA'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      bon.statut === 'accepte' ? 'success' :
                      bon.statut === 'refuse' ? 'danger' :
                      bon.statut === 'envoye' ? 'info' :
                      bon.statut === 'facture' ? 'success' : 'default'
                    }
                  >
                    {bon.statut === 'accepte' ? 'Accepté' :
                     bon.statut === 'refuse' ? 'Refusé' :
                     bon.statut === 'envoye' ? 'Envoyé' :
                     bon.statut === 'facture' ? 'Facturé' : 'Brouillon'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedBon(bon);
                        setShowDetailModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(bon.id)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Générer le PDF du devis"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePrintPDF(bon.id)}
                      className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                      title="Imprimer le devis"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    
                    {getAvailableActions(bon).map((action, index) => {
                      const Icon = action.icon;
                      
                      if (!bon.id) {
                        console.error('Bon ID is undefined for bon:', bon);
                        return null;
                      }
                      
                      if (action.isLink) {
                        return (
                          <Link
                            key={action.type}
                            to={action.href || '#'}
                            className={`p-1 rounded ${action.color}`}
                            title={action.label}
                          >
                            <Icon className="w-4 h-4" />
                          </Link>
                        );
                      }
                      
                      return (
                        <button
                          key={action.type}
                          onClick={() => {
                            if (action.confirm) {
                              showConfirmDialog(action.type, bon.id!, action.confirm);
                            } else {
                              handleAction(action.type, bon.id!);
                            }
                          }}
                          disabled={actionLoading}
                          className={`p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                          title={action.label}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(Array.isArray(filteredPreFactures) ? filteredPreFactures : []).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun devis trouvé</p>
          </div>
        )}
      </div>

      {/* Modal détails devis */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails du devis"
        size="xl"
      >
        {selectedBon && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{selectedBon.numero}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <p className="text-sm text-gray-900">
                    {(selectedBon.clientId as any)?.entreprise || `${(selectedBon.clientId as any)?.prenom || ''} ${(selectedBon.clientId as any)?.nom || ''}` || 'Client inconnu'}
                  </p>
                  <p className="text-sm text-gray-500">{(selectedBon.clientId as any)?.email || 'Email non disponible'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <Badge 
                    variant={
                      selectedBon.statut === 'accepte' ? 'success' :
                      selectedBon.statut === 'refuse' ? 'danger' :
                      selectedBon.statut === 'envoye' ? 'info' :
                      selectedBon.statut === 'facture' ? 'success' : 'default'
                    }
                  >
                    {selectedBon.statut === 'accepte' ? 'Accepté' :
                     selectedBon.statut === 'refuse' ? 'Refusé' :
                     selectedBon.statut === 'envoye' ? 'Envoyé' :
                     selectedBon.statut === 'facture' ? 'Facturé' : 'Brouillon'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de création
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedBon.dateCreation).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant HT
                  </label>
                  <p className="text-sm text-gray-900">
                    {(selectedBon.montantHT || 0).toLocaleString('fr-FR') + ' DA'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant TTC
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {(selectedBon.montantTTC || 0).toLocaleString('fr-FR') + ' DA'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Articles
              </label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow key="articles-header">
                      <TableHeaderCell>Désignation</TableHeaderCell>
                      <TableHeaderCell>Prestation</TableHeaderCell>
                      <TableHeaderCell>Quantité</TableHeaderCell>
                      <TableHeaderCell>Prix unitaire</TableHeaderCell>
                      <TableHeaderCell>Montant</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedBon.articles || []).map((article: ArticleCommande, index: number) => (
                      <TableRow key={article.id || index}>
                        <TableCell>
                          <div className="max-w-xs">
                            {article.designation}
                          </div>
                        </TableCell>
                        <TableCell>
                          {article.prestation ? (
                            <div className="flex items-center space-x-1">
                              <span className="text-sm">{prestationConfigs[article.prestation.type]?.icon}</span>
                              <span className="text-xs text-blue-600 font-medium">
                                {prestationConfigs[article.prestation.type]?.label}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Standard</span>
                          )}
                        </TableCell>
                        <TableCell>{article.quantite}</TableCell>
                        <TableCell>
                          {(article.prixUnitaire || 0).toLocaleString('fr-FR') + ' DA'}
                        </TableCell>
                        <TableCell>
                          {(article.montant || 0).toLocaleString('fr-FR') + ' DA'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {getAvailableActions(selectedBon).map((action) => {
                const Icon = action.icon;
                
                if (action.isLink) {
                  return (
                    <Link
                      key={action.type}
                      to={action.href || '#'}
                      className="btn-secondary"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </Link>
                  );
                }
                
                return (
                  <button
                    key={action.type}
                    onClick={() => {
                      if (action.confirm) {
                        showConfirmDialog(action.type, selectedBon.id!, action.confirm);
                      } else {
                        handleAction(action.type, selectedBon.id!);
                      }
                    }}
                    disabled={actionLoading}
                    className={`btn-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                      action.type === 'supprimer' ? 'bg-red-600 hover:bg-red-700' : ''
                    }`}
                  >
                    {actionLoading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Icon className="w-4 h-4 mr-2" />
                    )}
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmation */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        title="Confirmation"
        size="md"
      >
        {confirmAction && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <p className="text-gray-700">{confirmAction.message}</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => handleAction(confirmAction.type, confirmAction.bonId)}
                disabled={actionLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BonsCommandeListPage;