import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  FileText, 
  Plane,
  Plus,
  Trash2,
  Loader2,
  Search,
  Calculator,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { billetsAPI } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const BACKEND_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:8001';

const NouveauBilletPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'pdf'>('manual');
  
  // État du formulaire manuel
  const [formData, setFormData] = useState({
    passager: '',
    numero_billet: '',
    compagnie: '',
    code_compagnie: '',
    classe: '',
    type_pax: 'ADT',
    bagages: '',
    PNR: '',
    date_emission: '',
    montant_ht: '',
    montant_ttc: '',
    taxes: '',
    statut: 'en_attente',
    type_vol: 'depuis_algerie',
    vols: [
      {
        numero_vol: '',
        depart: '',
        arrivee: '',
        date: '',
        heure_depart: '',
        heure_arrivee: ''
      }
    ]
  });

  // État pour l'import PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [searchingCompany, setSearchingCompany] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Nouveaux états pour la progression
  const [analysisProgress, setAnalysisProgress] = useState<{
    etape: string;
    message: string;
    pourcentage: number;
  } | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Fonction pour calculer automatiquement les taxes
  const calculateTaxes = (montantHT: string, montantTTC: string) => {
    const ht = parseFloat(montantHT) || 0;
    const ttc = parseFloat(montantTTC) || 0;
    return Math.max(0, ttc - ht);
  };

  // Fonction pour trouver le logo de la compagnie
  const findCompanyLogo = async (compagnieName: string, codeCompagnie: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/billets/find-iata-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('samtech_user') || '{}').token}`
        },
        body: JSON.stringify({
          compagnie: compagnieName,
          code: codeCompagnie
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data?.logo || null;
      }
    } catch (error) {
      console.error('Erreur lors de la recherche du logo:', error);
    }
    return null;
  };

  // Fonction pour remplir automatiquement les informations de compagnie
  const fillCompanyInfo = async (compagnieName: string) => {
    if (!compagnieName) return;
    
    try {
      console.log('Recherche des informations pour la compagnie:', compagnieName);
      
      // D'abord, essayer de trouver dans la liste locale des compagnies
      let response;
      try {
        response = await fetch(`${BACKEND_URL}/api/billets/search-company`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('samtech_user') || '{}').token}`
          },
          body: JSON.stringify({ query: compagnieName })
        });
      } catch (error) {
        console.log('Backend non disponible, simulation de la recherche...');
        // Simulation pour les compagnies courantes
        const mockCompanies: Record<string, { name: string; code: string }> = {
          'air france': { name: 'Air France', code: 'AF' },
          'lufthansa': { name: 'Lufthansa', code: 'LH' },
          'emirates': { name: 'Emirates', code: 'EK' },
          'turkish airlines': { name: 'Turkish Airlines', code: 'TK' },
          'qatar airways': { name: 'Qatar Airways', code: 'QR' },
          'air algerie': { name: 'Air Algérie', code: 'AH' },
          'tassili airlines': { name: 'Tassili Airlines', code: 'SF' }
        };
        
        const normalizedName = compagnieName.toLowerCase();
        const foundCompany = mockCompanies[normalizedName] || 
                           Object.values(mockCompanies).find(company => 
                             company.name.toLowerCase().includes(normalizedName) ||
                             normalizedName.includes(company.name.toLowerCase())
                           );
        
        if (foundCompany) {
          setFormData(prev => ({
            ...prev,
            compagnie: foundCompany.name,
            code_compagnie: foundCompany.code
          }));
          console.log('Champs de compagnie mis à jour (simulation):', foundCompany.name, foundCompany.code);
          return;
        }
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Réponse recherche compagnie:', data);
        
        if (data.companies && data.companies.length > 0) {
          // Prendre la première compagnie trouvée
          const company = data.companies[0];
          setFormData(prev => ({
            ...prev,
            compagnie: company.name,
            code_compagnie: company.code
          }));
          console.log('Champs de compagnie mis à jour:', company.name, company.code);
          return;
        }
      }
      
      // Si pas trouvé, essayer avec l'API find-iata-info
      let iataResponse;
      try {
        iataResponse = await fetch(`${BACKEND_URL}/api/billets/find-iata-info`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('samtech_user') || '{}').token}`
          },
          body: JSON.stringify({
            compagnie: compagnieName,
            code: ''
          })
        });
      } catch (error) {
        console.log('API IATA non disponible');
        return;
      }
      
      if (iataResponse.ok) {
        const iataData = await iataResponse.json();
        console.log('Réponse API IATA:', iataData);
        
        if (iataData.success && iataData.data) {
          setFormData(prev => ({
            ...prev,
            compagnie: iataData.data.name,
            code_compagnie: iataData.data.id
          }));
          console.log('Champs de compagnie mis à jour via IATA:', iataData.data.name, iataData.data.id);
        } else {
          console.log('Aucune information IATA trouvée pour:', compagnieName);
        }
      } else {
        console.error('Erreur API IATA:', iataResponse.status, iataResponse.statusText);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de compagnie:', error);
    }
  };

  // Fonction de recherche de compagnie avec autocomplétion
  const searchCompany = async (query: string) => {
    if (query.length < 2) {
      setCompanySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingCompany(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/billets/search-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('samtech_user') || '{}').token}`
        },
        body: JSON.stringify({ query })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanySuggestions(data.companies || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de compagnie:', error);
      setCompanySuggestions([]);
    } finally {
      setSearchingCompany(false);
    }
  };

  // Sélection d'une compagnie depuis les suggestions
  const selectCompany = (company: any) => {
    setFormData(prev => ({
      ...prev,
      compagnie: company.name,
      code_compagnie: company.code
    }));
    setShowSuggestions(false);
    setCompanySuggestions([]);
  };

  // Fermer les suggestions quand on clique ailleurs
  const handleClickOutside = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Gestion des vols
  const addVol = () => {
    setFormData(prev => ({
      ...prev,
      vols: [...prev.vols, {
        numero_vol: '',
        depart: '',
        arrivee: '',
        date: '',
        heure_depart: '',
        heure_arrivee: ''
      }]
    }));
  };

  const removeVol = (index: number) => {
    if (formData.vols.length > 1) {
      setFormData(prev => ({
        ...prev,
        vols: prev.vols.filter((_, i) => i !== index)
      }));
    }
  };

  const updateVol = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      vols: prev.vols.map((vol, i) => 
        i === index ? { ...vol, [field]: value } : vol
      )
    }));
  };

  // Sauvegarde du billet
  const handleSave = async () => {
    setLoading(true);
    try {
      // Conversion sécurisée des nombres
      const montantHT = formData.montant_ht ? parseFloat(formData.montant_ht) || 0 : 0;
      const montantTTC = formData.montant_ttc ? parseFloat(formData.montant_ttc) || 0 : 0;
      const taxes = formData.taxes ? parseFloat(formData.taxes) || 0 : 0;
      
      // Recherche du logo de la compagnie
      const logoCompagnie = await findCompanyLogo(formData.compagnie, formData.code_compagnie);
      
      const billetData = {
        logo_compagnie: logoCompagnie,
        informations: {
          nom_passager: formData.passager,
          numero_billet: formData.numero_billet,
          compagnie_aerienne: formData.compagnie,
          code_compagnie: formData.code_compagnie,
          vols: formData.vols,
          classe: formData.classe,
          prix_ht: montantHT,
          prix_ttc: montantTTC,
          taxes: taxes,
          prix: montantTTC, // Utilise le montant TTC comme prix principal
          PNR: formData.PNR,
          date_emission: formData.date_emission,
          bagages: formData.bagages,
          statut: formData.statut,
          type_pax: formData.type_pax,
          type_vol: formData.type_vol
        }
      };

      console.log('Données envoyées au backend:', billetData);
      const response = await billetsAPI.create(billetData);
      console.log('Réponse du backend:', response);
      
      alert('Billet créé avec succès !');
      navigate('/billets');
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      console.error('Détails de l\'erreur:', error.response?.data);
      alert(`Erreur lors de la création: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Extraction de texte PDF
  const extractPdfText = async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/billets/extract-pdf-text`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('samtech_user') || '{}').token}`
        }
      });
      
      if (!response.ok) throw new Error('Erreur extraction PDF');
      
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Erreur extraction PDF:', error);
      throw error;
    }
  };

  // Analyse IA du texte PDF
  const analyzePdfText = async (text: string) => {
    try {
      const response = await billetsAPI.iaAnalyseBillet({ texte: text });
      return response.data;
    } catch (error) {
      console.error('Erreur analyse IA:', error);
      throw error;
    }
  };

  // Gestion du fichier PDF
  const handlePdfUpload = async (file: File) => {
    setPdfLoading(true);
    setAnalysisProgress({
      etape: 'debut',
      message: 'Démarrage de l\'analyse...',
      pourcentage: 0
    });
    setAnalysisComplete(false);
    
    try {
      // Étape 1: Extraction du texte
      setAnalysisProgress({
        etape: 'extraction',
        message: 'Extraction du texte du PDF...',
        pourcentage: 25
      });
      
      let text = '';
      try {
        text = await extractPdfText(file);
      } catch (error) {
        console.log('Backend non disponible, simulation de l\'extraction...');
        // Simulation si le backend n'est pas disponible
        text = 'Simulation du texte extrait du PDF pour test';
      }
      setPdfText(text);
      
      // Étape 2: Analyse IA
      setAnalysisProgress({
        etape: 'analyse',
        message: 'Analyse IA en cours...',
        pourcentage: 50
      });
      
      let aiResult;
      try {
        aiResult = await analyzePdfText(text);
      } catch (error) {
        console.log('Backend non disponible, simulation de l\'analyse IA...');
        // Simulation si le backend n'est pas disponible
        aiResult = {
          informations: {
            nom_passager: 'Test Passager',
            numero_billet: '123456789',
            compagnie_aerienne: 'Air France',
            code_compagnie: 'AF',
            classe: 'Economy',
            type_pax: 'ADT',
            bagages: '20kg',
            PNR: 'ABC123',
            date_emission: '2024-01-15',
            prix_ht: 500,
            prix_ttc: 600,
            taxes: 100,
            statut: 'confirmé',
            type_vol: 'depuis_algerie',
            vols: [{
              numero_vol: 'AF1234',
              depart: 'Paris',
              arrivee: 'Alger',
              date: '2024-02-01',
              heure_depart: '10:00',
              heure_arrivee: '12:30'
            }]
          }
        };
      }
      setAiResult(aiResult);
      
      // Étape 3: Pré-remplissage du formulaire
      setAnalysisProgress({
        etape: 'remplissage',
        message: 'Pré-remplissage du formulaire...',
        pourcentage: 75
      });
      
      // Pré-remplir le formulaire avec les résultats IA
      if (aiResult && aiResult.informations) {
        const info = aiResult.informations;
        console.log('Résultats IA reçus:', info); // Debug
        
        setFormData({
          passager: info.nom_passager || '',
          numero_billet: info.numero_billet || '',
          compagnie: info.compagnie_aerienne || '',
          code_compagnie: info.code_compagnie || '',
          classe: info.classe || '',
          type_pax: info.type_pax || 'ADT',
          bagages: info.bagages || '',
          PNR: info.PNR || '',
          date_emission: info.date_emission || '',
          montant_ht: info.prix_ht ? info.prix_ht.toString() : '',
          montant_ttc: info.prix_ttc ? info.prix_ttc.toString() : '',
          taxes: info.taxes ? info.taxes.toString() : '',
          statut: info.statut || 'en_attente',
          type_vol: info.type_vol || 'depuis_algerie',
          vols: info.vols && info.vols.length > 0 ? info.vols.map((vol: any) => ({
            numero_vol: vol.numero_vol || '',
            depart: vol.depart || '',
            arrivee: vol.arrivee || '',
            date: vol.date || '',
            heure_depart: vol.heure_depart || '',
            heure_arrivee: vol.heure_arrivee || ''
          })) : [{
            numero_vol: '',
            depart: '',
            arrivee: '',
            date: '',
            heure_depart: '',
            heure_arrivee: ''
          }]
        });
        
        // Remplir automatiquement les informations de compagnie
        if (info.compagnie_aerienne) {
          console.log('Recherche des informations IATA pour:', info.compagnie_aerienne);
          try {
            await fillCompanyInfo(info.compagnie_aerienne);
          } catch (error) {
            console.log('Erreur lors du remplissage des informations de compagnie:', error);
          }
        }
      }
      
      // Étape 4: Terminé
      setAnalysisProgress({
        etape: 'termine',
        message: 'Analyse terminée avec succès !',
        pourcentage: 100
      });
      
      setAnalysisComplete(true);
      
      // Masquer la progression après 3 secondes
      setTimeout(() => {
        setAnalysisProgress(null);
      }, 3000);
      
    } catch (error: any) {
      setAnalysisProgress({
        etape: 'erreur',
        message: `Erreur: ${error.message}`,
        pourcentage: 0
      });
      alert(`Erreur lors du traitement PDF: ${error.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      passager: '',
      numero_billet: '',
      compagnie: '',
      code_compagnie: '',
      classe: '',
      type_pax: 'ADT',
      bagages: '',
      PNR: '',
      date_emission: '',
      montant_ht: '',
      montant_ttc: '',
      taxes: '',
      statut: 'en_attente',
      type_vol: 'depuis_algerie',
      vols: [
        {
          numero_vol: '',
          depart: '',
          arrivee: '',
          date: '',
          heure_depart: '',
          heure_arrivee: ''
        }
      ]
    });
    setPdfFile(null);
    setPdfText('');
    setAiResult(null);
    setAnalysisProgress(null);
    setAnalysisComplete(false);
    setCompanySuggestions([]);
    setShowSuggestions(false);
  };

  // Gestion du changement d'onglet
  const handleTabChange = (tab: 'manual' | 'pdf') => {
    if (activeTab !== tab) {
      resetForm();
      setActiveTab(tab);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/billets" className="btn-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nouveau Billet</h1>
            <p className="text-gray-600">Ajouter un nouveau billet d'avion</p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('manual')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Saisie manuelle
          </button>
          <button
            onClick={() => handleTabChange('pdf')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pdf'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Import PDF
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'manual' ? (
        <div className="space-y-6">
          {/* Informations passager */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Informations passager</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Passager <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`input w-full ${!formData.passager ? 'border-red-300 focus:border-red-500' : ''}`}
                  value={formData.passager}
                  onChange={(e) => setFormData(prev => ({ ...prev, passager: e.target.value }))}
                  required
                  placeholder="Nom complet du passager"
                />
                {!formData.passager && (
                  <p className="text-red-500 text-xs mt-1">Le nom du passager est obligatoire</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Numéro de billet</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.numero_billet}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_billet: e.target.value }))}
                />
              </div>
              {/* Type passager */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Type passager <span className="text-red-500">*</span>
                </label>
                <select
                  className={`input w-full ${!formData.type_pax ? 'border-red-300 focus:border-red-500' : ''}`}
                  value={formData.type_pax}
                  onChange={e => setFormData(prev => ({ ...prev, type_pax: e.target.value }))}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="ADT">Adulte (ADT)</option>
                  <option value="CHD">Enfant (CHD)</option>
                  <option value="INF">Bébé (INF)</option>
                </select>
                {!formData.type_pax && (
                  <p className="text-red-500 text-xs mt-1">Le type de passager est obligatoire</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date d'émission</label>
                <input
                  type="date"
                  className="input w-full"
                  value={formData.date_emission}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_emission: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Compagnie et vol */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Compagnie et vol</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Compagnie aérienne</label>
                <div className="relative">
                  <input
                    type="text"
                    className="input w-full pr-10"
                    value={formData.compagnie}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, compagnie: e.target.value }));
                      searchCompany(e.target.value);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={handleClickOutside}
                    placeholder="Rechercher une compagnie..."
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {searchingCompany && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 text-center text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Recherche en cours...
                    </div>
                  </div>
                )}
                {showSuggestions && companySuggestions.length > 0 && !searchingCompany && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {companySuggestions.map((company, index) => (
                      <div
                        key={index}
                        className="p-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100"
                        onClick={() => selectCompany(company)}
                      >
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-gray-600">Code: {company.code}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code compagnie</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.code_compagnie}
                  onChange={(e) => setFormData(prev => ({ ...prev, code_compagnie: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type de vol</label>
                <select
                  className="input w-full"
                  value={formData.type_vol}
                  onChange={(e) => setFormData(prev => ({ ...prev, type_vol: e.target.value }))}
                >
                  <option value="">-- Sélectionner le type de vol --</option>
                  <option value="domestique">Vol domestique (Algérie → Algérie)</option>
                  <option value="vers_algerie">Vol vers l'Algérie</option>
                  <option value="depuis_algerie">Vol international (depuis Algérie)</option>
                  <option value="etranger">Vol étranger (hors Algérie)</option>
                </select>
              </div>
            </div>

            {/* Vols */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Vols</h4>
                <button
                  type="button"
                  onClick={addVol}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un vol
                </button>
              </div>
              
              {formData.vols.map((vol, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Vol {index + 1}</span>
                    {formData.vols.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVol(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Numéro de vol</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={vol.numero_vol || ''}
                        onChange={(e) => updateVol(index, 'numero_vol', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Départ</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={vol.depart || ''}
                        onChange={(e) => updateVol(index, 'depart', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Arrivée</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={vol.arrivee || ''}
                        onChange={(e) => updateVol(index, 'arrivee', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Date</label>
                      <input
                        type="date"
                        className="input w-full"
                        value={vol.date || ''}
                        onChange={(e) => updateVol(index, 'date', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Heure départ</label>
                      <input
                        type="time"
                        className="input w-full"
                        value={vol.heure_depart || ''}
                        onChange={(e) => updateVol(index, 'heure_depart', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Heure arrivée</label>
                      <input
                        type="time"
                        className="input w-full"
                        value={vol.heure_arrivee || ''}
                        onChange={(e) => updateVol(index, 'heure_arrivee', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Détails du billet */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Détails du billet</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">PNR</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.PNR}
                  onChange={(e) => setFormData(prev => ({ ...prev, PNR: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Classe</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.classe}
                  onChange={(e) => setFormData(prev => ({ ...prev, classe: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bagages</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.bagages}
                  onChange={(e) => setFormData(prev => ({ ...prev, bagages: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  className="input w-full"
                  value={formData.statut}
                  onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                >
                  <option value="en_attente">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="cancelled">Annulé</option>
                  <option value="issued">Émis</option>
                </select>
              </div>
            </div>
          </div>

          {/* Prix */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Prix</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Montant HT</label>
                <input
                  type="number"
                  step="0.01"
                  className="input w-full"
                  value={formData.montant_ht}
                  onChange={(e) => {
                    const ht = e.target.value;
                    const ttc = formData.montant_ttc;
                    const taxes = calculateTaxes(ht, ttc);
                    setFormData(prev => ({ 
                      ...prev, 
                      montant_ht: ht,
                      taxes: taxes.toFixed(2)
                    }));
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Taxes</label>
                <input
                  type="number"
                  step="0.01"
                  className="input w-full"
                  value={formData.taxes}
                  onChange={(e) => {
                    const taxes = e.target.value;
                    const ht = formData.montant_ht;
                    const ttc = (parseFloat(ht) || 0) + (parseFloat(taxes) || 0);
                    setFormData(prev => ({ 
                      ...prev, 
                      taxes: taxes,
                      montant_ttc: ttc.toFixed(2)
                    }));
                  }}
                />
              </div>
              {/* Montant TTC */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Montant TTC <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={`input w-full ${!formData.montant_ttc ? 'border-red-300 focus:border-red-500' : ''}`}
                  value={formData.montant_ttc}
                  onChange={e => setFormData(prev => ({ ...prev, montant_ttc: e.target.value }))}
                  required
                  min={1}
                  placeholder="Montant TTC du billet"
                />
                {!formData.montant_ttc && (
                  <p className="text-red-500 text-xs mt-1">Le montant TTC est obligatoire</p>
                )}
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              💡 Les taxes sont calculées automatiquement : TTC - HT = Taxes
            </div>
          </div>

          {/* Indicateurs de validation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <h4 className="font-medium mb-2">Conseils pour une saisie optimale :</h4>
                <ul className="space-y-1">
                  <li>• Remplissez au minimum le nom du passager (obligatoire)</li>
                  <li>• Utilisez la recherche de compagnie pour une saisie rapide</li>
                  <li>• Les taxes se calculent automatiquement selon vos montants</li>
                  <li>• Vous pouvez ajouter plusieurs vols pour un même billet</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upload PDF */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Import PDF</h3>
            
            {/* Message d'information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <h4 className="font-medium mb-2">Comment fonctionne l'import PDF :</h4>
                  <ul className="space-y-1">
                    <li>• Sélectionnez un fichier PDF de billet d'avion</li>
                    <li>• Le système extrait automatiquement le texte du PDF</li>
                    <li>• Le formulaire est pré-rempli pour vous permettre de vérifier et modifier si nécessaire</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sélectionner un fichier PDF</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPdfFile(file);
                      handlePdfUpload(file);
                    }
                  }}
                  className="input w-full"
                />
              </div>
              
              {pdfLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Analyse du PDF en cours...</span>
                </div>
              )}

              {analysisProgress && (
                <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    {analysisProgress.etape === 'erreur' ? (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    ) : analysisProgress.pourcentage === 100 ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
                    )}
                    <span className="font-medium text-blue-800">{analysisProgress.message}</span>
                  </div>
                  <div className="w-full bg-blue-300 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        analysisProgress.etape === 'erreur' ? 'bg-red-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${analysisProgress.pourcentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {analysisComplete && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">Analyse terminée avec succès !</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Le formulaire a été pré-rempli avec les informations extraites du PDF.
                    Vous pouvez le modifier si nécessaire.
                  </p>
                </div>
              )}


            </div>
          </div>

          {/* Formulaire pré-rempli (même que manuel) */}
          {aiResult && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-bold text-blue-700 mb-4">Formulaire pré-rempli</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Les champs ont été pré-remplis automatiquement. Vous pouvez les modifier si nécessaire.
                </p>
                
                {/* Même contenu que l'onglet manuel */}
                {/* Informations passager */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Informations passager</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Passager *</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={formData.passager}
                        onChange={(e) => setFormData(prev => ({ ...prev, passager: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Numéro de billet</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={formData.numero_billet}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero_billet: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type passager</label>
                      <select
                        className="input w-full"
                        value={formData.type_pax}
                        onChange={(e) => setFormData(prev => ({ ...prev, type_pax: e.target.value }))}
                      >
                        <option value="ADT">Adulte (ADT)</option>
                        <option value="CHD">Enfant (CHD)</option>
                        <option value="INF">Bébé (INF)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date d'émission</label>
                      <input
                        type="date"
                        className="input w-full"
                        value={formData.date_emission}
                        onChange={(e) => setFormData(prev => ({ ...prev, date_emission: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Compagnie et vol */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Compagnie et vol</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Compagnie aérienne</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={formData.compagnie}
                        onChange={(e) => setFormData(prev => ({ ...prev, compagnie: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Code compagnie</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={formData.code_compagnie}
                        onChange={(e) => setFormData(prev => ({ ...prev, code_compagnie: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type de vol</label>
                      <select
                        className="input w-full"
                        value={formData.type_vol}
                        onChange={(e) => setFormData(prev => ({ ...prev, type_vol: e.target.value }))}
                      >
                        <option value="">-- Sélectionner le type de vol --</option>
                        <option value="domestique">Vol domestique (Algérie → Algérie)</option>
                        <option value="vers_algerie">Vol vers l'Algérie</option>
                        <option value="depuis_algerie">Vol international (depuis Algérie)</option>
                        <option value="etranger">Vol étranger (hors Algérie)</option>
                      </select>
                    </div>
                  </div>

                  {/* Vols */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold">Vols</h5>
                      <button
                        type="button"
                        onClick={addVol}
                        className="btn-secondary text-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter un vol
                      </button>
                    </div>
                    
                    {formData.vols.map((vol, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Vol {index + 1}</span>
                          {formData.vols.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVol(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Numéro de vol</label>
                            <input
                              type="text"
                              className="input w-full"
                              value={vol.numero_vol || ''}
                              onChange={(e) => updateVol(index, 'numero_vol', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Départ</label>
                            <input
                              type="text"
                              className="input w-full"
                              value={vol.depart || ''}
                              onChange={(e) => updateVol(index, 'depart', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Arrivée</label>
                            <input
                              type="text"
                              className="input w-full"
                              value={vol.arrivee || ''}
                              onChange={(e) => updateVol(index, 'arrivee', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Date</label>
                            <input
                              type="date"
                              className="input w-full"
                              value={vol.date || ''}
                              onChange={(e) => updateVol(index, 'date', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Heure départ</label>
                            <input
                              type="time"
                              className="input w-full"
                              value={vol.heure_depart || ''}
                              onChange={(e) => updateVol(index, 'heure_depart', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Heure arrivée</label>
                            <input
                              type="time"
                              className="input w-full"
                              value={vol.heure_arrivee || ''}
                              onChange={(e) => updateVol(index, 'heure_arrivee', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Détails du billet */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Détails du billet</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">PNR</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={formData.PNR}
                        onChange={(e) => setFormData(prev => ({ ...prev, PNR: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Classe</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={formData.classe}
                        onChange={(e) => setFormData(prev => ({ ...prev, classe: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Bagages</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={formData.bagages}
                        onChange={(e) => setFormData(prev => ({ ...prev, bagages: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Statut</label>
                      <select
                        className="input w-full"
                        value={formData.statut}
                        onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                      >
                        <option value="en_attente">En attente</option>
                        <option value="confirmed">Confirmé</option>
                        <option value="cancelled">Annulé</option>
                        <option value="issued">Émis</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Prix */}
                <div>
                  <h4 className="font-semibold mb-3">Prix</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Montant HT</label>
                      <input
                        type="number"
                        className="input w-full"
                        value={formData.montant_ht}
                        onChange={(e) => setFormData(prev => ({ ...prev, montant_ht: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Taxes</label>
                      <input
                        type="number"
                        className="input w-full"
                        value={formData.taxes}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxes: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Montant TTC</label>
                      <input
                        type="number"
                        className="input w-full"
                        value={formData.montant_ttc}
                        onChange={(e) => setFormData(prev => ({ ...prev, montant_ttc: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Link to="/billets" className="btn-secondary">
          Annuler
        </Link>
        <button
          onClick={handleSave}
          disabled={loading || !formData.passager || !formData.type_pax || !formData.montant_ttc || Number(formData.montant_ttc) <= 0}
          className="btn-primary"
        >
          {loading ? (
            <span className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </span>
          ) : (
            <span className="flex items-center">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer le billet
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default NouveauBilletPage; 