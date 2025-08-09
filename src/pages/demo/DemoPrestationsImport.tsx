import React, { useState } from 'react';
import { ArrowLeft, Package, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Client, ArticleWithPrestation } from '../../types';
import PrestationSelector from '../../components/facture/PrestationSelector';
import DynamicArticleLine from '../../components/facture/DynamicArticleLine';
import Badge from '../../components/ui/Badge';

const DemoPrestationsImport: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [articles, setArticles] = useState<ArticleWithPrestation[]>([]);
  const [showPrestationSelector, setShowPrestationSelector] = useState(false);

  // Clients de démonstration
  const demoClients = [
    { id: '1', nom: 'DUPONT', prenom: 'Jean', entreprise: '', email: 'jean.dupont@email.com' },
    { id: '2', nom: 'MARTIN', prenom: 'Marie', entreprise: 'ACME Corp', email: 'marie.martin@acme.com' },
    { id: '3', nom: 'BERNARD', prenom: 'Pierre', entreprise: '', email: 'pierre.bernard@email.com' }
  ];

  const handleAddPrestations = (prestations: ArticleWithPrestation[]) => {
    setArticles(prev => [...prev, ...prestations]);
  };

  const updateArticle = (articleId: string, updatedArticle: ArticleWithPrestation) => {
    setArticles(prev => 
      prev.map(article => 
        article.id === articleId ? updatedArticle : article
      )
    );
  };

  const removeArticle = (articleId: string) => {
    setArticles(prev => prev.filter(article => article.id !== articleId));
  };

  const totalHT = articles.reduce((sum, article) => sum + article.montant, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30">
        <div className="flex items-center">
          <Link to="/dashboard" className="btn-secondary mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Démonstration - Import de Prestations</h1>
            <p className="text-gray-600">Test de la détection automatique et import par référence</p>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Sélection client */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Sélection du client</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="input-field"
            >
              <option value="">Sélectionner un client</option>
              {demoClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.entreprise || `${client.prenom} ${client.nom}`} - {client.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setShowPrestationSelector(true)}
              disabled={!selectedClient}
              className="btn-primary disabled:opacity-50 flex items-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Rechercher prestations</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fonctionnalités démontrées */}
      <div className="card bg-blue-50">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Fonctionnalités testées</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">🔍 Détection automatique</h3>
            <ul className="space-y-1 text-blue-700">
              <li>✓ Recherche des prestations non facturées par client</li>
              <li>✓ Exclusion des prestations déjà en devis/facture</li>
              <li>✓ Affichage avec prix et détails</li>
              <li>✓ Sélection multiple avec aperçu</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">🔎 Recherche par référence</h3>
            <ul className="space-y-1 text-blue-700">
              <li>✓ Recherche par numéro de billet/voucher/police</li>
              <li>✓ Recherche cross-prestations (tous types)</li>
              <li>✓ Validation anti-doublons</li>
              <li>✓ Import direct dans la facture</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Pour tester :</strong> Sélectionnez un client puis cliquez sur "Rechercher prestations". 
            Le modal permettra de voir les prestations disponibles et de les importer automatiquement.
          </p>
        </div>
      </div>

      {/* Articles importés */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">2. Articles importés</h2>
          <div className="flex items-center space-x-4">
            <Badge variant={articles.length > 0 ? "success" : "default"}>
              {articles.length} article(s)
            </Badge>
            {selectedClient && (
              <button
                onClick={() => setShowPrestationSelector(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Rechercher encore</span>
              </button>
            )}
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-4">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-lg font-medium">Aucune prestation importée</p>
              <p className="text-sm">
                {selectedClient 
                  ? "Cliquez sur 'Rechercher prestations' pour voir les prestations disponibles"
                  : "Sélectionnez d'abord un client"
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map((article, index) => (
              <div key={article.id} className="relative">
                <div className="absolute -top-2 -left-2 bg-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10">
                  {index + 1}
                </div>
                <DynamicArticleLine
                  article={article}
                  onUpdate={(updatedArticle) => updateArticle(article.id, updatedArticle)}
                  onRemove={() => removeArticle(article.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Résumé */}
      {articles.length > 0 && (
        <div className="card bg-green-50">
          <h2 className="text-lg font-semibold text-green-900 mb-4">Résumé de l'import</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{articles.length}</div>
              <div className="text-sm text-green-700">Articles importés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {articles.filter(a => a.prestation).length}
              </div>
              <div className="text-sm text-green-700">Avec prestations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {totalHT.toLocaleString('fr-FR')} DA
              </div>
              <div className="text-sm text-green-700">Total HT</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal sélecteur de prestations */}
      {showPrestationSelector && selectedClient && (
        <PrestationSelector
          clientId={selectedClient}
          onAddPrestations={handleAddPrestations}
          onClose={() => setShowPrestationSelector(false)}
        />
      )}
    </div>
  );
};

export default DemoPrestationsImport; 