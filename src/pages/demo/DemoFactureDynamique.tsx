import React, { useState } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArticleWithPrestation } from '../../types/prestations';
import { generateDesignationForPrestation, createEmptyPrestationFields } from '../../utils/prestationUtils';
import DynamicArticleLine from '../../components/facture/DynamicArticleLine';
import PrestationSummary from '../../components/facture/PrestationSummary';

const DemoFactureDynamique: React.FC = () => {
  const [articles, setArticles] = useState<ArticleWithPrestation[]>([
    {
      id: 'demo-1',
      designation: 'Billet d\'avion pour DUPONT/JEAN MR, vol Air Algérie, Alger → Paris, départ le 15/01/2024, retour le 22/01/2024 - N° billet : 0571234567890',
      quantite: 1,
      prixUnitaire: 45000,
      montant: 45000,
      prestation: {
        type: 'billet',
        designation: '',
        designationAuto: true,
        pax: 'DUPONT/JEAN MR',
        numeroBillet: '0571234567890',
        dateDepart: '2024-01-15',
        dateRetour: '2024-01-22',
        villeDepart: 'Alger',
        villeArrivee: 'Paris',
        compagnie: 'Air Algérie'
      }
    },
    {
      id: 'demo-2',
      designation: 'Réservation hôtel Hilton Paris pour M. DUPONT Jean, du 15/01/2024 au 22/01/2024 à Paris - Voucher N° HTL2024001',
      quantite: 1,
      prixUnitaire: 28000,
      montant: 28000,
      prestation: {
        type: 'hotel',
        designation: '',
        designationAuto: true,
        nomClient: 'M. DUPONT Jean',
        nomHotel: 'Hilton Paris',
        ville: 'Paris',
        dateEntree: '2024-01-15',
        dateSortie: '2024-01-22',
        numeroVoucher: 'HTL2024001'
      }
    }
  ]);

  const addNewArticle = () => {
    const newArticle: ArticleWithPrestation = {
      id: `demo-${Date.now()}`,
      designation: '',
      quantite: 1,
      prixUnitaire: 0,
      montant: 0
    };
    setArticles(prev => [...prev, newArticle]);
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
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Démonstration - Facture Dynamique</h1>
            <p className="text-gray-600">Test du système de prestations avec génération automatique de désignations</p>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Résumé des prestations */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé des prestations</h2>
        <div className="flex items-center justify-between">
          <PrestationSummary articles={articles} maxDisplay={5} />
          <div className="text-right">
            <div className="text-sm text-gray-600">Total articles</div>
            <div className="text-xl font-bold text-blue-600">{articles.length}</div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Articles avec prestations</h2>
          <button
            onClick={addNewArticle}
            className="btn-primary"
          >
            Ajouter un article
          </button>
        </div>

        <div className="space-y-6">
          {articles.map((article, index) => (
            <div key={article.id} className="relative">
              <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10">
                {index + 1}
              </div>
              <DynamicArticleLine
                article={article}
                onUpdate={(updatedArticle) => updateArticle(article.id, updatedArticle)}
                onRemove={() => removeArticle(article.id)}
              />
            </div>
          ))}

          {articles.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 mb-4">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-lg font-medium">Aucun article</p>
                <p className="text-sm">Cliquez sur "Ajouter un article" pour tester le système</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Totaux */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Totaux</h2>
        <div className="flex justify-end">
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Total HT</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalHT.toLocaleString('fr-FR')} DA
            </div>
          </div>
        </div>
      </div>

      {/* Informations techniques */}
      <div className="card bg-blue-50">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Fonctionnalités démontrées</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Types de prestations supportés</h3>
            <ul className="space-y-1 text-blue-700">
              <li>✈️ Billets d'avion (PAX, dates, itinéraires)</li>
              <li>🏨 Hôtels (clients, dates, vouchers)</li>
              <li>📋 Visas (types, destinations, dépôts)</li>
              <li>🛡️ Assurances (types, validité, polices)</li>
              <li>📦 Autres prestations (flexibles)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Fonctionnalités avancées</h3>
            <ul className="space-y-1 text-blue-700">
              <li>🔄 Génération automatique de désignations</li>
              <li>✏️ Édition manuelle possible</li>
              <li>✅ Validation en temps réel</li>
              <li>📊 Résumé visuel des prestations</li>
              <li>🎨 Interface intuitive et responsive</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoFactureDynamique; 