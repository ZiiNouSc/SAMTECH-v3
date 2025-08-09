import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Save,
  ArrowLeft,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { clientsAPI, preFactureAPI } from '../../services/api';
import { Client, ArticleWithPrestation } from '../../types';
import { validatePrestationFields } from '../../utils/prestationUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DynamicArticleLine from '../../components/facture/DynamicArticleLine';

interface BonCommandeForm {
  numero: string;
  clientId: string;
  dateCreation: string;
  articles: ArticleWithPrestation[];
  montantHT: number;
  montantTTC: number;
  tva: number;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'facture';
  notes: string;
}

const BonsCommandeNewPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<BonCommandeForm>({
    numero: '',
    clientId: '',
    dateCreation: new Date().toISOString().split('T')[0],
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

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      const clientsData = response.data?.data || response.data || [];
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des clients:', error);
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
      
      const bonCommandeData = {
        numero: '', // Le backend générera automatiquement le numéro
        clientId: form.clientId,
        dateCreation: form.dateCreation,
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

      await preFactureAPI.create(bonCommandeData);

      // Redirection ou notification de succès
      alert('Devis créé avec succès !');
      navigate('/pre-factures');
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création du devis';
      alert(errorMessage);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Link to="/pre-factures" className="btn-secondary mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Nouveau Devis</h1>
            <p className="text-gray-600">Créer un nouveau devis avec prestations</p>
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
                Date de création
              </label>
              <input
                type="date"
                value={form.dateCreation}
                onChange={(e) => setForm(prev => ({ ...prev, dateCreation: e.target.value }))}
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

        {/* Articles avec prestations */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Articles et prestations</h2>
            <button
              type="button"
              onClick={addArticle}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un article
            </button>
          </div>

          {form.articles.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 mb-4">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-lg font-medium">Aucun article ajouté</p>
                <p className="text-sm">Cliquez sur "Ajouter un article" pour commencer</p>
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
          <Link to="/pre-factures" className="btn-secondary">
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
            Créer le devis
          </button>
        </div>
      </form>
    </div>
  );
};

export default BonsCommandeNewPage; 