import React from 'react';

const NotFound404: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
    <p className="text-2xl text-gray-800 mb-2">Page non trouvée</p>
    <p className="text-gray-500 mb-6">La page que vous cherchez n'existe pas.</p>
    <a href="/" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Retour à l'accueil</a>
  </div>
);

export default NotFound404; 