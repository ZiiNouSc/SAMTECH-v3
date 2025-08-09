import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  FileText,
  Trash2,
  CheckSquare,
  Square,
  Users,
  Building2,
  Printer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PaiementFournisseurModal from '../../components/modals/PaiementFournisseurModal';
import { Facture } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { facturesAPI } from '../../services/api';
import * as RadixTooltip from "@radix-ui/react-tooltip";
import StatCard from '../../components/ui/StatCard';
import { formatMontantCurrency } from '../../utils/formatters';

const FacturesListPage: React.FC = () => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [typeFilter, setTypeFilter] = useState<string>('tous');
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMoyen, setPaymentMoyen] = useState('especes');
  const [showPaiementFournisseurModal, setShowPaiementFournisseurModal] = useState(false);
  const [selectedFactureForPaiement, setSelectedFactureForPaiement] = useState<Facture | null>(null);
  const [selectedFactures, setSelectedFactures] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const { hasPermission } = usePermissions();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFactures();
  }, [page, limit]);

  useEffect(() => {
    setShowBulkActions(selectedFactures.size > 0);
  }, [selectedFactures]);

  const fetchFactures = async () => {
    try {
      setLoading(true);
      const response = await facturesAPI.getAll({ page, limit });
      const facturesData = response.data.data || [];
      setFactures(Array.isArray(facturesData) ? facturesData : []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Numéro',
      'Client/Fournisseur',
      'Email',
      'Date émission',
      'Date échéance',
      'Montant HT',
      'TVA',
      'Montant TTC',
      'Montant payé',
      'Statut',
      'Type'
    ];

    const csvData = filteredFactures.map(facture => [
      facture.numero || '',
      facture.client ? 
        (facture.client.entreprise || `${facture.client?.prenom || ''} ${facture.client?.nom || ''}`) :
        facture.fournisseur ? 
          (facture.fournisseur?.entreprise || facture.fournisseur?.nom) : '',
      facture.client ? 
        facture.client?.email :
        (facture.fournisseur?.email || ''),
      new Date(facture.dateEmission).toLocaleDateString('fr-FR'),
      new Date(facture.dateEcheance).toLocaleDateString('fr-FR'),
      (facture.montantHT || 0).toFixed(2),
      ((facture.montantTTC || 0) - (facture.montantHT || 0)).toFixed(2),
      (facture.montantTTC || 0).toFixed(2),
      (facture.montantPaye || 0).toFixed(2),
      getStatusLabel(facture.statut),
      facture.client ? 'Client' : 'Fournisseur'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `factures_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFactureSelection = (factureId: string) => {
    const newSelection = new Set(selectedFactures);
    if (newSelection.has(factureId)) {
      newSelection.delete(factureId);
    } else {
      newSelection.add(factureId);
    }
    setSelectedFactures(newSelection);
  };

  const selectAllFactures = () => {
    if (selectedFactures.size === filteredFactures.length) {
      setSelectedFactures(new Set());
    } else {
      setSelectedFactures(new Set(filteredFactures.map(f => f.id || (f as any)._id)));
    }
  };

  const clearSelection = () => {
    setSelectedFactures(new Set());
  };

  const bulkMarkAsPaid = async () => {
    if (selectedFactures.size === 0) return;
    
    try {
      setActionLoading(true);
      const promises = Array.from(selectedFactures).map(id => facturesAPI.markAsPaid(id));
      await Promise.all(promises);
      
      setFactures(prev => prev.map(facture => 
        selectedFactures.has(facture.id || (facture as any)._id) 
          ? { ...facture, statut: 'payee' as const }
          : facture
      ));
      
      clearSelection();
      alert(`${selectedFactures.size} facture(s) marquée(s) comme payée(s)`);
    } catch (error) {
      console.error('Error marking invoices as paid:', error);
      alert('Erreur lors du marquage des factures');
    } finally {
      setActionLoading(false);
    }
  };

  const bulkSendFactures = async () => {
    if (selectedFactures.size === 0) return;
    
    try {
      setActionLoading(true);
      const promises = Array.from(selectedFactures).map(id => facturesAPI.sendFacture(id));
      await Promise.all(promises);
      
      setFactures(prev => prev.map(facture => 
        selectedFactures.has(facture.id || (facture as any)._id) 
          ? { ...facture, statut: 'envoyee' as const }
          : facture
      ));
      
      clearSelection();
      alert(`${selectedFactures.size} facture(s) envoyée(s)`);
    } catch (error) {
      console.error('Error sending invoices:', error);
      alert('Erreur lors de l\'envoi des factures');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async (factureId: string) => {
    if (!factureId) {
      console.error('Facture ID is undefined');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await facturesAPI.markAsPaid(factureId);
      
      if (response.data.success) {
        setFactures(prev => (Array.isArray(prev) ? prev : []).map(facture => 
          facture.id === factureId 
            ? { ...facture, statut: 'payee' as const }
            : facture
        ));
        
        if (selectedFacture && selectedFacture.id === factureId) {
          setSelectedFacture({ ...selectedFacture, statut: 'payee' });
        }
      } else {
        throw new Error(response.data.message || 'Failed to mark invoice as paid');
      }
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      alert('Une erreur est survenue lors du marquage comme payée: ' + (error.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePDF = async (factureId: string) => {
    if (!factureId) {
      console.error('Facture ID is undefined');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await facturesAPI.generatePDF(factureId);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${factureId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF: ' + (error.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  // Fonction pour créer un modal PDF (comme dans les devis)
  const createPDFModal = (pdfUrl: string, factureId: string) => {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    const content = document.createElement('div');
    content.style.width = '90%';
    content.style.height = '90%';
    content.style.backgroundColor = 'white';
    content.style.borderRadius = '8px';
    content.style.position = 'relative';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    const header = document.createElement('div');
    header.style.padding = '16px';
    header.style.borderBottom = '1px solid #e5e7eb';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const title = document.createElement('h2');
    title.textContent = `Facture ${factureId}`;
    title.style.margin = '0';
    title.style.fontSize = '18px';
    title.style.fontWeight = 'bold';

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '0';
    closeButton.style.width = '30px';
    closeButton.style.height = '30px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';

    const printButton = document.createElement('button');
    printButton.textContent = 'Imprimer';
    printButton.style.background = '#2563eb';
    printButton.style.color = 'white';
    printButton.style.border = 'none';
    printButton.style.padding = '8px 16px';
    printButton.style.borderRadius = '4px';
    printButton.style.cursor = 'pointer';
    printButton.style.marginRight = '8px';

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Télécharger';
    downloadButton.style.background = '#059669';
    downloadButton.style.color = 'white';
    downloadButton.style.border = 'none';
    downloadButton.style.padding = '8px 16px';
    downloadButton.style.borderRadius = '4px';
    downloadButton.style.cursor = 'pointer';

    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.style.flex = '1';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '0 0 8px 8px';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';

    buttonContainer.appendChild(printButton);
    buttonContainer.appendChild(downloadButton);

    header.appendChild(title);
    header.appendChild(buttonContainer);
    header.appendChild(closeButton);

    content.appendChild(header);
    content.appendChild(iframe);

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Event listeners
    closeButton.onclick = () => {
      document.body.removeChild(modal);
      window.URL.revokeObjectURL(pdfUrl);
    };

    printButton.onclick = () => {
      iframe.contentWindow?.print();
    };

    downloadButton.onclick = () => {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `facture-${factureId}.pdf`;
      link.click();
    };

    // Fermer avec Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        window.URL.revokeObjectURL(pdfUrl);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Fermer en cliquant à l'extérieur
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  };

  const handlePrintPDF = async (factureId: string) => {
    try {
      console.log('🔄 Début génération PDF pour facture:', factureId);
      
      // Utiliser le timeout par défaut de l'API (2 minutes)
      const response = await facturesAPI.generatePDF(factureId);
      console.log('📄 Réponse reçue, type:', typeof response.data, 'taille:', response.data?.size || response.data?.length);
      
      // Vérifier que la réponse est valide
      if (!response.data) {
        throw new Error('Aucune donnée reçue du serveur');
      }

      // Vérifier si c'est une réponse JSON (PDF temporairement désactivé)
      if (response.data.success !== undefined) {
        // C'est une réponse JSON, afficher un message informatif
        alert(`PDF temporairement indisponible.\n\nDonnées de la facture:\n- Numéro: ${response.data.data?.facture?.numero}\n- Client: ${response.data.data?.facture?.client}\n- Montant: ${response.data.data?.facture?.montantTTC} DA\n- Statut: ${response.data.data?.facture?.statut}\n\nLe système PDF sera réactivé prochainement.`);
        return;
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
      createPDFModal(url, factureId);
      
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

  const handlePayment = async () => {
    if (!selectedFacture || !paymentAmount) return;

    try {
      setPaymentLoading(true);
      await facturesAPI.makePayment(
        selectedFacture.id || (selectedFacture as any)._id,
        parseFloat(paymentAmount),
        paymentMoyen
      );
      
      // Mettre à jour la facture dans la liste
        setFactures(prev => prev.map(facture => 
        facture.id === selectedFacture.id || (facture as any)._id === (selectedFacture as any)._id
            ? { 
                ...facture, 
              montantPaye: (facture.montantPaye || 0) + parseFloat(paymentAmount),
              statut: (facture.montantPaye || 0) + parseFloat(paymentAmount) >= (facture.montantTTC || 0) ? 'payee' : 'partiellement_payee'
              }
            : facture
        ));

        setShowPaymentModal(false);
        setPaymentAmount('');
      setSelectedFacture(null);
      alert('Paiement effectué avec succès');
    } catch (error) {
      console.error('Error making payment:', error);
      alert('Erreur lors du paiement');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSendFacture = async (factureId: string) => {
    if (!factureId) {
      console.error('Facture ID is undefined');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await facturesAPI.sendFacture(factureId);
      
      if (response.data.success) {
        setFactures(prev => (Array.isArray(prev) ? prev : []).map(facture => 
          facture.id === factureId 
            ? { ...facture, statut: 'envoyee' as const }
            : facture
        ));
        
        if (selectedFacture && selectedFacture.id === factureId) {
          setSelectedFacture({ ...selectedFacture, statut: 'envoyee' });
        }

        alert('Facture envoyée avec succès');
      } else {
        throw new Error(response.data.message || 'Failed to send invoice');
      }
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      alert('Une erreur est survenue lors de l\'envoi: ' + (error.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (factureId: string) => {
    if (!factureId) return;
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;
    try {
      setActionLoading(true);
      await facturesAPI.delete(factureId);
      setFactures(prev => prev.filter(f => f.id !== factureId));
      alert('Facture supprimée avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la facture:', error);
      alert('Erreur lors de la suppression de la facture');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaiementFournisseur = (facture: Facture) => {
    setSelectedFactureForPaiement(facture);
    setShowPaiementFournisseurModal(true);
  };

  const handlePaiementFournisseurSuccess = () => {
    fetchFactures(); // Recharger les factures pour voir les changements
    setShowPaiementFournisseurModal(false);
    setSelectedFactureForPaiement(null);
  };

  const filteredFactures = factures.filter(facture => {
    const matchesSearch = facture.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (facture.client?.entreprise || facture.client?.nom || facture.fournisseur?.nom || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'tous' || getCalculatedStatus(facture) === statusFilter;
    const matchesType = typeFilter === 'tous' || 
                       (typeFilter === 'client' && facture.client) ||
                       (typeFilter === 'fournisseur' && facture.fournisseur);
    
    const matchesDateFilter = !dateFilter.start && !dateFilter.end || (() => {
      const emissionDate = new Date(facture.dateEmission);
      const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
      const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
      
      if (startDate && endDate) {
        return emissionDate >= startDate && emissionDate <= endDate;
      } else if (startDate) {
        return emissionDate >= startDate;
      } else if (endDate) {
        return emissionDate <= endDate;
      }
      return true;
    })();
    
    const matchesAmountFilter = !amountFilter.min && !amountFilter.max || (() => {
      const amount = facture.montantTTC || 0;
      const minAmount = amountFilter.min ? parseFloat(amountFilter.min) : null;
      const maxAmount = amountFilter.max ? parseFloat(amountFilter.max) : null;
      
      if (minAmount && maxAmount) {
        return amount >= minAmount && amount <= maxAmount;
      } else if (minAmount) {
        return amount >= minAmount;
      } else if (maxAmount) {
        return amount <= maxAmount;
      }
      return true;
    })();
    
    return matchesSearch && matchesStatus && matchesType && matchesDateFilter && matchesAmountFilter;
  });

  const clearAdvancedFilters = () => {
    setDateFilter({ start: '', end: '' });
    setAmountFilter({ min: '', max: '' });
  };

  // Fonction de tri
  const sortData = (data: Facture[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'numero':
          aValue = a.numero || '';
          bValue = b.numero || '';
          break;
        case 'client':
          aValue = a.client ? 
            (a.client?.entreprise || `${a.client?.prenom || ''} ${a.client?.nom || ''}`) :
            a.fournisseur ? 
              (a.fournisseur?.entreprise || a.fournisseur?.nom) : '';
          bValue = b.client ? 
            (b.client?.entreprise || `${b.client?.prenom || ''} ${b.client?.nom || ''}`) :
            b.fournisseur ? 
              (b.fournisseur?.entreprise || b.fournisseur?.nom) : '';
          break;
        case 'dateEmission':
          aValue = new Date(a.dateEmission).getTime();
          bValue = new Date(b.dateEmission).getTime();
          break;
        case 'dateEcheance':
          aValue = new Date(a.dateEcheance).getTime();
          bValue = new Date(b.dateEcheance).getTime();
          break;
        case 'montantTTC':
          aValue = a.montantTTC || 0;
          bValue = b.montantTTC || 0;
          break;
        case 'statut':
          aValue = getStatusLabel(a.statut);
          bValue = getStatusLabel(b.statut);
          break;
      default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="text-blue-600">↑</span> : 
      <span className="text-blue-600">↓</span>;
  };

  const sortedFactures = sortData(filteredFactures);

  // Fonction pour calculer le statut réel d'une facture basé sur le montant payé
  const getCalculatedStatus = (facture: Facture) => {
    // Si la facture est annulée, on garde ce statut
    if (facture.statut === 'annulee') return 'annulee';
    
    const montantTotal = facture.montantTTC || 0;
    const montantPaye = facture.montantPaye || 0;
    
    // Si le montant payé est égal ou supérieur au montant total
    if (montantPaye >= montantTotal) {
      return 'payee';
    }
    // Si un montant a été payé mais pas le total
    else if (montantPaye > 0) {
      return 'partiellement_payee';
    }
    // Sinon on garde le statut original (brouillon, envoyee, en_retard)
    else {
      return facture.statut;
    }
  };

  // Fonction pour obtenir le label du statut calculé
  const getCalculatedStatusLabel = (facture: Facture) => {
    const calculatedStatus = getCalculatedStatus(facture);
    return getStatusLabel(calculatedStatus);
  };

  // Fonction pour obtenir la variante du statut calculé
  const getCalculatedStatusVariant = (facture: Facture) => {
    const calculatedStatus = getCalculatedStatus(facture);
    return getStatusVariant(calculatedStatus);
  };

  const stats = {
    total: factures.length,
    clients: factures.filter(f => f.client).length,
    fournisseurs: factures.filter(f => f.fournisseur).length,
    payees: factures.filter(f => getCalculatedStatus(f) === 'payee').length,
    enRetard: factures.filter(f => f.statut === 'en_retard').length,
    brouillon: factures.filter(f => f.statut === 'brouillon').length,
    partiellementPayees: factures.filter(f => getCalculatedStatus(f) === 'partiellement_payee').length
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'payee': return 'Payée';
      case 'en_retard': return 'En retard';
      case 'envoyee': return 'Envoyée';
      case 'partiellement_payee': return 'Partiellement payée';
      case 'annulee': return 'Annulée';
      case 'brouillon': return 'Brouillon';
      default: return statut.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusVariant = (statut: string) => {
    switch (statut) {
      case 'payee': return 'success';
      case 'en_retard': return 'danger';
      case 'envoyee': return 'info';
      case 'partiellement_payee': return 'warning';
      case 'annulee': return 'default';
      default: return 'default';
    }
  };

  const getModePaiementLabel = (mode: string) => {
    switch (mode) {
      case 'especes': return 'Espèces';
      case 'virement': return 'Virement';
      case 'cheque': return 'Chèque';
      case 'carte': return 'Carte bancaire';
      default: return mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusTooltip = (facture: any) => {
    switch (facture.statut) {
      case 'payee': return 'Facture totalement réglée';
      case 'en_retard': return `Facture en retard depuis le ${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}`;
      case 'envoyee': return 'Facture envoyée au client';
      case 'partiellement_payee': return `Montant payé: ${(facture.montantPaye || 0).toLocaleString('fr-FR')} DA`;
      case 'annulee': return 'Facture annulée, non prise en compte dans la comptabilité';
      default: return 'Facture en brouillon';
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
    <RadixTooltip.Provider>
    <div className="space-y-6">
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Factures</h1>
          <p className="text-gray-600">Gestion des factures</p>
        </div>
        <Link to="/factures/nouveau" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle Facture
        </Link>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

        {showBulkActions && (
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-blue-900 font-medium">
                  {selectedFactures.size} facture(s) sélectionnée(s)
                </span>
                <button
                  onClick={clearSelection}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Annuler la sélection
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={bulkMarkAsPaid}
                  disabled={actionLoading}
                  className="btn-success btn-sm disabled:opacity-50"
                >
                  {actionLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Marquer comme payées
                </button>
                <button
                  onClick={bulkSendFactures}
                  disabled={actionLoading}
                  className="btn-info btn-sm disabled:opacity-50"
                >
                  {actionLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Factures"
            value={stats.total}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Clients"
            value={stats.clients}
            icon={Users}
            color="green"
          />
          <StatCard
            title="Fournisseurs"
            value={stats.fournisseurs}
            icon={Building2}
            color="purple"
          />
          <StatCard
            title="Payées"
            value={stats.payees}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            title="Partiellement payées"
            value={stats.partiellementPayees}
            icon={Clock}
            color="yellow"
          />
        </div>

        <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une facture..."
                className="w-full pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
            <div className="flex items-center gap-2">
            <select
              value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="input-field"
            >
              <option value="tous">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="envoyee">Envoyée</option>
                <option value="partiellement_payee">Partiellement payée</option>
              <option value="payee">Payée</option>
              <option value="en_retard">En retard</option>
            </select>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="input-field"
              >
                <option value="tous">Tous les types</option>
                <option value="client">Client</option>
                <option value="fournisseur">Fournisseur</option>
              </select>
              <button
                onClick={exportToCSV}
                className="btn-secondary"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </button>
              {hasPermission('factures', 'creer') && (
                <Link to="/factures/nouveau" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Facture
                </Link>
              )}
          </div>
        </div>
      </div>

      <div className="card">
        <Table>
          <TableHeader>
            <TableRow key="header">
              <TableHeaderCell>Numéro</TableHeaderCell>
                <TableHeaderCell>Client / Fournisseur</TableHeaderCell>
              <TableHeaderCell>Date émission</TableHeaderCell>
                <TableHeaderCell>Date échéance</TableHeaderCell>
              <TableHeaderCell>Montant TTC</TableHeaderCell>
                <TableHeaderCell>Payé</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-gray-400">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedFactures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-gray-400">
                    Aucune facture trouvée
                  </TableCell>
                </TableRow>
              ) : (
                (sortedFactures as Facture[]).map((facture, index) => (
              <TableRow key={facture.id || (facture as any)._id || `facture-${index}`}>
                <TableCell>
                      <span className="font-medium text-gray-900">{facture.numero}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">
                      {facture.client ? 
                        (facture.client?.entreprise || `${facture.client?.prenom || ''} ${facture.client?.nom || ''}`) :
                        facture.fournisseur ? 
                          (facture.fournisseur?.entreprise || facture.fournisseur?.nom) : ''
                      }
                    </p>
                        <p className="text-sm text-gray-500">
                          {facture.client
                            ? facture.client?.email
                            : (facture.fournisseur?.email || 'N/A')}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {facture.client && (
                            <Badge variant="success" className="text-xs">Client</Badge>
                          )}
                          {facture.fournisseur && (
                            <Badge variant="warning" className="text-xs">Fournisseur</Badge>
                          )}
                  </div>
                  </div>
                </TableCell>
                    <TableCell>{new Date(facture.dateEmission).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{(facture.montantTTC || 0).toLocaleString('fr-FR')} DA</TableCell>
                <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {(facture.montantPaye || 0).toLocaleString('fr-FR')} DA
                        </div>
                        <div className={`text-sm ${((facture.montantTTC || 0) - (facture.montantPaye || 0)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Reste: {((facture.montantTTC || 0) - (facture.montantPaye || 0)).toLocaleString('fr-FR')} DA
                    </div>
                      </div>
                </TableCell>
                <TableCell>
                      <Badge variant={getCalculatedStatusVariant(facture)}>{getCalculatedStatusLabel(facture)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedFacture(facture);
                        setShowDetailModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {/* Bouton de prévisualisation PDF */}
                    <button
                      onClick={() => handlePrintPDF(facture.id)}
                      className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                      title="Prévisualiser et imprimer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    
                    {/* Bouton de téléchargement PDF */}
                    <button
                      onClick={() => handleGeneratePDF(facture.id)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Télécharger PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    {facture.statut !== 'payee' && facture.statut !== 'annulee' && hasPermission('factures', 'modifier') && (
                      <button
                        onClick={() => {
                          // Si c'est une facture fournisseur, utiliser le modal spécialisé
                          if (facture.fournisseur) {
                            handlePaiementFournisseur(facture);
                          } else {
                            // Sinon, utiliser le modal de paiement classique
                            setSelectedFacture(facture);
                            setShowPaymentModal(true);
                          }
                        }}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title={facture.fournisseur ? "Payer facture fournisseur" : "Faire un versement"}
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                    {hasPermission('factures', 'modifier') && (
                      <Link
                        to={`/factures/${facture.id}/modifier`}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}
                    {hasPermission('factures', 'supprimer') && (
                      <button
                        onClick={() => handleDelete(facture.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {facture.statut === 'brouillon' && hasPermission('factures', 'modifier') && (
                      <button
                        onClick={() => handleSendFacture(facture.id)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Envoyer la facture"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {facture.statut !== 'annulee' && hasPermission('factures', 'modifier') && (
                      <button
                        onClick={async () => {
                          if (!window.confirm('Voulez-vous vraiment annuler cette facture ?')) return;
                          try {
                            setActionLoading(true);
                            await facturesAPI.cancelFacture(facture.id);
                            setFactures(prev => prev.map(f => f.id === facture.id ? { ...f, statut: 'annulee' } : f));
                            alert('Facture annulée avec succès');
                          } catch (error: any) {
                            console.error('Erreur lors de l\'annulation:', error);
                            alert('Erreur lors de l\'annulation de la facture');
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        title="Annuler la facture"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
                ))
              )}
          </TableBody>
        </Table>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 my-4">
          <div className="flex items-center gap-2">
            <span>Afficher</span>
            <select
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="border rounded px-2 py-1"
            >
              {[10, 20, 50, 100].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span>par page</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >Précédent</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`px-2 py-1 border rounded ${p === page ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >Suivant</button>
          </div>
          <div className="text-sm text-gray-500">Page {page} sur {totalPages} ({total} factures)</div>
      </div>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails de la facture"
        size="xl"
      >
        {selectedFacture && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de facture
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{selectedFacture.numero}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <p className="text-sm text-gray-900">
                      {selectedFacture.client ? 
                        (selectedFacture.client?.entreprise || `${selectedFacture.client?.prenom || ''} ${selectedFacture.client?.nom || ''}`) :
                        selectedFacture.fournisseur ? 
                          selectedFacture.fournisseur?.entreprise || selectedFacture.fournisseur?.nom :
                          'N/A'
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedFacture.client
                        ? selectedFacture.client?.email
                        : (selectedFacture.fournisseur?.email || 'N/A')}
                    </p>
                    {selectedFacture.fournisseur && (
                      <p className="text-xs text-blue-600 font-medium">Fournisseur</p>
                    )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <Badge 
                    variant={
                      selectedFacture.statut === 'payee' ? 'success' :
                      selectedFacture.statut === 'en_retard' ? 'danger' :
                      selectedFacture.statut === 'envoyee' ? 'info' : 'default'
                    }
                  >
                    {getStatusLabel(selectedFacture.statut)}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode de paiement
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedFacture.modePaiement ? getModePaiementLabel(selectedFacture.modePaiement) : 'Non défini'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'émission
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedFacture.dateEmission).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'échéance
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedFacture.dateEcheance).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant total TTC
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {(selectedFacture.montantTTC || 0).toLocaleString('fr-FR')} DA
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
                      <TableHeaderCell>Quantité</TableHeaderCell>
                      <TableHeaderCell>Prix unitaire</TableHeaderCell>
                      <TableHeaderCell>Montant</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedFacture.articles || []).map((article, index) => (
                      <TableRow key={article.id || index}>
                        <TableCell>{article.designation}</TableCell>
                        <TableCell>{article.quantite}</TableCell>
                        <TableCell>
                          {(article.prixUnitaire || 0).toLocaleString('fr-FR')} DA
                        </TableCell>
                        <TableCell>
                          {(article.montant || 0).toLocaleString('fr-FR')} DA
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {Array.isArray(selectedFacture.versements) && selectedFacture.versements.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 mt-6">
                  Historique des versements
                </label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow key="versements-header">
                        <TableHeaderCell>Date</TableHeaderCell>
                        <TableHeaderCell>Montant</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFacture.versements.map((v, idx) => (
                        <TableRow key={v.date || idx}>
                          <TableCell>{new Date(v.date).toLocaleString('fr-FR')}</TableCell>
                          <TableCell>{(v.montant || 0).toLocaleString('fr-FR')} DA</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              {selectedFacture.id && (
                <button 
                  onClick={() => handleGeneratePDF(selectedFacture.id)}
                  disabled={actionLoading}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Télécharger PDF
                </button>
              )}
              {selectedFacture.statut !== 'payee' && selectedFacture.id && (
                <button 
                  onClick={() => handleMarkAsPaid(selectedFacture.id)}
                  disabled={actionLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Marquer comme payée
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Faire un versement"
        size="md"
      >
        {selectedFacture && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Informations de la facture</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Numéro:</span> {selectedFacture.numero}</p>
                  <p><span className="font-medium">Client:</span> {selectedFacture.client ? 
                    (selectedFacture.client?.entreprise || `${selectedFacture.client?.prenom || ''} ${selectedFacture.client?.nom || ''}`) :
                    selectedFacture.fournisseur ? 
                      selectedFacture.fournisseur?.entreprise || selectedFacture.fournisseur?.nom :
                      'N/A'
                  }</p>
                <p className="text-sm text-gray-600">Montant: {(selectedFacture.montantTTC || 0).toLocaleString('fr-FR')} DA</p>
                <p className="text-sm text-gray-600">Payé: {(selectedFacture.montantPaye || 0).toLocaleString('fr-FR')} DA</p>
                <p><span className="font-medium">Reste à payer:</span> <span className="text-red-600 font-medium">
                  {((selectedFacture.montantTTC || 0) - (selectedFacture.montantPaye || 0)).toLocaleString('fr-FR')} DA
                </span></p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant du versement (DA)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={(selectedFacture.montantTTC || 0) - (selectedFacture.montantPaye || 0)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full input-field"
                placeholder="Saisissez le montant du versement"
              />
              <p className="text-sm text-gray-500 mt-1">
                Montant maximum: {((selectedFacture.montantTTC || 0) - (selectedFacture.montantPaye || 0)).toLocaleString('fr-FR')} DA
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode de paiement
              </label>
              <select
                value={paymentMoyen}
                onChange={e => setPaymentMoyen(e.target.value)}
                className="input-field"
              >
                <option value="especes">Espèces</option>
                <option value="virement">Virement</option>
                <option value="cheque">Chèque</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary"
                disabled={paymentLoading}
              >
                Annuler
              </button>
              <button
                onClick={handlePayment}
                disabled={paymentLoading || !paymentAmount || parseFloat(paymentAmount) <= 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Enregistrer le versement
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de paiement fournisseur */}
      <PaiementFournisseurModal
        isOpen={showPaiementFournisseurModal}
        onClose={() => {
          setShowPaiementFournisseurModal(false);
          setSelectedFactureForPaiement(null);
        }}
        facture={selectedFactureForPaiement}
        fournisseur={selectedFactureForPaiement?.fournisseur}
        onSuccess={handlePaiementFournisseurSuccess}
      />
    </div>
    </RadixTooltip.Provider>
  );
};

export default FacturesListPage;