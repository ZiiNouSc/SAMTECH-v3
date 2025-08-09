import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Plane,
  Calendar,
  MapPin,
  Clock,
  Download,
  RotateCw,
  X,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  Circle,
  Trash2,
  Loader2,
  Mail,
  Eye,
  Edit,
  TrendingUp,
  Users,
  Euro,
  Building2,
  Grid,
  Table as TableIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import { billetsAPI } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { fournisseursAPI } from '../../services/api';

const BACKEND_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:8001';

// Ajouter un type minimal BilletAvion pour corriger les erreurs de linter
export type BilletAvion = {
  id?: string;
  _id?: string;
  compagnie?: string;
  code_compagnie?: string;
  logo_compagnie?: string;
  passager?: string;
  type_pax?: string;
  PNR?: string;
  montant_ttc?: number | string;
  montant_ht?: number | string;
  taxes?: number | string;
  classe?: string;
  bagages?: string;
  vols?: any[];
  type_vol?: string;
  date_depart?: string;
  date_retour?: string;
  origine?: string;
  destination?: string;
  statut?: string;
  numero_billet?: string;
  sourceFile?: string;
  informations?: any;
  [key: string]: any;
};

const BilletsListPage: React.FC = () => {
  const [billets, setBillets] = useState<BilletAvion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [selectedBillet, setSelectedBillet] = useState<BilletAvion | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { hasPermission } = usePermissions();
  const [importResults, setImportResults] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState<{open: boolean, billet: any | null}>({open: false, billet: null});
  const [editMode, setEditMode] = useState(false);
  const [editBillet, setEditBillet] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showDetailsModal, setShowDetailsModal] = useState<{open: boolean, billet: any | null}>({open: false, billet: null});
  const [showEditModal, setShowEditModal] = useState<{open: boolean, billet: any | null}>({open: false, billet: null});
  const [editingBillet, setEditingBillet] = useState<string | null>(null);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [showFournisseurModal, setShowFournisseurModal] = useState<{open: boolean, billet: any | null}>({open: false, billet: null});
  const [selectedFournisseur, setSelectedFournisseur] = useState<string>('');
  const [isAttributing, setIsAttributing] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    etape: string;
    message: string;
    pourcentage: number;
    totalTrouves: number;
    totalAnalyses: number;
    totalEnregistres: number;
  } | null>(null);
  const [showSalesStats, setShowSalesStats] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<'day' | 'fortnight' | 'custom'>('day');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [salesStats, setSalesStats] = useState<any[]>([]);

  useEffect(() => {
    fetchBillets();
    // Charger la liste des fournisseurs au montage
    fournisseursAPI.getAll().then(res => {
      setFournisseurs(res.data && Array.isArray(res.data.data) ? res.data.data : []);
    });
  }, []);

  const fetchBillets = async () => {
    try {
      setLoading(true);
      const response = await billetsAPI.getAll();
      const billets = (response.data && Array.isArray(response.data.data) ? response.data.data : []).map((b: any) => ({
        ...b,
        id: b._id || b.id
      }));
      setBillets(billets);
    } catch (error) {
      console.error('Erreur lors du chargement des billets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromGmail = async () => {
    setIsImporting(true);
    setImportProgress({
      etape: 'debut',
      message: 'Démarrage de l\'import...',
      pourcentage: 0,
      totalTrouves: 0,
      totalAnalyses: 0,
      totalEnregistres: 0
    });
    
    try {
      const response = await billetsAPI.importFromGmail();
      
      // Créer un EventSource pour recevoir les mises à jour en temps réel
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Impossible de lire la réponse du serveur');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.progress) {
                setImportProgress({
                  etape: data.progress.etape,
                  message: data.progress.message,
                  pourcentage: data.progress.pourcentage,
                  totalTrouves: data.totalTrouves || 0,
                  totalAnalyses: data.totalAnalyses || 0,
                  totalEnregistres: data.totalEnregistres || 0
                });
              }
              
              // Si l'import est terminé avec succès
              if (data.success && data.progress?.etape === 'termine') {
                console.log('✅ Import Gmail terminé:', data);
                await fetchBillets(); // Rafraîchir la liste
                break;
              }
              
              // Si une erreur survient
              if (data.progress?.etape === 'erreur') {
                console.error('❌ Erreur lors de l\'import:', data.message);
                break;
              }
              
            } catch (parseError) {
              console.error('Erreur parsing JSON:', parseError);
            }
          }
        }
      }
      
    } catch (error: any) {
      console.error('Erreur lors de l\'import depuis Gmail:', error);
      setImportProgress({
        etape: 'erreur',
        message: `Erreur: ${error.message}`,
        pourcentage: 0,
        totalTrouves: 0,
        totalAnalyses: 0,
        totalEnregistres: 0
      });
    } finally {
      setIsImporting(false);
      // Réinitialiser le progress après 5 secondes
      setTimeout(() => {
        setImportProgress(null);
      }, 5000);
    }
  };

  const generateSalesStats = () => {
    if (!billets.length) return [];
    
    const now = new Date();
    const stats: any[] = [];
    
    // Générer des statistiques basées sur les vrais billets
    const billetsWithDates = billets.filter(b => b.date_emission || b.createdAt);
    
    if (salesPeriod === 'day') {
      // Statistiques par jour pour les 7 derniers jours
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('fr-FR');
        
        const billetsOfDay = billetsWithDates.filter(b => {
          const billetDate = b.date_emission ? new Date(b.date_emission) : new Date(b.createdAt);
          return billetDate.toDateString() === date.toDateString();
        });
        
        const revenue = billetsOfDay.reduce((sum, b) => {
          const montant = parseFloat(b.montant_ttc || b.prix || '0');
          return sum + (isNaN(montant) ? 0 : montant);
        }, 0);
        
        const profit = revenue * 0.15; // Marge estimée de 15%
        
        stats.push({
          date: dateStr,
          count: billetsOfDay.length,
          revenue: Math.round(revenue),
          profit: Math.round(profit)
        });
      }
    } else if (salesPeriod === 'fortnight') {
      // Statistiques par quinzaine pour les 4 dernières quinzaines
      for (let i = 3; i >= 0; i--) {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (i + 1) * 15);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 14);
        
        const billetsOfPeriod = billetsWithDates.filter(b => {
          const billetDate = b.date_emission ? new Date(b.date_emission) : new Date(b.createdAt);
          return billetDate >= startDate && billetDate <= endDate;
        });
        
        const revenue = billetsOfPeriod.reduce((sum, b) => {
          const montant = parseFloat(b.montant_ttc || b.prix || '0');
          return sum + (isNaN(montant) ? 0 : montant);
        }, 0);
        
        const profit = revenue * 0.15;
        
        stats.push({
          date: `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`,
          count: billetsOfPeriod.length,
          revenue: Math.round(revenue),
          profit: Math.round(profit)
        });
      }
    } else if (salesPeriod === 'custom') {
      // Statistiques personnalisées
      if (customDateRange.start && customDateRange.end) {
        const startDate = new Date(customDateRange.start);
        const endDate = new Date(customDateRange.end);
        
        const billetsOfPeriod = billetsWithDates.filter(b => {
          const billetDate = b.date_emission ? new Date(b.date_emission) : new Date(b.createdAt);
          return billetDate >= startDate && billetDate <= endDate;
        });
        
        const revenue = billetsOfPeriod.reduce((sum, b) => {
          const montant = parseFloat(b.montant_ttc || b.prix || '0');
          return sum + (isNaN(montant) ? 0 : montant);
        }, 0);
        
        const profit = revenue * 0.15;
        
        stats.push({
          date: `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`,
          count: billetsOfPeriod.length,
          revenue: Math.round(revenue),
          profit: Math.round(profit)
        });
      }
    }
    
    return stats;
  };

  const getStatusIcon = (statut: string) => {
    const realStatut = statut?.toLowerCase() || 'confirmé';
    
    if (['confirme', 'confirmed', 'issued', 'confirmé'].includes(realStatut)) {
      return <Circle className="w-4 h-4 text-green-500 fill-current" />;
    } else if (['en_attente', 'pending'].includes(realStatut)) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    } else if (['annule', 'cancelled', 'void', 'annulé'].includes(realStatut)) {
      return <X className="w-4 h-4 text-red-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  function getUnifiedBilletFields(billet: any) {
    // Logique existante pour unifier les champs
    return {
      id: billet._id || billet.id,
      _id: billet._id || billet.id,
      compagnie: billet.compagnie || billet.informations?.compagnie || billet.airline || '',
      code_compagnie: billet.code_compagnie || billet.informations?.code_compagnie || billet.airline_code || '',
      logo_compagnie: billet.logo_compagnie || billet.informations?.logo_compagnie || '',
      passager: billet.passager || billet.informations?.passager || billet.informations?.nom_passager || billet.passenger_name || '',
      type_pax: billet.type_pax || billet.informations?.type_pax || billet.passenger_type || '',
      PNR: billet.PNR || billet.informations?.PNR || billet.booking_reference || '',
      montant_ttc: billet.montant_ttc || billet.informations?.montant_ttc || billet.informations?.prix_ttc || billet.informations?.prix || billet.total_amount || '',
      montant_ht: billet.montant_ht || billet.informations?.montant_ht || billet.base_amount || '',
      taxes: billet.taxes || billet.informations?.taxes || billet.tax_amount || '',
      classe: billet.classe || billet.informations?.classe || billet.cabin_class || '',
      bagages: billet.bagages || billet.informations?.bagages || billet.baggage || '',
      vols: billet.vols || billet.informations?.vols || billet.flights || [],
      type_vol: billet.type_vol || billet.informations?.type_vol || billet.flight_type || '',
      date_depart: billet.date_depart || billet.informations?.date_depart || billet.departure_date || '',
      date_retour: billet.date_retour || billet.informations?.date_retour || billet.return_date || '',
      origine: billet.origine || billet.informations?.origine || billet.origin || '',
      destination: billet.destination || billet.informations?.destination || billet.destination || '',
      statut: billet.statut || billet.informations?.statut || billet.status || 'confirmé',
      numero_billet: billet.numero_billet || billet.informations?.numero_billet || billet.ticket_number || '',
      sourceFile: billet.sourceFile || '',
      informations: billet.informations || {},
      fournisseurId: billet.fournisseurId || '',
      date_emission: billet.date_emission || billet.informations?.date_emission || billet.issue_date || ''
    };
  }

  function renderDetails(key: string, value: any) {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">Non renseigné</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }
    
    if (typeof value === 'object') {
      return <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>;
    }
    
    return String(value);
  }

  function prettyLabel(label: string) {
    return label
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  }

  function renderEditableFieldsV2(obj: any, setObj: (updater: (prev: any) => any) => void, parentKey = '', fusionKeys: Set<string> = new Set()) {
    const fields = [];
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === '_id' || key === '__v' || fusionKeys.has(key)) continue;
      
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      const label = prettyLabel(key);
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        fields.push(
          <div key={fullKey} className="border-l-2 border-blue-200 pl-4 mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">{label}</h4>
            {renderEditableFieldsV2(value, setObj, fullKey, fusionKeys)}
          </div>
        );
      } else {
        fields.push(
          <div key={fullKey} className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
              type="text"
              value={String(value || '')}
              onChange={(e) => {
              const setDeep = (obj: any, path: string[], val: any) => {
                  const [head, ...tail] = path;
                  if (tail.length === 0) {
                    obj[head] = val;
                } else {
                    if (!obj[head]) obj[head] = {};
                    setDeep(obj[head], tail, val);
                  }
                };
                
                const path = fullKey.split('.');
                setObj(prev => {
                  const newObj = JSON.parse(JSON.stringify(prev));
                  setDeep(newObj, path, e.target.value);
              return newObj;
                });
              }}
              className="input-field w-full"
            />
        </div>
      );
      }
  }

    return fields;
  }

  function getClasseLabel(classe: string) {
    const classes: { [key: string]: string } = {
      'Y': 'Économique',
      'C': 'Affaires',
      'F': 'Première',
      'economy': 'Économique',
      'business': 'Affaires',
      'first': 'Première'
    };
    return classes[classe] || classe;
  }

  function getCompagnieAffichage(compagnie: string, code: string, logo?: string) {
    if (logo) {
    return (
        <div className="flex items-center space-x-2">
          <img 
            src={logo} 
            alt={compagnie || code} 
            className="w-8 h-8 object-contain" // Logo agrandi
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span>{compagnie || code}</span>
        </div>
      );
    }
    return compagnie || code || 'Compagnie inconnue';
  }

  function getStatutLabel(statut: string) {
    const statuts: { [key: string]: string } = {
      'confirme': 'Confirmé',
      'confirmed': 'Confirmé',
      'issued': 'Émis',
      'confirmé': 'Confirmé',
      'en_attente': 'En attente',
      'pending': 'En attente',
      'annule': 'Annulé',
      'cancelled': 'Annulé',
      'void': 'Annulé',
      'annulé': 'Annulé'
    };
    return statuts[statut] || statut;
  }

  // Calcul des statistiques
  const stats = {
    total: (Array.isArray(billets) ? billets : []).length,
    confirmes: (Array.isArray(billets) ? billets : []).filter(b => {
      const realStatut = b.statut || (b.informations && b.informations.statut) || 'confirmé';
      return ['confirme', 'confirmed', 'issued', 'confirmé'].includes(realStatut.toLowerCase());
    }).length,
    enAttente: (Array.isArray(billets) ? billets : []).filter(b => {
      const realStatut = b.statut || (b.informations && b.informations.statut) || 'confirmé';
      return ['en_attente', 'pending'].includes(realStatut.toLowerCase());
    }).length,
    annules: (Array.isArray(billets) ? billets : []).filter(b => {
      const realStatut = b.statut || (b.informations && b.informations.statut) || 'confirmé';
      return ['annule', 'cancelled', 'void', 'annulé'].includes(realStatut.toLowerCase());
    }).length,
    autres: (Array.isArray(billets) ? billets : []).filter(b => {
      const realStatut = b.statut || (b.informations && b.informations.statut) || 'confirmé';
      return !['confirme', 'confirmed', 'issued', 'confirmé', 'en_attente', 'pending', 'annule', 'cancelled', 'void', 'annulé'].includes(realStatut.toLowerCase());
    }).length,
    chiffreAffaires: (Array.isArray(billets) ? billets : []).reduce((sum, b) => {
      const montant = parseFloat(b.montant_ttc || b.informations?.montant_ttc || '0');
      return sum + (isNaN(montant) ? 0 : montant);
    }, 0)
  };

  // Filtrage des billets
  const filteredBillets = (Array.isArray(billets) ? billets : []).filter(billet => {
    const searchLower = searchTerm.toLowerCase();
    const billetStable = getUnifiedBilletFields(billet);
    
    const matchesSearch = (
      billetStable.passager?.toLowerCase().includes(searchLower) ||
      billetStable.compagnie?.toLowerCase().includes(searchLower) ||
      billetStable.PNR?.toLowerCase().includes(searchLower) ||
      billetStable.numero_billet?.toLowerCase().includes(searchLower)
    );

    const matchesStatus = statusFilter === 'tous' || 
      billetStable.statut?.toLowerCase().includes(statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  // Composant réutilisable pour afficher ou éditer les infos billet
  function BilletDetailsForm({ billet, editMode, onChange }: { billet: any, editMode: boolean, onChange?: (updater: (prev: any) => any) => void }) {
    // NE PAS faire : const unified = getUnifiedBilletFields(billet);
    // Utiliser directement billet.xxx partout
    return (
      <div className="space-y-6">
        {/* Section Passager */}
        <div className="border-b pb-4 mb-4">
          <h3 className="text-lg font-bold text-blue-700 mb-2">Informations passager</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Passager</label>
              {editMode ? (
                <input type="text" className="input w-full" value={billet.passager} onChange={e => onChange && onChange(prev => ({ ...prev, passager: e.target.value }))} />
              ) : (
                <div className="py-2">{billet.passager}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date d'émission</label>
              {editMode ? (
                <input type="date" className="input w-full" value={billet.date_emission} onChange={e => onChange && onChange(prev => ({ ...prev, date_emission: e.target.value }))} />
              ) : (
                <div className="py-2">{billet.date_emission}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Numéro de billet</label>
              {editMode ? (
                <input type="text" className="input w-full" value={billet.numero_billet} onChange={e => onChange && onChange(prev => ({ ...prev, numero_billet: e.target.value }))} />
              ) : (
                <div className="py-2">{billet.numero_billet}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Classe</label>
              {editMode ? (
                <input type="text" className="input w-full" value={billet.classe} onChange={e => onChange && onChange(prev => ({ ...prev, classe: e.target.value }))} />
              ) : (
                <div className="py-2">{getClasseLabel(billet.classe)}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type passager</label>
              {editMode ? (
                <select className="input w-full" value={billet.type_pax} onChange={e => onChange && onChange(prev => ({ ...prev, type_pax: e.target.value }))} >
                  <option value="">--</option>
                  <option value="ADT">Adulte (ADT)</option>
                  <option value="CHD">Enfant (CHD)</option>
                  <option value="INF">Bébé (INF)</option>
                </select>
              ) : (
                <div className="py-2">{billet.type_pax}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bagages</label>
              {editMode ? (
                <input type="text" className="input w-full" value={billet.bagages} onChange={e => onChange && onChange(prev => ({ ...prev, bagages: e.target.value }))} />
              ) : (
                <div className="py-2">{billet.bagages}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PNR</label>
              {editMode ? (
                <input type="text" className="input w-full" value={billet.PNR} onChange={e => onChange && onChange(prev => ({ ...prev, PNR: e.target.value }))} />
              ) : (
                <div className="py-2">{billet.PNR}</div>
              )}
            </div>
          </div>
        </div>
        {/* Section Vols */}
        <div className="border-b pb-4 mb-4">
          <h3 className="text-lg font-bold text-blue-700 mb-2">Vols</h3>
          <div className="mb-2 font-semibold">Compagnie : {getCompagnieAffichage(billet.compagnie, billet.code_compagnie, billet.logo_compagnie)}</div>
          {Array.isArray(billet.vols) && billet.vols.length > 0 ? billet.vols.map((vol: any, idx: number) => (
            <div key={idx} className="mb-2 p-2 border rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Numéro de vol</label>
                  {editMode ? (
                    <input type="text" className="input w-full" value={vol.numero_vol || ''} onChange={e => onChange && onChange(prev => ({
                      ...prev,
                      vols: prev.vols.map((v: any, i: number) => i === idx ? { ...v, numero_vol: e.target.value } : v)
                    }))} />
                  ) : (
                    <div className="py-2">{vol.numero_vol || ''}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Départ</label>
                  {editMode ? (
                    <input type="text" className="input w-full" value={vol.depart || ''} onChange={e => onChange && onChange(prev => ({
                      ...prev,
                      vols: prev.vols.map((v: any, i: number) => i === idx ? { ...v, depart: e.target.value } : v)
                    }))} />
                  ) : (
                    <div className="py-2">{vol.depart || ''}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Arrivée</label>
                  {editMode ? (
                    <input type="text" className="input w-full" value={vol.arrivee || ''} onChange={e => onChange && onChange(prev => ({
                      ...prev,
                      vols: prev.vols.map((v: any, i: number) => i === idx ? { ...v, arrivee: e.target.value } : v)
                    }))} />
                  ) : (
                    <div className="py-2">{vol.arrivee || ''}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Date</label>
                  {editMode ? (
                    <input type="date" className="input w-full" value={vol.date || ''} onChange={e => onChange && onChange(prev => ({
                      ...prev,
                      vols: prev.vols.map((v: any, i: number) => i === idx ? { ...v, date: e.target.value } : v)
                    }))} />
                  ) : (
                    <div className="py-2">{vol.date || ''}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Heure départ</label>
                  {editMode ? (
                    <input type="text" className="input w-full" value={vol.heure_depart || ''} onChange={e => onChange && onChange(prev => ({
                      ...prev,
                      vols: prev.vols.map((v: any, i: number) => i === idx ? { ...v, heure_depart: e.target.value } : v)
                    }))} />
                  ) : (
                    <div className="py-2">{vol.heure_depart || ''}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Heure arrivée</label>
                  {editMode ? (
                    <input type="text" className="input w-full" value={vol.heure_arrivee || ''} onChange={e => onChange && onChange(prev => ({
                      ...prev,
                      vols: prev.vols.map((v: any, i: number) => i === idx ? { ...v, heure_arrivee: e.target.value } : v)
                    }))} />
                  ) : (
                    <div className="py-2">{vol.heure_arrivee || ''}</div>
                  )}
                </div>
              </div>
            </div>
          )) : <div className="text-gray-500 italic">Aucun segment de vol</div>}
        </div>
        {/* Section Type de vol */}
        <div className="border-b pb-4 mb-4">
          <h3 className="text-lg font-bold text-blue-700 mb-2">Type de vol</h3>
          {editMode ? (
            <select className="input w-full" value={billet.type_vol} onChange={e => onChange && onChange(prev => ({ ...prev, type_vol: e.target.value }))} >
              <option value="">-- Sélectionner --</option>
              <option value="domestique">Vol domestique (Algérie → Algérie)</option>
              <option value="vers_algerie">Vol vers l'Algérie</option>
              <option value="depuis_algerie">Vol international (depuis Algérie)</option>
              <option value="etranger">Vol étranger (hors Algérie)</option>
            </select>
          ) : (
            <div className="py-2">
              {billet.type_vol === 'domestique' ? 'Vol domestique (Algérie → Algérie)' :
               billet.type_vol === 'vers_algerie' ? 'Vol vers l\'Algérie' :
               billet.type_vol === 'depuis_algerie' ? 'Vol international (depuis Algérie)' :
               billet.type_vol === 'etranger' ? 'Vol étranger (hors Algérie)' :
               billet.type_vol || 'Non spécifié'}
            </div>
          )}
        </div>
        {/* Section Prix */}
        <div className="border-b pb-4 mb-4">
          <h3 className="text-lg font-bold text-blue-700 mb-2">Prix</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Montant TTC</label>
              {editMode ? (
                <input type="number" className="input w-full" value={billet.montant_ttc} onChange={e => onChange && onChange(prev => ({ ...prev, montant_ttc: e.target.value }))} />
              ) : (
                <div className="py-2">{billet.montant_ttc}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Montant HT</label>
              {editMode ? (
                <input type="number" className="input w-full" value={billet.montant_ht} onChange={e => onChange && onChange(prev => ({ ...prev, montant_ht: e.target.value }))} />
              ) : (
                <div className="py-2">{billet.montant_ht}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Taxes</label>
              {editMode ? (
                <input type="number" className="input w-full" value={billet.taxes} onChange={e => onChange && onChange(prev => ({ ...prev, taxes: e.target.value }))} />
              ) : (
                <div className="py-2">{billet.taxes}</div>
              )}
            </div>
          </div>
        </div>
        {/* Section Statut */}
        <div className="border-b pb-4 mb-4">
          <h3 className="text-lg font-bold text-blue-700 mb-2">Statut</h3>
          <div>
            {editMode ? (
              <select
                className="input w-full"
                value={billet.statut}
                onChange={e => onChange && onChange(prev => ({ ...prev, statut: e.target.value }))}
              >
                <option value="">En attente</option>
                {/* STATUTS_POSSIBLES is removed, so this will be empty or need to be redefined */}
                {/* Assuming a default list or that STATUTS_POSSIBLES is no longer needed */}
                {/* For now, keeping the structure but noting the missing import */}
                <option value="confirme">Confirmé</option>
                <option value="en_attente">En attente</option>
                <option value="annule">Annulé</option>
              </select>
            ) : (
              getStatutLabel(billet.statut)
            )}
          </div>
        </div>
        {billet.sourceFile && (
          <div className="mt-2">
            <a href={`${BACKEND_URL}/uploads/${billet.sourceFile}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Voir le fichier source</a>
          </div>
        )}
      </div>
    );
  }

  // 1. ModalDétails : design structuré, lecture seule
  function ModalDetailsBillet({ billet, open, onClose }: { billet: any, open: boolean, onClose: () => void }) {
    // Créer une copie stable des données pour éviter les modifications
    const billetStable = React.useMemo(() => {
      return billet ? getUnifiedBilletFields(billet) : null;
    }, [billet]);
    
    return (
      <Modal isOpen={open} onClose={onClose} title="Détails du billet" size="lg">
        {billetStable ? <BilletDetailsForm billet={billetStable} editMode={false} /> : <div className="text-gray-500">Aucune donnée</div>}
      </Modal>
    );
  }

  // 2. ModalÉdition : design structuré, édition fluide
  function ModalEditBillet({ billet, open, onClose, onSave }: { billet: any, open: boolean, onClose: () => void, onSave: (b: any) => void }) {
    // Créer une copie stable des données pour éviter les modifications
    const billetStable = React.useMemo(() => {
      return billet ? getUnifiedBilletFields(billet) : null;
    }, [billet]);
    
    const [editObj, setEditObj] = useState<any>(billetStable);
    
    // Mettre à jour editObj quand billetStable change
    useEffect(() => { 
      setEditObj(billetStable); 
    }, [billetStable]);
    
    return (
      <Modal isOpen={open} onClose={onClose} title="Modifier le billet" size="lg">
        {!editObj ? (
          <div className="text-gray-500 p-8 text-center">Chargement…</div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); onSave(editObj); }}>
            <BilletDetailsForm billet={editObj} editMode={true} onChange={setEditObj} />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn-primary">Enregistrer</button>
            </div>
          </form>
        )}
      </Modal>
    );
  }

  // Fonction utilitaire pour nettoyer un billet avant enregistrement (pas de doublons, pas de champs inutiles)
  function cleanBilletForSave(billet: any) {
    // On ne garde que les champs techniques + informations
    const cleaned: any = {};
    if (billet._id) cleaned._id = billet._id;
    if (billet.logo_compagnie) cleaned.logo_compagnie = billet.logo_compagnie;
    if (billet.agenceId) cleaned.agenceId = billet.agenceId;
    if (billet.sourceFile) cleaned.sourceFile = billet.sourceFile;
    if (billet.createdAt) cleaned.createdAt = billet.createdAt;
    if (billet.updatedAt) cleaned.updatedAt = billet.updatedAt;
    if (billet.__v !== undefined) cleaned.__v = billet.__v;
    // On met toutes les infos métier dans informations
    cleaned.informations = {
      nom_passager: billet.nom_passager || billet.passager || (billet.informations && billet.informations.nom_passager) || '',
      numero_billet: billet.numero_billet || (billet.informations && billet.informations.numero_billet) || '',
      compagnie_aerienne: billet.compagnie_aerienne || billet.compagnie || (billet.informations && billet.informations.compagnie_aerienne) || '',
      code_compagnie: billet.code_compagnie || (billet.informations && billet.informations.code_compagnie) || '',
      vols: billet.vols || (billet.informations && billet.informations.vols) || [],
      classe: billet.classe || (billet.informations && billet.informations.classe) || '',
      prix: billet.prix || billet.montant_ttc || (billet.informations && (billet.informations.prix || billet.informations.montant_ttc)) || '',
      PNR: billet.PNR || (billet.informations && billet.informations.PNR) || '',
      date_emission: billet.date_emission || (billet.informations && billet.informations.date_emission) || '',
      bagages: billet.bagages || (billet.informations && billet.informations.bagages) || '',
      statut: billet.statut || (billet.informations && billet.informations.statut) || '',
      type_pax: billet.type_pax || (billet.informations && billet.informations.type_pax) || '',
      type_vol: billet.type_vol || (billet.informations && billet.informations.type_vol) || ''
    };
    return cleaned;
  }

  // Fonction de suppression
  const handleDelete = async (billetId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce billet ?')) {
      try {
        await billetsAPI.delete(billetId);
        // Recharger la liste
        fetchBillets();
        alert('Billet supprimé avec succès !');
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        alert(`Erreur lors de la suppression: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleAttribuerFournisseur = (billet: any) => {
    setShowFournisseurModal({open: true, billet});
    setSelectedFournisseur(billet.fournisseurId || '');
  };

  const handleSaveFournisseur = async () => {
    if (!showFournisseurModal.billet || !selectedFournisseur) return;
    setIsAttributing(true);
    try {
      await billetsAPI.update(showFournisseurModal.billet._id, { fournisseurId: selectedFournisseur });
      await fetchBillets();
      setShowFournisseurModal({open: false, billet: null});
      setSelectedFournisseur('');
    } catch (e) {
      alert('Erreur lors de l\'attribution du fournisseur');
    } finally {
      setIsAttributing(false);
    }
  };

  // Mettre à jour les statistiques quand les billets changent
  useEffect(() => {
    const stats = generateSalesStats();
    setSalesStats(stats);
  }, [billets, salesPeriod, customDateRange]);

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
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Billets d'avion</h1>
          <p className="text-gray-600">Gestion des billets d'avion</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleImportFromGmail}
            disabled={isImporting}
            className="btn-secondary flex items-center gap-2"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Capture Billets
          </button>
          <Link to="/billets/nouveau" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouveau Billet
            </Link>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Résultats de l'import Gmail */}
      {importProgress && (
        <div className="card mb-6">
          <h3 className="text-lg font-bold text-blue-700 mb-2">Progression de l'import Gmail</h3>
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="font-semibold text-gray-700">{importProgress.message}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${importProgress.pourcentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {importProgress.pourcentage}% - {importProgress.totalTrouves} billets trouvés, {importProgress.totalAnalyses} analysés, {importProgress.totalEnregistres} enregistrés
          </p>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard 
          title="Total Billets" 
          value={stats.total} 
          icon={Plane} 
          color="blue"
        />
        
        <StatCard 
          title="Confirmés" 
          value={stats.confirmes} 
          icon={Circle} 
          color="green"
        />
        
        <StatCard 
          title="En Attente" 
          value={stats.enAttente} 
          icon={Clock} 
          color="yellow"
        />
        
        <StatCard 
          title="Annulés" 
          value={stats.annules} 
          icon={X} 
          color="red"
        />

        <StatCard 
          title="Autres" 
          value={stats.autres} 
          icon={AlertCircle} 
          color="gray"
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
                placeholder="Rechercher un billet..."
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
              <option value="confirme">Confirmé</option>
              <option value="en_attente">En attente</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Affichage des billets */}
      <div className="overflow-x-auto">
        {filteredBillets.length === 0 ? (
          <div className="text-center py-12">
            <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun billet trouvé</h3>
            <p className="text-gray-500">Aucun billet ne correspond à vos critères de recherche.</p>
                </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compagnie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro billet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PNR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBillets.map((billet) => {
                const billetStable = getUnifiedBilletFields(billet);
                return (
                  <tr key={billetStable._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getCompagnieAffichage(billetStable.compagnie, billetStable.code_compagnie, billetStable.logo_compagnie)}
                </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {billetStable.passager || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {billetStable.numero_billet || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {billetStable.PNR || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getClasseLabel(billetStable.classe)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {billetStable.montant_ttc ? `${billetStable.montant_ttc} DA` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(billetStable.statut)}
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {getStatutLabel(billetStable.statut)}
                        </span>
                </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900" 
                          onClick={() => setShowDetailsModal({open: true, billet: billetStable})}
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                  </button>
                        <button 
                          className="text-green-600 hover:text-green-900" 
                          onClick={() => setShowEditModal({open: true, billet: billetStable})}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                  </button>
                        <button 
                          className="text-orange-600 hover:text-orange-900" 
                          onClick={() => handleAttribuerFournisseur(billetStable)}
                          title="Attribuer fournisseur"
                        >
                          <Building2 className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900" 
                          onClick={() => handleDelete(billetStable._id || '')}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {billetStable.sourceFile && (
                          <a 
                            href={`${BACKEND_URL}/uploads/${billetStable.sourceFile}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
                          >
                            <Download className="w-4 h-4" />
                            <span>Fichier source</span>
                          </a>
                        )}
                </div>
                    </td>
                  </tr>
          );
        })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal détails billet */}
      <ModalDetailsBillet billet={showDetailsModal.billet} open={showDetailsModal.open} onClose={() => setShowDetailsModal({open: false, billet: null})} />

      {/* Modal détails complets */}
      <ModalEditBillet billet={showEditModal.billet} open={showEditModal.open} onClose={() => setShowEditModal({open: false, billet: null})} onSave={async (b) => {
        try {
          const billetId = b.id || b._id;
          const cleaned = cleanBilletForSave(b);
          await billetsAPI.update(billetId, cleaned);
          await fetchBillets();
          setShowEditModal({open: false, billet: null});
        } catch (err) {
          alert('Erreur lors de la sauvegarde du billet.');
        }
      }} />

      {/* Modal d'attribution fournisseur */}
      <Modal isOpen={showFournisseurModal.open} onClose={() => setShowFournisseurModal({open: false, billet: null})} title="Attribuer un fournisseur">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nom de l'entreprise</label>
          <select className="input w-full" value={selectedFournisseur} onChange={e => setSelectedFournisseur(e.target.value)}>
            <option value="">-- Sélectionner un fournisseur --</option>
            {fournisseurs.map(f => (
              <option key={f._id} value={f._id}>{f.entreprise || f.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setShowFournisseurModal({open: false, billet: null})}>Annuler</button>
          <button className="btn-primary" onClick={handleSaveFournisseur} disabled={!selectedFournisseur || isAttributing}>
            {isAttributing ? 'Attribution...' : 'Attribuer'}
              </button>
            </div>
      </Modal>

      {/* Section des statistiques de vente */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">État des ventes</h2>
          <button 
            onClick={() => setShowSalesStats(!showSalesStats)} 
            className="btn-secondary"
          >
            {showSalesStats ? 'Masquer' : 'Afficher'} les statistiques
          </button>
        </div>
        
        {showSalesStats && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Période:</label>
                <select 
                  value={salesPeriod} 
                  onChange={(e) => setSalesPeriod(e.target.value as any)}
                  className="input-field"
                >
                  <option value="day">Par jour</option>
                  <option value="fortnight">Par quinzaine</option>
                  <option value="custom">Personnalisée</option>
                </select>
              </div>
              
              {salesPeriod === 'custom' && (
                <div className="flex items-center space-x-2">
                  <input 
                    type="date" 
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="input-field"
                  />
                  <span>à</span>
                  <input 
                    type="date" 
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="input-field"
                  />
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de billets</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chiffre d'affaires</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marge</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesStats.map((stat, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{stat.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{stat.count}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{stat.revenue.toLocaleString('fr-FR')} DA</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">{stat.profit.toLocaleString('fr-FR')} DA</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">Total</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                      {salesStats.reduce((sum, stat) => sum + stat.count, 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                      {salesStats.reduce((sum, stat) => sum + stat.revenue, 0).toLocaleString('fr-FR')} DA
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-green-600">
                      {salesStats.reduce((sum, stat) => sum + stat.profit, 0).toLocaleString('fr-FR')} DA
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BilletsListPage;