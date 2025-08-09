import React from 'react';
import { Clock, Mail, Phone, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PendingApprovalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleTerminate = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">ST</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SamTech</h1>
        </div>

        {/* Contenu principal */}
        <div className="card text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Inscription en cours de validation
            </h2>
            <p className="text-gray-600">
              Votre demande d'inscription a bien été reçue et est en cours d'examen par notre équipe.
            </p>
          </div>

          {/* Informations du compte */}
          {user && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informations de votre demande</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Agence :</span>
                  <span className="font-medium text-gray-900">{user.prenom} {user.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email :</span>
                  <span className="font-medium text-gray-900">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut :</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    En attente d'approbation
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Étapes du processus */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Processus de validation</h3>
            <div className="space-y-4">
              <div className="flex items-center text-left">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Inscription soumise</p>
                  <p className="text-sm text-gray-600">Votre demande a été reçue avec succès</p>
                </div>
              </div>
              
              <div className="flex items-center text-left">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Vérification en cours</p>
                  <p className="text-sm text-gray-600">Notre équipe examine votre dossier</p>
                </div>
              </div>
              
              <div className="flex items-center text-left">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-500">Activation du compte</p>
                  <p className="text-sm text-gray-500">Accès complet à la plateforme</p>
                </div>
              </div>
            </div>
          </div>

          {/* Délais */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Délai de traitement</h4>
            <p className="text-sm text-blue-800">
              La validation de votre compte prend généralement entre <strong>24 et 48 heures</strong> 
              pendant les jours ouvrables. Vous recevrez un email de confirmation dès que votre compte sera activé.
            </p>
          </div>

          {/* Contact */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Besoin d'aide ?</h4>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@samtech.com"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                support@samtech.com
              </a>
              <a
                href="tel:+33123456789"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-4 h-4 mr-2" />
                +33 1 23 45 67 89
              </a>
            </div>
          </div>

          {/* Terminer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleTerminate}
              className="btn-primary"
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;