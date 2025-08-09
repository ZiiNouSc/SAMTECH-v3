import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2, User, Mail, Phone, MapPin, DollarSign, FileText, Plus, Trash2, Plane, Stamp, Hotel, Shield, Briefcase, Globe, Car, MoreHorizontal, Search, Loader2 } from 'lucide-react';
import { fournisseursAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface FournisseurFormData {
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  // Données de facturation (nouveaux champs)
  nif: string;
  nis: string;
  art: string;
  // Solde initial (soit dette soit crédit)
  typeSoldeInitial: 'dette' | 'credit' | '';
  montantSoldeInitial: number;
  notesSolde: string;
}

const CreateFournisseurPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FournisseurFormData>({
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
    typeSoldeInitial: '',
    montantSoldeInitial: 0,
    notesSolde: ''
  });
  const [services, setServices] = useState<string[]>([]);
  const [autresService, setAutresService] = useState('');
  const [commissionRules, setCommissionRules] = useState([
    { compagnie: 'ALL', passager: 'ALL', typeVol: 'ALL', classe: 'ALL', mode: 'Fixe', valeur: 1000, base: 'TTC' }
  ]);
  const [rtsRules, setRtsRules] = useState<any[]>([]);

  // États pour l'autocomplétion des compagnies
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [showRtsCompanySuggestions, setShowRtsCompanySuggestions] = useState(false);
  const [searchingCompany, setSearchingCompany] = useState(false);
  const [activeCompanySearch, setActiveCompanySearch] = useState<number | null>(null);
  const [activeRtsCompanySearch, setActiveRtsCompanySearch] = useState<number | null>(null);

  useEffect(() => {
    if (services.includes('billets') && commissionRules.length === 0 && rtsRules.length === 0) {
      setCommissionRules([
        { compagnie: 'ALL', passager: 'ALL', typeVol: 'ALL', classe: 'ALL', mode: 'Fixe', valeur: 1000, base: 'TTC' }
      ]);
      setRtsRules([
        { compagnie: 'ALL', type: 'Modifier', montant: '595' },
        { compagnie: 'AH, TK, TB, V7', type: 'Remboursé', montant: '476' },
        { compagnie: 'TU (ALG→CMN)', type: 'Remboursé', montant: '2.5% HT + 476' },
        { compagnie: 'VY, BJ', type: 'Remboursé', montant: '976' },
        { compagnie: 'QR, MS', type: 'Annulé', montant: '2.5% HT' }
      ]);
    }
  }, [services]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.nom) {
      alert("Le nom du contact est obligatoire.");
      setLoading(false);
      return;
    }

    try {
      // Préparer les données pour l'envoi
      const fournisseurData = {
        nom: formData.nom,
        entreprise: formData.entreprise,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresse,
        codePostal: formData.codePostal,
        ville: formData.ville,
        pays: formData.pays,
        nif: formData.nif,
        nis: formData.nis,
        art: formData.art,
        // Traiter le solde initial selon le type choisi
        detteFournisseur: formData.typeSoldeInitial === 'dette' ? formData.montantSoldeInitial : 0,
        soldeCrediteur: formData.typeSoldeInitial === 'credit' ? formData.montantSoldeInitial : 0,
        notesSolde: formData.notesSolde,
        services,
        autresService,
        commissionRules,
        rtsRules
      };

      await fournisseursAPI.create(fournisseurData);
      navigate('/fournisseurs');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Erreur inconnue";
      alert("Erreur lors de l'enregistrement : " + msg);
      console.error("Erreur lors de l'enregistrement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['montantSoldeInitial'].includes(name) ? Number(value) || 0 : value
    }));
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
    setCommissionRules(rules => [...rules, { compagnie: 'ALL', passager: 'ALL', typeVol: 'ALL', classe: 'ALL', mode: 'Fixe', valeur: 0, base: 'TTC' }]);
  };
  const updateRtsRule = (idx: number, key: string, value: any) => {
    setRtsRules(rules => rules.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  };
  const removeRtsRule = (idx: number) => {
    setRtsRules(rules => rules.filter((_, i) => i !== idx));
  };
  const addRtsRule = () => {
    setRtsRules(rules => [...rules, { compagnie: 'ALL', type: '', montant: '' }]);
  };

  // Fonction de recherche de compagnie avec autocomplétion pour les commissions
  const searchCompany = async (query: string, ruleIndex: number) => {
    if (query.length < 2) {
      setCompanySuggestions([]);
      setShowCompanySuggestions(false);
      return;
    }

    setSearchingCompany(true);
    setActiveCompanySearch(ruleIndex);
    
    try {
      const response = await fetch(`/api/fournisseurs/search-companies?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('samtech_user') || '{}').token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanySuggestions(data.companies || []);
        setShowCompanySuggestions(true);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de compagnie:', error);
      setCompanySuggestions([]);
    } finally {
      setSearchingCompany(false);
    }
  };

  // Fonction de recherche de compagnie avec autocomplétion pour les RTS
  const searchRtsCompany = async (query: string, ruleIndex: number) => {
    if (query.length < 2) {
      setCompanySuggestions([]);
      setShowRtsCompanySuggestions(false);
      return;
    }

    setSearchingCompany(true);
    setActiveRtsCompanySearch(ruleIndex);
    
    try {
      const response = await fetch(`/api/fournisseurs/search-companies?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('samtech_user') || '{}').token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanySuggestions(data.companies || []);
        setShowRtsCompanySuggestions(true);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de compagnie:', error);
      setCompanySuggestions([]);
    } finally {
      setSearchingCompany(false);
    }
  };

  // Sélection d'une compagnie depuis les suggestions
  const selectCompany = (company: any, ruleIndex: number) => {
    updateCommissionRule(ruleIndex, 'compagnie', company.id);
    setShowCompanySuggestions(false);
    setCompanySuggestions([]);
    setActiveCompanySearch(null);
  };

  // Sélection d'une compagnie pour RTS depuis les suggestions
  const selectRtsCompany = (company: any, ruleIndex: number) => {
    updateRtsRule(ruleIndex, 'compagnie', company.id);
    setShowRtsCompanySuggestions(false);
    setCompanySuggestions([]);
    setActiveRtsCompanySearch(null);
  };

  // Fermer les suggestions quand on clique ailleurs
  const handleClickOutside = () => {
    setTimeout(() => {
      setShowCompanySuggestions(false);
      setShowRtsCompanySuggestions(false);
      setActiveCompanySearch(null);
      setActiveRtsCompanySearch(null);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/fournisseurs')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nouveau Fournisseur</h1>
            <p className="text-gray-600">Ajouter un nouveau fournisseur à votre base</p>
          </div>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Informations principales */}
          <div className="p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Informations principales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Building2 className="inline w-4 h-4 mr-1" />
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  name="entreprise"
                  value={formData.entreprise}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  placeholder="Nom de l'entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Nom du contact *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom et prénom du contact"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Numéro de téléphone"
                />
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Adresse
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Adresse complète
                </label>
                <textarea
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Numéro, rue, quartier..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Code postal
                  </label>
                  <input
                    type="text"
                    name="codePostal"
                    value={formData.codePostal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Code postal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Ville"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pays
                  </label>
                  <input
                    type="text"
                    name="pays"
                    value={formData.pays}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Pays"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Données de facturation */}
          <div className="p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Données de facturation (optionnel)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  NIF
                </label>
                <input
                  type="text"
                  name="nif"
                  value={formData.nif}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Numéro d'identification fiscale"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  NIS
                </label>
                <input
                  type="text"
                  name="nis"
                  value={formData.nis}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Numéro d'identification statistique"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ART
                </label>
                <input
                  type="text"
                  name="art"
                  value={formData.art}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Numéro d'article"
                />
              </div>
            </div>
          </div>

          {/* Solde initial */}
          <div className="p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Solde initial (optionnel)
            </h2>
            <p className="text-sm text-orange-700 mb-4">
              Ces montants n'ont aucun impact sur la caisse. Ils servent uniquement à initialiser 
              les soldes si le fournisseur avait déjà un solde ou une dette avant l'utilisation de SamTech.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Type de solde initial
                </label>
                <select
                  name="typeSoldeInitial"
                  value={formData.typeSoldeInitial}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Aucun solde initial</option>
                  <option value="credit">Solde créditeur (nous devons de l'argent au fournisseur)</option>
                  <option value="dette">Dette fournisseur (le fournisseur nous doit de l'argent)</option>
                </select>
              </div>
              
              {formData.typeSoldeInitial && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Montant ({formData.typeSoldeInitial === 'credit' ? 'Solde créditeur' : 'Dette fournisseur'})
                    </label>
                    <input
                      type="number"
                      name="montantSoldeInitial"
                      value={formData.montantSoldeInitial}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Notes sur le solde initial
                    </label>
                    <textarea
                      name="notesSolde"
                      value={formData.notesSolde}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={3}
                      placeholder="Explications sur le solde initial..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Services fournis */}
          <div className="p-4 rounded-lg mt-8">
            <h3 className="text-lg font-bold mb-2">Services fournis</h3>
            <div className="flex flex-wrap gap-4 mb-4">
              {[
                { label: "Billets d'avion", value: "billets", icon: <Plane className="w-4 h-4 mr-1" /> },
                { label: "Visas", value: "visas", icon: <Stamp className="w-4 h-4 mr-1" /> },
                { label: "Hôtels", value: "hotels", icon: <Hotel className="w-4 h-4 mr-1" /> },
                { label: "Assurances", value: "assurances", icon: <Shield className="w-4 h-4 mr-1" /> },
                { label: "Packages", value: "packages", icon: <Briefcase className="w-4 h-4 mr-1" /> },
                { label: "Excursions", value: "excursions", icon: <Globe className="w-4 h-4 mr-1" /> },
                { label: "Location de voiture", value: "location", icon: <Car className="w-4 h-4 mr-1" /> },
                { label: "Autres", value: "autres", icon: <MoreHorizontal className="w-4 h-4 mr-1" /> }
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={services.includes(opt.value)}
                    onChange={e => handleServiceChange(opt.value, e.target.checked)}
                  />
                  {opt.icon}{opt.label}
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
                <h4 className="font-semibold mb-2 mt-4">Règles de commissions par compagnie</h4>
                <table className="table-auto w-full border border-gray-200">
                  <thead>
                    <tr>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Compagnie</th>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Passager</th>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Type de vol</th>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Classe</th>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Mode</th>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Valeur</th>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Base</th>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionRules.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle relative">
                          <div className="relative">
                            <input 
                              value={row.compagnie} 
                              onChange={e => {
                                updateCommissionRule(idx, 'compagnie', e.target.value);
                                searchCompany(e.target.value, idx);
                              }}
                              onFocus={() => setShowCompanySuggestions(true)}
                              onBlur={handleClickOutside}
                              className="input w-32" 
                              placeholder="Code ou nom"
                            />
                            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                          
                          {/* Suggestions de compagnies */}
                          {showCompanySuggestions && activeCompanySearch === idx && (
                            <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                              {searchingCompany ? (
                                <div className="p-2 text-center text-gray-500">
                                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                  Recherche en cours...
                                </div>
                              ) : companySuggestions.length > 0 ? (
                                <>
                                  {/* Option "Tous" */}
                                  <div 
                                    className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                                    onClick={() => selectCompany({ id: 'ALL', name: 'Toutes les compagnies' }, idx)}
                                  >
                                    <div className="font-medium text-blue-600">ALL</div>
                                    <div className="text-sm text-gray-600">Toutes les compagnies</div>
                                  </div>
                                  
                                  {/* Résultats de recherche */}
                                  {companySuggestions.map((company, companyIdx) => (
                                    <div 
                                      key={companyIdx}
                                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                      onClick={() => selectCompany(company, idx)}
                                    >
                                      {company.logo && (
                                        <img src={company.logo} alt={company.name} className="w-4 h-4 rounded" />
                                      )}
                                      <div>
                                        <div className="font-medium">{company.id}</div>
                                        <div className="text-sm text-gray-600">{company.name}</div>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <div className="p-2 text-center text-gray-500">
                                  Aucune compagnie trouvée
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle">
                          <select value={row.passager} onChange={e => updateCommissionRule(idx, 'passager', e.target.value)} className="input w-20">
                            <option value="ALL">Tous</option>
                            <option value="ADT">ADT</option>
                            <option value="CHD">CHD</option>
                            <option value="INF">INF</option>
                          </select>
                        </td>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle">
                          <select 
                            value={row.typeVol} 
                            onChange={e => updateCommissionRule(idx, 'typeVol', e.target.value)} 
                            className="input w-40"
                          >
                            <option value="ALL">Tous</option>
                            <option value="domestique">Vol domestique (Algérie → Algérie)</option>
                            <option value="vers_algerie">Vol vers l'Algérie</option>
                            <option value="depuis_algerie">Vol international (depuis Algérie)</option>
                            <option value="etranger">Vol étranger (hors Algérie)</option>
                          </select>
                        </td>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle">
                          <select value={row.classe || ''} onChange={e => updateCommissionRule(idx, 'classe', e.target.value)} className="input w-20">
                            <option value="ALL">Toutes</option>
                            <option value="First">First</option>
                            <option value="Business">Business</option>
                            <option value="Economy">Economy</option>
                          </select>
                        </td>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle">
                          <select value={row.mode} onChange={e => updateCommissionRule(idx, 'mode', e.target.value)} className="input w-16">
                            <option>Fixe</option><option>%</option>
                          </select>
                        </td>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle"><input type="number" value={row.valeur} onChange={e => updateCommissionRule(idx, 'valeur', e.target.value)} className="input w-16" /></td>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle">
                          <select value={row.base} onChange={e => updateCommissionRule(idx, 'base', e.target.value)} className="input w-16">
                            <option>HT</option><option>TTC</option>
                          </select>
                        </td>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle">
                          <button type="button" onClick={() => removeCommissionRule(idx)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={addCommissionRule} className="btn-secondary mb-4"><Plus className="w-4 h-4 mr-1" />Ajouter une ligne</button>
                <h4 className="font-semibold mb-2 mt-4">Frais de fonctionnement & après-vente (RTS)</h4>
                <table className="table-auto w-full border border-gray-200">
                  <thead>
                    <tr>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Compagnie</th>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Type</th>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Montant</th>
                      <th className="font-semibold border-b border-gray-200 py-2 px-2 align-middle">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rtsRules.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle relative">
                          <div className="relative">
                            <input 
                              value={row.compagnie} 
                              onChange={e => {
                                updateRtsRule(idx, 'compagnie', e.target.value);
                                searchRtsCompany(e.target.value, idx);
                              }}
                              onFocus={() => {
                                setActiveRtsCompanySearch(idx);
                                setShowRtsCompanySuggestions(true);
                              }}
                              onBlur={() => setTimeout(() => {
                                setActiveRtsCompanySearch(null);
                                setShowRtsCompanySuggestions(false);
                              }, 200)}
                              className="input w-32" 
                              placeholder="Code ou nom"
                            />
                            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                          
                          {/* Suggestions de compagnies */}
                          {showRtsCompanySuggestions && activeRtsCompanySearch === idx && (
                            <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                              {searchingCompany ? (
                                <div className="p-2 text-center text-gray-500">
                                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                  Recherche en cours...
                                </div>
                              ) : companySuggestions.length > 0 ? (
                                <>
                                  {/* Option "Tous" */}
                                  <div 
                                    className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                                    onClick={() => selectRtsCompany({ id: 'ALL', name: 'Toutes les compagnies' }, idx)}
                                  >
                                    <div className="font-medium text-blue-600">ALL</div>
                                    <div className="text-sm text-gray-600">Toutes les compagnies</div>
                                  </div>
                                  
                                  {/* Résultats de recherche */}
                                  {companySuggestions.map((company, companyIdx) => (
                                    <div 
                                      key={companyIdx}
                                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                      onClick={() => selectRtsCompany(company, idx)}
                                    >
                                      {company.logo && (
                                        <img src={company.logo} alt={company.name} className="w-4 h-4 rounded" />
                                      )}
                                      <div>
                                        <div className="font-medium">{company.id}</div>
                                        <div className="text-sm text-gray-600">{company.name}</div>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <div className="p-2 text-center text-gray-500">
                                  Aucune compagnie trouvée
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle">
                          <select value={row.type} onChange={e => updateRtsRule(idx, 'type', e.target.value)} className="input w-24">
                            <option value="">-- Sélectionner --</option>
                            <option value="Annulé">Annulé</option>
                            <option value="Modifier">Modifier</option>
                            <option value="Remboursé">Remboursé</option>
                          </select>
                        </td>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle">
                          <input value={row.montant} onChange={e => updateRtsRule(idx, 'montant', e.target.value)} className="input w-16" placeholder="Montant" />
                        </td>
                        <td className="border-b border-gray-100 py-2 px-2 align-middle">
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

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/fournisseurs')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Créer le fournisseur
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateFournisseurPage; 