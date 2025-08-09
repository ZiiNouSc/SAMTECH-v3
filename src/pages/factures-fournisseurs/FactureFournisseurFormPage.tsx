import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calculator, Percent, Building2, Calendar, FileText, Save } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

interface Fournisseur {
  _id: string;
  entreprise: string;
  nom: string;
  prenom: string;
  soldeCrediteur: number;
  detteFournisseur: number;
}

interface Article {
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

interface FactureFournisseur {
  _id: string;
  numero: string;
  fournisseurId: Fournisseur;
  dateEmission: string;
  dateEcheance: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  statut: string;
  notes?: string;
  articles: Article[];
}

const FactureFournisseurFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [showTVA, setShowTVA] = useState(false);
  const [formData, setFormData] = useState({
    numero: '',
    fournisseurId: '',
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    montantHT: 0,
    montantTVA: 0,
    montantTTC: 0,
    tva: 19,
    statut: 'en_attente',
    notes: '',
    articles: [] as Article[]
  });

  const isEditing = !!id;

  useEffect(() => {
    fetchFournisseurs();
    if (isEditing) {
      fetchFacture();
    }
  }, [id]);

  const fetchFournisseurs = async () => {
    try {
      const response = await api.get('/fournisseurs');
      setFournisseurs(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
    }
  };

  const fetchFacture = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/factures-fournisseurs/${id}`);
      const facture = response.data.data;
      
      const hasTVA = facture.montantTVA && facture.montantTVA > 0;
      const tvaValue = hasTVA ? Math.round((facture.montantTVA / facture.montantHT) * 100) : 19;
      
      setFormData({
        numero: facture.numero || '',
        fournisseurId: facture.fournisseurId?._id || '',
        dateEmission: facture.dateEmission ? new Date(facture.dateEmission).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dateEcheance: facture.dateEcheance ? new Date(facture.dateEcheance).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        montantHT: facture.montantHT || 0,
        montantTVA: facture.montantTVA || 0,
        montantTTC: facture.montantTTC || 0,
        tva: tvaValue,
        statut: facture.statut || 'en_attente',
        notes: facture.notes || '',
        articles: facture.articles || []
      });
      setShowTVA(Boolean(hasTVA));
    } catch (error) {
      console.error('Erreur lors du chargement de la facture:', error);
      alert('Erreur lors du chargement de la facture');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addArticle = () => {
    const newArticle: Article = {
      designation: '',
      quantite: 1,
      prixUnitaire: 0,
      montant: 0
    };
    setFormData(prev => ({
      ...prev,
      articles: [...prev.articles, newArticle]
    }));
  };

  const removeArticle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      articles: prev.articles.filter((_, i) => i !== index)
    }));
  };

  const updateArticle = (index: number, field: keyof Article, value: any) => {
    setFormData(prev => {
      const newArticles = [...prev.articles];
      newArticles[index] = {
        ...newArticles[index],
        [field]: value
      };

      // Calculer le montant de l'article
      if (field === 'quantite' || field === 'prixUnitaire') {
        newArticles[index].montant = newArticles[index].quantite * newArticles[index].prixUnitaire;
      }

      // Recalculer les totaux
      const montantHT = newArticles.reduce((sum, article) => sum + article.montant, 0);
      const montantTVA = showTVA ? montantHT * (formData.tva / 100) : 0;
      const montantTTC = montantHT + montantTVA;

      return {
        ...prev,
        articles: newArticles,
        montantHT,
        montantTVA,
        montantTTC
      };
    });
  };

  const calculateTotals = () => {
    const montantHT = formData.articles.reduce((sum, article) => sum + (article.montant || 0), 0);
    const montantTVA = showTVA ? montantHT * (formData.tva / 100) : 0;
    const montantTTC = montantHT + montantTVA;

    setFormData(prev => ({
      ...prev,
      montantHT,
      montantTVA,
      montantTTC
    }));
  };

  // Recalculer les totaux quand la TVA change
  useEffect(() => {
    calculateTotals();
  }, [showTVA, formData.tva, formData.articles]);

  const generateNumero = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FF-${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fournisseurId) {
      alert('Veuillez sélectionner un fournisseur');
      return;
    }

    if (formData.articles.length === 0) {
      alert('Veuillez ajouter au moins un article');
      return;
    }

    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
        numero: formData.numero || generateNumero(),
        montantTVA: showTVA ? formData.montantTVA : 0,
        montantTTC: showTVA ? formData.montantTTC : formData.montantHT,
        statut: 'en_attente'
      };

      if (isEditing) {
        await api.put(`/factures-fournisseurs/${id}`, dataToSend);
      } else {
        await api.post('/factures-fournisseurs', dataToSend);
      }

      navigate('/factures-fournisseurs');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de la sauvegarde';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const selectedFournisseur = fournisseurs.find(f => f._id === formData.fournisseurId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/factures-fournisseurs"
            className="btn-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Modifier la facture' : 'Nouvelle facture fournisseur'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Modifiez les informations de la facture' : 'Créez une nouvelle facture fournisseur'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Informations générales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de facture
              </label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="Auto-généré si vide"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fournisseur *
              </label>
              <select
                value={formData.fournisseurId}
                onChange={(e) => handleInputChange('fournisseurId', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Sélectionner un fournisseur</option>
                {fournisseurs.map((fournisseur) => (
                  <option key={fournisseur._id} value={fournisseur._id}>
                    {fournisseur.entreprise || `${fournisseur.prenom} ${fournisseur.nom}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'émission
              </label>
              <input
                type="date"
                value={formData.dateEmission}
                onChange={(e) => handleInputChange('dateEmission', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'échéance
              </label>
              <input
                type="date"
                value={formData.dateEcheance}
                onChange={(e) => handleInputChange('dateEcheance', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Informations fournisseur */}
        {selectedFournisseur && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Informations fournisseur
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Nom</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedFournisseur.entreprise || `${selectedFournisseur.prenom} ${selectedFournisseur.nom}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Solde créditeur</label>
                <p className="mt-1 text-sm font-medium text-green-600">
                  {selectedFournisseur.soldeCrediteur?.toLocaleString('fr-FR')} DA
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Dette</label>
                <p className="mt-1 text-sm font-medium text-red-600">
                  {selectedFournisseur.detteFournisseur?.toLocaleString('fr-FR')} DA
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Configuration TVA */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Percent className="w-5 h-5 mr-2" />
            Configuration TVA
          </h3>
          <div>
            {!showTVA ? (
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() => {
                  setShowTVA(true);
                  setFormData(prev => ({ ...prev, tva: 19 }));
                }}
              >
                Appliquer la TVA
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={formData.tva}
                  onChange={e => setFormData(prev => ({ ...prev, tva: parseFloat(e.target.value) || 0 }))}
                  className="input-field flex-1"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowTVA(false);
                    setFormData(prev => ({ ...prev, tva: 0 }));
                  }}
                  className="p-2 text-red-600 hover:bg-red-100 rounded"
                  title="Supprimer la TVA"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Articles */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Articles
            </h3>
            <button
              type="button"
              onClick={addArticle}
              className="btn-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un article
            </button>
          </div>

          {formData.articles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun article ajouté</p>
              <p className="text-sm">Cliquez sur "Ajouter un article" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.articles.map((article, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Article {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeArticle(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Désignation
                      </label>
                      <input
                        type="text"
                        value={article.designation}
                        onChange={(e) => updateArticle(index, 'designation', e.target.value)}
                        className="input-field"
                        placeholder="Description de l'article"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantité
                        </label>
                        <input
                          type="number"
                          value={article.quantite}
                          onChange={(e) => updateArticle(index, 'quantite', Number(e.target.value))}
                          className="input-field"
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix unitaire (DA)
                        </label>
                        <input
                          type="number"
                          value={article.prixUnitaire}
                          onChange={(e) => updateArticle(index, 'prixUnitaire', Number(e.target.value))}
                          className="input-field"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <span className="text-sm font-medium text-gray-900">
                        Montant: {article.montant.toLocaleString('fr-FR')} DA
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totaux */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Récapitulatif
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Montant HT:</span>
              <span className="font-medium">{formData.montantHT.toLocaleString('fr-FR')} DA</span>
            </div>
            {showTVA && (
              <div className="flex justify-between">
                <span className="text-gray-600">TVA ({formData.tva}%):</span>
                <span className="font-medium">{formData.montantTVA.toLocaleString('fr-FR')} DA</span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between font-medium">
                <span>Montant TTC:</span>
                <Badge variant="default" className="text-lg">
                  {formData.montantTTC.toLocaleString('fr-FR')} DA
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="input-field"
            placeholder="Notes supplémentaires..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Link
            to="/factures-fournisseurs"
            className="btn-secondary"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enregistrement...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Modifier la facture' : 'Créer la facture'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FactureFournisseurFormPage; 