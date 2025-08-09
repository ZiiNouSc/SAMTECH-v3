import React, { useState, useEffect } from 'react';
import { X, Building2, User, Mail, Phone, FileText, DollarSign, Calendar, History, MapPin, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

interface Fournisseur {
  _id?: string;
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  // Données de facturation
  nif: string;
  nis: string;
  art: string;
  // Solde initial
  detteFournisseur: number;
  soldeCrediteur: number;
  notesSolde: string;
  dateCreation?: string;
  montantTotalFacture?: number;
  montantTotalPaye?: number;
  factures?: {
    _id?: string;
    numero?: number;
    date?: string;
    statut: string;
    montantTotal?: number;
    montantPaye?: number;
  }[];
  services?: string[];
  autresService?: string;
  commissionRules?: any[];
  rtsRules?: any[];
}

interface FournisseurModalProps {
  isOpen: boolean;
  onClose: () => void;
  fournisseur: Fournisseur | null;
  isEditing: boolean;
  onSave: () => void;
}

interface Operation {
  _id: string;
  type: string;
  montant: number;
  description: string;
  date: string;
  moyenPaiement: string;
  categorie: string;
}

interface HistoryData {
  fournisseur: Fournisseur;
  operations: Operation[];
  stats: {
    totalOperations: number;
    totalSorties: number;
    totalEntrees: number;
    soldeActuel: number;
  };
}

const FournisseurModal: React.FC<FournisseurModalProps> = ({
  isOpen,
  onClose,
  fournisseur,
  isEditing,
  onSave
}) => {
  const [formData, setFormData] = useState<Fournisseur>({
    nom: '',
    entreprise: '',
    email: '',
    telephone: '',
    adresse: '',
    codePostal: '',
    ville: '',
    pays: 'Algérie',
    nif: '',
    nis: '',
    art: '',
    detteFournisseur: 0,
    soldeCrediteur: 0,
    notesSolde: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [factures, setFactures] = useState<any[]>([]);
  const [loadingFactures, setLoadingFactures] = useState(false);
  const [pageFacture, setPageFacture] = useState(1);
  const [limitFacture, setLimitFacture] = useState(10);
  const [totalFactures, setTotalFactures] = useState(0);
  const [totalPagesFactures, setTotalPagesFactures] = useState(1);
  const [services, setServices] = useState<string[]>(formData.services || []);
  const [autresService, setAutresService] = useState(formData.autresService || '');
  const [commissionRules, setCommissionRules] = useState<any[]>(formData.commissionRules || []);
  const [rtsRules, setRtsRules] = useState<any[]>(formData.rtsRules || []);
  const navigate = useNavigate();

  useEffect(() => {
    if (fournisseur) {
      setFormData(fournisseur);
      if (!isEditing) {
        fetchHistory();
        fetchFactures();
      }
    } else {
      setFormData({
        nom: '',
        entreprise: '',
        email: '',
        telephone: '',
        adresse: '',
        codePostal: '',
        ville: '',
        pays: 'Algérie',
        nif: '',
        nis: '',
        art: '',
        detteFournisseur: 0,
        soldeCrediteur: 0,
        notesSolde: ''
      });
    }
  }, [fournisseur, isEditing]);

  useEffect(() => {
    if (isEditing && services.includes('billets') && commissionRules.length === 0 && rtsRules.length === 0) {
      setCommissionRules([
        { compagnie: 'AH', passager: 'ADT', typeVol: "Vol domestique (Algérie → Algérie)", mode: 'Fixe', valeur: 250, base: 'TTC' },
        { compagnie: 'AH', passager: 'ADT', typeVol: "Vol international (depuis Algérie)", mode: 'Fixe', valeur: 1000, base: 'TTC' },
        { compagnie: 'TU', passager: 'ADT', typeVol: "Vol international (depuis Algérie)", mode: '%', valeur: 2.5, base: 'HT' },
        { compagnie: 'TU', passager: 'ADT', typeVol: "Vol vers l'Algérie", mode: '%', valeur: 2.5, base: 'HT' },
        { compagnie: 'EK', passager: 'ADT', typeVol: "Vol international (depuis Algérie)", mode: '%', valeur: 2.5, base: 'HT' },
        { compagnie: 'QR', passager: 'ADT', typeVol: "Vol international (depuis Algérie)", mode: '%', valeur: 2.5, base: 'HT' },
        { compagnie: 'RJ', passager: 'ADT', typeVol: "Vol international (depuis Algérie)", mode: '%', valeur: 2.5, base: 'HT' },
        { compagnie: 'V7', passager: 'ADT', typeVol: "Vol international (depuis Algérie)", mode: 'Fixe', valeur: 1500, base: 'TTC' },
        { compagnie: 'V7', passager: 'CHD', typeVol: "Vol international (depuis Algérie)", mode: 'Fixe', valeur: 1000, base: 'TTC' },
        { compagnie: 'V7', passager: 'INF', typeVol: "Vol international (depuis Algérie)", mode: 'Fixe', valeur: 500, base: 'TTC' }
      ]);
      setRtsRules([
        { type: 'Modification', compagnie: 'ALL', description: 'Toute compagnie', montant: '595' },
        { type: 'Remboursement', compagnie: 'AH, TK, TB, V7', description: 'selon contrat', montant: '476' },
        { type: 'Remboursement', compagnie: 'TU (ALG→CMN)', description: 'Rem. + frais', montant: '2.5% HT + 476' },
        { type: 'Remboursement', compagnie: 'VY, BJ', description: '', montant: '976' },
        { type: 'Void', compagnie: 'QR, MS', description: 'non justifié', montant: '2.5% HT' }
      ]);
    }
    // eslint-disable-next-line
  }, [services, isEditing]);

  const fetchHistory = async () => {
    if (!fournisseur?._id) return;
    
    try {
      setLoadingHistory(true);
      const response = await api.get(`/fournisseurs/${fournisseur._id}/history`);
      setHistoryData(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchFactures = async () => {
    if (!fournisseur?._id) return;
    setLoadingFactures(true);
    try {
      const response = await api.get(`/fournisseurs/${fournisseur._id}/factures?page=${pageFacture}&limit=${limitFacture}`);
      setFactures(response.data.data || []);
      setTotalFactures(response.data.total || 0);
      setTotalPagesFactures(response.data.totalPages || 1);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    } finally {
      setLoadingFactures(false);
    }
  };

  useEffect(() => {
    if (!isEditing && fournisseur?._id) {
      fetchFactures();
    }
    // eslint-disable-next-line
  }, [fournisseur?._id, pageFacture, limitFacture]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Vérification stricte des champs obligatoires
    if (!formData.entreprise) {
      alert("Le nom de l'entreprise est obligatoire.");
      setLoading(false);
      return;
    }

    try {
      if (fournisseur && isEditing) {
        // Exclure les soldes lors de l'édition
        const { detteFournisseur, soldeCrediteur, notesSolde, ...dataToUpdate } = formData;
        await api.put(`/fournisseurs/${fournisseur._id}`, {
          ...dataToUpdate,
          services,
          autresService,
          commissionRules,
          rtsRules
        });
      } else {
        // Inclure les soldes lors de la création
        await api.post('/fournisseurs', {
          ...formData,
          services,
          autresService,
          commissionRules,
          rtsRules
        });
      }
      onSave();
    } catch (error: any) {
      // Afficher le message d'erreur du backend s'il existe
      const msg = error?.response?.data?.message || error.message || "Erreur inconnue";
      alert("Erreur lors de l'enregistrement : " + msg);
      console.error("Erreur lors de l'enregistrement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (value: string, checked: boolean) => {
    setServices(checked ? [...services, value] : services.filter(s => s !== value));
  };
  const updateCommissionRule = (idx: number, key: string, value: any) => {
    setCommissionRules(rules => rules.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  };
  const removeCommissionRule = (idx: number) => {
    setCommissionRules(rules => rules.filter((_, i) => i !== idx));
  };
  const addCommissionRule = () => {
    setCommissionRules(rules => [...rules, { compagnie: '', passager: 'ADT', typeVol: '', mode: 'Fixe', valeur: '', base: 'TTC' }]);
  };
  const updateRtsRule = (idx: number, key: string, value: any) => {
    setRtsRules(rules => rules.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  };
  const removeRtsRule = (idx: number) => {
    setRtsRules(rules => rules.filter((_, i) => i !== idx));
  };
  const addRtsRule = () => {
    setRtsRules(rules => [...rules, { type: '', compagnie: '', description: '', montant: '' }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing 
              ? (fournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur')
              : 'Détails du fournisseur'
            }
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        {!isEditing && fournisseur && (
          <div className="border-b border-gray-200 mt-4">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Détails
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Historique
              </button>
            </nav>
          </div>
        )}

        <div className="mt-6">
          {isEditing ? (
            /* Form for editing */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Informations principales */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-blue-900 mb-4 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Informations principales
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Nom de l'entreprise *
                    </label>
                    <input
                      type="text"
                      value={formData.entreprise}
                      onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Nom du contact
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Adresse
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse
                    </label>
                    <textarea
                      value={formData.adresse}
                      onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      className="input-field w-full"
                      rows={3}
                      placeholder="Adresse complète"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code postal
                      </label>
                      <input
                        type="text"
                        value={formData.codePostal}
                        onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                        className="input-field w-full"
                        placeholder="Code postal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={formData.ville}
                        onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                        className="input-field w-full"
                        placeholder="Ville"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pays
                      </label>
                      <input
                        type="text"
                        value={formData.pays}
                        onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                        className="input-field w-full"
                        placeholder="Pays"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Données de facturation */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-green-900 mb-4 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Données de facturation (optionnel)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      NIF
                    </label>
                    <input
                      type="text"
                      value={formData.nif}
                      onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      NIS
                    </label>
                    <input
                      type="text"
                      value={formData.nis}
                      onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      ART
                    </label>
                    <input
                      type="text"
                      value={formData.art}
                      onChange={(e) => setFormData({ ...formData, art: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg mt-8">
                <h3 className="text-lg font-bold text-indigo-900 mb-2">Services fournis</h3>
                <div className="flex flex-wrap gap-4 mb-4">
                  {[
                    { label: "Billets d'avion ✈️", value: "billets" },
                    { label: "Visas 🛂", value: "visas" },
                    { label: "Hôtels 🏨", value: "hotels" },
                    { label: "Assurances 📑", value: "assurances" },
                    { label: "Packages 🎒", value: "packages" },
                    { label: "Excursions 🌍", value: "excursions" },
                    { label: "Location de voiture 🚗", value: "location" },
                    { label: "Autres", value: "autres" }
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={services.includes(opt.value)}
                        onChange={e => handleServiceChange(opt.value, e.target.checked)}
                      />
                      {opt.label}
                    </label>
                  ))}
                  {services.includes("autres") && (
                    <input
                      type="text"
                      className="input"
                      placeholder="Précisez..."
                      value={autresService}
                      onChange={e => setAutresService(e.target.value)}
                    />
                  )}
                </div>
                {services.includes('billets') && (
                  <>
                    <h4 className="font-semibold text-indigo-800 mb-2 mt-4">Règles de commissions par compagnie</h4>
                    <table className="table-auto w-full mb-4">
                      <thead>
                        <tr>
                          <th>Compagnie</th>
                          <th>Passager</th>
                          <th>Type de vol</th>
                          <th>Mode</th>
                          <th>Valeur</th>
                          <th>Base</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissionRules.map((row, idx) => (
                          <tr key={idx}>
                            <td><input value={row.compagnie} onChange={e => updateCommissionRule(idx, 'compagnie', e.target.value)} className="input w-20" /></td>
                            <td>
                              <select value={row.passager} onChange={e => updateCommissionRule(idx, 'passager', e.target.value)} className="input w-20">
                                <option>ADT</option><option>CHD</option><option>INF</option>
                              </select>
                            </td>
                            <td><input value={row.typeVol} onChange={e => updateCommissionRule(idx, 'typeVol', e.target.value)} className="input w-40" /></td>
                            <td>
                              <select value={row.mode} onChange={e => updateCommissionRule(idx, 'mode', e.target.value)} className="input w-16">
                                <option>Fixe</option><option>%</option>
                              </select>
                            </td>
                            <td><input type="number" value={row.valeur} onChange={e => updateCommissionRule(idx, 'valeur', e.target.value)} className="input w-16" /></td>
                            <td>
                              <select value={row.base} onChange={e => updateCommissionRule(idx, 'base', e.target.value)} className="input w-16">
                                <option>HT</option><option>TTC</option>
                              </select>
                            </td>
                            <td>
                              <button type="button" onClick={() => removeCommissionRule(idx)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button type="button" onClick={addCommissionRule} className="btn-secondary mb-4"><Plus className="w-4 h-4 mr-1" />Ajouter une ligne</button>
                    <h4 className="font-semibold text-indigo-800 mb-2 mt-4">Frais de fonctionnement & après-vente (RTS)</h4>
                    <table className="table-auto w-full mb-4">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Compagnie</th>
                          <th>Description</th>
                          <th>Montant</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rtsRules.map((row, idx) => (
                          <tr key={idx}>
                            <td><input value={row.type} onChange={e => updateRtsRule(idx, 'type', e.target.value)} className="input w-24" /></td>
                            <td><input value={row.compagnie} onChange={e => updateRtsRule(idx, 'compagnie', e.target.value)} className="input w-24" /></td>
                            <td><input value={row.description} onChange={e => updateRtsRule(idx, 'description', e.target.value)} className="input w-40" /></td>
                            <td><input value={row.montant} onChange={e => updateRtsRule(idx, 'montant', e.target.value)} className="input w-16" /></td>
                            <td>
                              <button type="button" onClick={() => removeRtsRule(idx)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button type="button" onClick={addRtsRule} className="btn-secondary"><Plus className="w-4 h-4 mr-1" />Ajouter une ligne</button>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          ) : activeTab === 'details' ? (
            /* Display details */
            <div className="space-y-6">
              
              {/* Informations principales */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-blue-900 mb-4 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Informations principales
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-500">Entreprise</label>
                    <p className="mt-1 text-sm text-blue-900 font-medium">{formData.entreprise}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-500">Contact</label>
                    <p className="mt-1 text-sm text-blue-900">{formData.nom || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-500">Email</label>
                    <p className="mt-1 text-sm text-blue-900">{formData.email || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-500">Téléphone</label>
                    <p className="mt-1 text-sm text-blue-900">{formData.telephone || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Adresse
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{formData.adresse || 'Non renseigné'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code postal
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{formData.codePostal || 'Non renseigné'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{formData.ville || 'Non renseigné'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pays
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{formData.pays || 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Données de facturation */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-green-900 mb-4 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Données de facturation
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-500">NIF</label>
                    <p className="mt-1 text-sm text-green-900">{formData.nif || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-500">NIS</label>
                    <p className="mt-1 text-sm text-green-900">{formData.nis || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-500">ART</label>
                    <p className="mt-1 text-sm text-green-900">{formData.art || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>

              {/* Soldes */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-orange-900 mb-4 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Soldes
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-500">Dette fournisseur</label>
                    <div className="mt-1">
                      <Badge 
                        variant={(formData.detteFournisseur || 0) > 0 ? 'danger' : 'success'}
                      >
                        {(formData.detteFournisseur || 0).toLocaleString('fr-FR')} DA
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-500">Solde créditeur</label>
                    <div className="mt-1">
                      <Badge 
                        variant={(formData.soldeCrediteur || 0) > 0 ? 'success' : 'default'}
                      >
                        {(formData.soldeCrediteur || 0).toLocaleString('fr-FR')} DA
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {formData.notesSolde && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-orange-500">Notes sur le solde initial</label>
                    <p className="mt-1 text-sm text-orange-900">{formData.notesSolde}</p>
                  </div>
                )}
              </div>

              {formData.dateCreation && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Informations système
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date de création</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(formData.dateCreation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}

              {/* BOUTON VOIR LE PROFIL FOURNISSEUR */}
              {formData._id && (
                <div className="flex justify-end mt-8">
                  <button
                    className="btn-primary px-5 py-2 shadow-lg rounded-md"
                    style={{ minWidth: 200 }}
                    onClick={() => {
                      onClose();
                      navigate(`/fournisseurs/${formData._id}`);
                    }}
                  >
                    Voir le profil fournisseur
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* History tab */
            <div className="space-y-6">
              {loadingHistory ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : historyData ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Total Opérations
                      </p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {historyData.stats.totalOperations}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-xs font-medium text-red-500 uppercase tracking-wide">
                        Total Sorties
                      </p>
                      <p className="mt-2 text-lg font-semibold text-red-900">
                        {historyData.stats.totalSorties.toLocaleString('fr-FR')} DA
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-xs font-medium text-green-500 uppercase tracking-wide">
                        Total Entrées
                      </p>
                      <p className="mt-2 text-lg font-semibold text-green-900">
                        {historyData.stats.totalEntrees.toLocaleString('fr-FR')} DA
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-xs font-medium text-blue-500 uppercase tracking-wide">
                        Solde Actuel
                      </p>
                      <p className="mt-2 text-lg font-semibold text-blue-900">
                        {historyData.stats.soldeActuel.toLocaleString('fr-FR')} DA
                      </p>
                    </div>
                  </div>

                  {/* Operations list */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Historique des opérations</h3>
                    {historyData.operations.length > 0 ? (
                      <div className="space-y-3">
                        {historyData.operations.map((operation) => (
                          <div key={operation._id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{operation.description}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(operation.date).toLocaleDateString('fr-FR')} - {operation.categorie}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`font-semibold ${
                                  operation.type === 'entree' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {operation.type === 'entree' ? '+' : '-'}{operation.montant.toLocaleString('fr-FR')} DA
                                </p>
                                <p className="text-sm text-gray-500">{operation.moyenPaiement}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Aucune opération trouvée</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune donnée d'historique disponible</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FournisseurModal;
