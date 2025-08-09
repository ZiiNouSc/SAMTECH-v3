import React, { useState } from 'react';
import { Settings, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { formatMontantCurrency } from '../../utils/formatters';

const AdminPage: React.FC = () => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculateResult, setRecalculateResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const recalculateBalances = async () => {
    setIsRecalculating(true);
    setError(null);
    setRecalculateResult(null);

    try {
      const response = await fetch('/api/factures/recalculate-balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setRecalculateResult(data);
      } else {
        setError(data.message || 'Erreur lors du recalcul');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <Settings className="w-8 h-8 mr-3 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Administration</h1>
              <p className="text-gray-600">Gestion système et maintenance</p>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recalcul des soldes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <RefreshCw className="w-6 h-6 mr-2 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Recalcul des soldes clients</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              Recalcule automatiquement les soldes de tous les clients en fonction des factures envoyées et des versements effectués.
            </p>

            <button
              onClick={recalculateBalances}
              disabled={isRecalculating}
              className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white font-medium transition-colors ${
                isRecalculating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isRecalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Recalcul en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recalculer les soldes
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {recalculateResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">Recalcul terminé avec succès</span>
                </div>
                
                <div className="text-sm text-green-700">
                  <p><strong>Message:</strong> {recalculateResult.message}</p>
                  <p><strong>Clients traités:</strong> {recalculateResult.data.length}</p>
                </div>

                <div className="mt-3">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-green-700 hover:text-green-800">
                      Voir les détails
                    </summary>
                    <div className="mt-2 space-y-2">
                      {recalculateResult.data.map((client: any, index: number) => (
                        <div key={index} className="p-2 bg-white rounded border">
                          <div className="font-medium">
                            {client.entreprise || `${client.prenom} ${client.nom}`}
                          </div>
                          <div className="text-xs text-gray-600">
                            <div>Ancien solde: {formatMontantCurrency(client.ancienSolde)}</div>
                            <div>Nouveau solde: {formatMontantCurrency(client.nouveauSolde)}</div>
                            <div>Factures envoyées: {client.facturesEnvoyees}</div>
                            <div>Factures payées: {client.facturesPayees}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>

          {/* Informations système */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations système</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Version:</span>
                <span className="font-medium">SamTech v2.2</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mode:</span>
                <span className="font-medium text-green-600">Développement</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base de données:</span>
                <span className="font-medium text-green-600">Connectée</span>
              </div>
            </div>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">Note importante</h3>
              <p className="text-sm text-blue-800">
                Le recalcul des soldes est une opération qui analyse toutes les factures envoyées et les versements effectués pour déterminer le solde réel de chaque client.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 