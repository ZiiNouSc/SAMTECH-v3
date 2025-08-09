import React, { useState } from 'react';
import { testAuth, forceDevLogin, loginAsSCZ } from '../utils/testAuth';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, currentAgence, userAgences } = useAuth();

  const handleTestAuth = async () => {
    setIsLoading(true);
    const result = await testAuth();
    setTestResult(result);
    setIsLoading(false);
  };

  const handleForceLogin = () => {
    forceDevLogin();
  };

  const handleLoginAsSCZ = async () => {
    setIsLoading(true);
    await loginAsSCZ();
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <h3 className="text-sm font-semibold mb-2">Debug Auth</h3>
      
      {/* Modules actifs */}
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <div className="text-xs font-semibold mb-1">Modules actifs:</div>
        {currentAgence?.modulesActifs ? (
          <div className="text-xs">
            {currentAgence.modulesActifs.map((module: string) => (
              <div key={module} className={module === 'fournisseurs' ? 'text-green-600 font-bold' : ''}>
                {module} {module === 'fournisseurs' ? '✅' : ''}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-red-600">Aucun module actif</div>
        )}
      </div>
      
      <div className="space-y-2">
        <button
          onClick={handleTestAuth}
          disabled={isLoading}
          className="w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Test en cours...' : 'Tester Auth'}
        </button>
        
        <button
          onClick={handleForceLogin}
          className="w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          Forcer Login Dev
        </button>

        <button
          onClick={handleLoginAsSCZ}
          disabled={isLoading}
          className="w-full px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {isLoading ? 'Connexion...' : 'Login SCZ AGENCY'}
        </button>
      </div>

      {testResult && (
        <div className="mt-3 text-xs">
          <div className="font-semibold">Résultat du test:</div>
          <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugAuth; 