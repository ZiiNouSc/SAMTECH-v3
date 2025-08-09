import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Save,
  ArrowLeft,
  X,
  Package,
  AlertCircle,
  Plane,
  Building2,
  FileText,
  Shield,
  Hotel
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { clientsAPI, facturesAPI, prestationsAPI, billetsAPI, hotelAPI, visaAPI, assuranceAPI } from '../../services/api';
import { Client, ArticleWithPrestation } from '../../types';
import { validatePrestationFields } from '../../utils/prestationUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DynamicArticleLine from '../../components/facture/DynamicArticleLine';
import PrestationSelector from '../../components/facture/PrestationSelector';
import BilletSelector from '../../components/facture/BilletSelector';
import HotelSelector from '../../components/facture/HotelSelector';
import VisaSelector from '../../components/facture/VisaSelector';
import AssuranceSelector from '../../components/facture/AssuranceSelector';
import Badge from '../../components/ui/Badge';

interface FactureForm {
  numero: string;
  clientId: string;
  dateEmission: string;
  dateEcheance: string;
  articles: ArticleWithPrestation[];
  montantHT: number;
  montantTTC: number;
  tva: number;
  statut: 'brouillon' | 'envoyee' | 'partiellement_payee' | 'payee' | 'en_retard' | 'annulee';
  notes: string;
}

const FacturesNewPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [prestationsNonFacturees, setPrestationsNonFacturees] = useState<number>(0);
  const [billetsNonFactures, setBilletsNonFactures] = useState<number>(0);
  const [hotelsNonFactures, setHotelsNonFactures] = useState<number>(0);
  const [visasNonFactures, setVisasNonFactures] = useState<number>(0);
  const [assurancesNonFacturees, setAssurancesNonFacturees] = useState<number>(0);
  const [form, setForm] = useState<FactureForm>({
    numero: '',
    clientId: '',
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 jours
    articles: [],
    montantHT: 0,
    montantTTC: 0,
    tva: 0,
    statut: 'brouillon',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTVA, setShowTVA] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [showPrestationSelector, setShowPrestationSelector] = useState(false);
  const [showBilletSelector, setShowBilletSelector] = useState(false);
  const [showHotelSelector, setShowHotelSelector] = useState(false);
  const [showVisaSelector, setShowVisaSelector] = useState(false);
  const [showAssuranceSelector, setShowAssuranceSelector] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchBilletsNonFactures();
    fetchHotelsNonFactures();
    fetchVisasNonFactures();
    fetchAssurancesNonFacturees();
  }, []);

  useEffect(() => {
    if (form.clientId) {
      checkPrestationsNonFacturees();
    } else {
      setPrestationsNonFacturees(0);
    }
  }, [form.clientId]);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      const clientsData = response.data?.data || response.data || [];
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const checkPrestationsNonFacturees = async () => {
    try {
      const response = await prestationsAPI.getNonFacturees(form.clientId);
      const prestations = response.data?.data || [];
      setPrestationsNonFacturees(prestations.length);
    } catch (error: any) {
      console.error('Erreur lors de la vérification des prestations:', error);
      setPrestationsNonFacturees(0);
    }
  };

  const fetchBilletsNonFactures = async () => {
    try {
      const response = await billetsAPI.getNonFactures();
      const billets = response.data?.data || [];
      setBilletsNonFactures(billets.length);
    } catch (error: any) {
      console.error('Erreur lors de la vérification des billets:', error);
      setBilletsNonFactures(0);
    }
  };

  const fetchHotelsNonFactures = async () => {
    try {
      const response = await hotelAPI.getNonFactures();
      const hotels = response.data?.data || [];
      setHotelsNonFactures(hotels.length);
    } catch (error: any) {
      console.error('Erreur lors de la vérification des hotels:', error);
      setHotelsNonFactures(0);
    }
  };

  const fetchVisasNonFactures = async () => {
    try {
      const response = await visaAPI.getNonFactures();
      const visas = response.data?.data || [];
      setVisasNonFactures(visas.length);
    } catch (error: any) {
      console.error('Erreur lors de la vérification des visas:', error);
      setVisasNonFactures(0);
    }
  };

  const fetchAssurancesNonFacturees = async () => {
    try {
      const response = await assuranceAPI.getNonFactures();
      const assurances = response.data?.data || [];
      setAssurancesNonFacturees(assurances.length);
    } catch (error: any) {
      console.error('Erreur lors de la vérification des assurances:', error);
      setAssurancesNonFacturees(0);
    }
  };

  const addArticle = () => {
    const newArticle: ArticleWithPrestation = {
      id: `article-${Date.now()}`,
      designation: '',
      quantite: 1,
      prixUnitaire: 0,
      montant: 0
    };
    setForm(prev => ({
      ...prev,
      articles: [...prev.articles, newArticle]
    }));
  };

  const removeArticle = (articleId: string) => {
    setForm(prev => ({
      ...prev,
      articles: prev.articles.filter(article => article.id !== articleId)
    }));
    // Supprimer les erreurs de validation pour cet article
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[articleId];
      return newErrors;
    });
  };

  const updateArticle = (articleId: string, updatedArticle: ArticleWithPrestation) => {
    setForm(prev => ({
      ...prev,
      articles: prev.articles.map(article => 
        article.id === articleId ? updatedArticle : article
      )
    }));
    
    // Valider la prestation si elle existe
    if (updatedArticle.prestation) {
      const validation = validatePrestationFields(updatedArticle.prestation);
      setValidationErrors(prev => ({
        ...prev,
        [articleId]: validation.errors
      }));
    } else {
      // Supprimer les erreurs si pas de prestation
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[articleId];
        return newErrors;
      });
    }
  };

  const handleAddPrestations = (prestations: ArticleWithPrestation[]) => {
    setForm(prev => ({
      ...prev,
      articles: [...prev.articles, ...prestations]
    }));
    // Recheck après ajout
    checkPrestationsNonFacturees();
  };

  const handleAddBillets = (billets: any[]) => {
    setForm(prev => ({
      ...prev,
      articles: [...prev.articles, ...billets]
    }));
    // Rafraîchir le nombre de billets non facturés
    fetchBilletsNonFactures();
  };

  const handleAddHotels = (hotels: any[]) => {
    setForm(prev => ({
      ...prev,
      articles: [...prev.articles, ...hotels]
    }));
    fetchHotelsNonFactures();
  };

  const handleAddVisas = (visas: any[]) => {
    setForm(prev => ({
      ...prev,
      articles: [...prev.articles, ...visas]
    }));
    fetchVisasNonFactures();
  };

  const handleAddAssurances = (assurances: any[]) => {
    setForm(prev => ({
      ...prev,
      articles: [...prev.articles, ...assurances]
    }));
    fetchAssurancesNonFacturees();
  };

  const calculateTotals = () => {
    const montantHT = form.articles.reduce((sum, article) => sum + article.montant, 0);
    // Appliquer la TVA seulement si showTVA est true
    const montantTTC = showTVA ? montantHT * (1 + form.tva / 100) : montantHT;
    setForm(prev => ({ ...prev, montantHT, montantTTC }));
  };

  useEffect(() => {
    calculateTotals();
  }, [form.articles, form.tva, showTVA]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!form.clientId) {
      errors.push('Veuillez sélectionner un client');
    }

    if (!form.dateEmission) {
      errors.push('Veuillez saisir la date d\'émission');
    }

    if (!form.dateEcheance) {
      errors.push('Veuillez saisir la date d\'échéance');
    }

    if (form.articles.length === 0) {
      errors.push('Veuillez ajouter au moins un article');
    }

    // Vérifier que tous les articles ont une désignation
    const articlesIncomplets = form.articles.some(article => !article.designation.trim());
    if (articlesIncomplets) {
      errors.push('Veuillez remplir la désignation pour tous les articles');
    }

    // Vérifier les prestations
    const prestationErrors: Record<string, string[]> = {};
    form.articles.forEach(article => {
      if (article.prestation) {
        const validation = validatePrestationFields(article.prestation);
        if (!validation.isValid) {
          prestationErrors[article.id] = validation.errors;
        }
      }
    });

    setValidationErrors(prestationErrors);

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return false;
    }

    if (Object.keys(prestationErrors).length > 0) {
      alert('Veuillez compléter toutes les informations des prestations avant de continuer.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      setLoading(true);
      
      const factureData = {
        numero: '', // Le backend générera automatiquement le numéro
        clientId: form.clientId,
        dateEmission: form.dateEmission,
        dateEcheance: form.dateEcheance,
        articles: form.articles.map(article => ({
          designation: article.designation,
          quantite: article.quantite,
          prixUnitaire: article.prixUnitaire,
          montant: article.montant,
          prestation: article.prestation // Inclure les données de prestation
        })),
        montantHT: form.montantHT,
        montantTTC: form.montantTTC,
        tva: form.tva,
        statut: 'brouillon',
        notes: form.notes || ''
      };

      await facturesAPI.create(factureData);

      // Redirection ou notification de succès
      alert('Facture créée avec succès !');
      navigate('/factures');
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de la facture';
      alert(errorMessage);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find(c => c._id === form.clientId || c.id === form.clientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Link to="/factures" className="btn-secondary mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Nouvelle Facture</h1>
            <p className="text-gray-600">Créer une nouvelle facture avec prestations</p>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro
              </label>
              <input
                type="text"
                value={form.numero}
                onChange={(e) => setForm(prev => ({ ...prev, numero: e.target.value }))}
                placeholder="Auto-généré si vide"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                value={form.clientId}
                onChange={(e) => setForm(prev => ({ ...prev, clientId: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client._id || client.id} value={client._id || client.id}>
                    {client.entreprise || `${client.prenom} ${client.nom}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'émission *
              </label>
              <input
                type="date"
                value={form.dateEmission}
                onChange={(e) => setForm(prev => ({ ...prev, dateEmission: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'échéance *
              </label>
              <input
                type="date"
                value={form.dateEcheance}
                onChange={(e) => setForm(prev => ({ ...prev, dateEcheance: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TVA</label>
              {!showTVA ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowTVA(true);
                    setForm(prev => ({ ...prev, tva: 19 }));
                  }}
                >
                  Appliquer la TVA
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={form.tva}
                    onChange={e => setForm(prev => ({ ...prev, tva: parseFloat(e.target.value) || 0 }))}
                    className="input-field flex-1"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowTVA(false);
                      setForm(prev => ({ ...prev, tva: 0 }));
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                    title="Supprimer la TVA"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerte prestations non facturées */}
        {form.clientId && prestationsNonFacturees > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800">
                  Prestations non facturées détectées
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  {selectedClient?.entreprise || `${selectedClient?.prenom} ${selectedClient?.nom}`} a{' '}
                  <span className="font-medium">{prestationsNonFacturees} prestation(s)</span> non encore facturée(s).
                </p>
                <button
                  type="button"
                  onClick={() => setShowPrestationSelector(true)}
                  className="mt-2 text-sm font-medium text-orange-800 hover:text-orange-900 underline"
                >
                  Voir et sélectionner les prestations →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alerte billets non facturés */}
        {billetsNonFactures > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Plane className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Billets d'avion non facturés disponibles
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Il y a <span className="font-medium">{billetsNonFactures} billet(s) d'avion</span> non encore facturé(s) 
                  dans votre système.
                </p>
                <button
                  type="button"
                  onClick={() => setShowBilletSelector(true)}
                  className="mt-2 text-sm font-medium text-blue-800 hover:text-blue-900 underline"
                >
                  Voir et sélectionner les billets →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Articles avec prestations */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Articles et prestations</h2>
            <div className="flex flex-wrap gap-2">
              {form.clientId && (
                <button
                  type="button"
                  onClick={() => setShowPrestationSelector(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Package className="w-4 h-4" />
                  <span>Prestations existantes</span>
                  {prestationsNonFacturees > 0 && (
                    <Badge variant="warning">{prestationsNonFacturees}</Badge>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowBilletSelector(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plane className="w-4 h-4" />
                <span>Billets d'avion</span>
                {billetsNonFactures > 0 && (
                  <Badge variant="info">{billetsNonFactures}</Badge>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowHotelSelector(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Hotel className="w-4 h-4" />
                <span>Hôtels</span>
                {hotelsNonFactures > 0 && (
                  <Badge variant="info">{hotelsNonFactures}</Badge>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowVisaSelector(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Visas</span>
                {visasNonFactures > 0 && (
                  <Badge variant="info">{visasNonFactures}</Badge>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAssuranceSelector(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>Assurances</span>
                {assurancesNonFacturees > 0 && (
                  <Badge variant="info">{assurancesNonFacturees}</Badge>
                )}
              </button>
              <button
                type="button"
                onClick={addArticle}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvel article
              </button>
            </div>
          </div>

          {form.articles.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 mb-4">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-lg font-medium">Aucun article ajouté</p>
                <p className="text-sm">
                  {form.clientId 
                    ? "Importez des prestations existantes ou créez un nouvel article"
                    : "Sélectionnez d'abord un client pour voir les prestations disponibles"
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {form.articles.map((article, index) => (
                <div key={article.id} className="relative">
                  <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10">
                    {index + 1}
                  </div>
                  <DynamicArticleLine
                    article={article}
                    onUpdate={(updatedArticle) => updateArticle(article.id, updatedArticle)}
                    onRemove={() => removeArticle(article.id)}
                    errors={validationErrors[article.id] || []}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totaux */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Totaux</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant HT
              </label>
              <div className="text-lg font-semibold text-gray-900">
                {form.montantHT.toLocaleString('fr-FR')} DA
              </div>
            </div>
            {showTVA && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TVA ({form.tva}%)
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {(form.montantHT * form.tva / 100).toLocaleString('fr-FR')} DA
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant TTC
              </label>
              <div className="text-2xl font-bold text-blue-600">
                {form.montantTTC.toLocaleString('fr-FR')} DA
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            value={form.notes}
            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            className="input-field"
            rows={4}
            placeholder="Notes additionnelles..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Link to="/factures" className="btn-secondary">
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Créer la facture
          </button>
        </div>
      </form>

      {/* Modal sélecteur de prestations */}
      {showPrestationSelector && form.clientId && (
        <PrestationSelector
          clientId={form.clientId}
          onAddPrestations={handleAddPrestations}
          onClose={() => setShowPrestationSelector(false)}
        />
      )}

      {/* Modal sélecteur de billets */}
      {showBilletSelector && (
        <BilletSelector
          onAddBillets={handleAddBillets}
          onClose={() => setShowBilletSelector(false)}
        />
      )}

      {/* Modal sélecteur d'hôtels */}
      {showHotelSelector && (
        <HotelSelector
          onAddHotels={handleAddHotels}
          onClose={() => setShowHotelSelector(false)}
        />
      )}

      {/* Modal sélecteur de visas */}
      {showVisaSelector && (
        <VisaSelector
          onAddVisas={handleAddVisas}
          onClose={() => setShowVisaSelector(false)}
        />
      )}

      {/* Modal sélecteur d'assurances */}
      {showAssuranceSelector && (
        <AssuranceSelector
          onAddAssurances={handleAddAssurances}
          onClose={() => setShowAssuranceSelector(false)}
        />
      )}
    </div>
  );
};

export default FacturesNewPage;