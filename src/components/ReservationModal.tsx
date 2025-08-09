import React, { useState } from 'react';
import axios from 'axios';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  package: {
    _id: string;
    nom: string;
    prix: number;
    duree: string;
    placesDisponibles?: number;
  } | null;
  agenceSlug: string;
  onSuccess: () => void;
}

interface ReservationForm {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  nombrePlaces: number;
  commentaire: string;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  package: pkg,
  agenceSlug,
  onSuccess
}) => {
  const [formData, setFormData] = useState<ReservationForm>({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    nombrePlaces: 1,
    commentaire: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof ReservationForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pkg) return;

    // Validation
    if (!formData.nom || !formData.prenom || !formData.telephone || !formData.nombrePlaces) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (pkg.placesDisponibles && formData.nombrePlaces > pkg.placesDisponibles) {
      setError(`Seulement ${pkg.placesDisponibles} places disponibles`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/reservations/public', {
        packageId: pkg._id,
        agenceSlug,
        ...formData
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess(false);
          setFormData({
            nom: '',
            prenom: '',
            telephone: '',
            email: '',
            nombrePlaces: 1,
            commentaire: ''
          });
        }, 2000);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !pkg) return null;

  const montantTotal = pkg.prix * formData.nombrePlaces;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Réserver ce package</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">{pkg.nom}</h3>
            <p className="text-blue-700 text-sm">{pkg.duree}</p>
            <p className="text-blue-900 font-bold">{pkg.prix} DZD par personne</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-6 bg-green-50 border-b border-green-200">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                ✓
              </div>
              <div>
                <h3 className="text-green-900 font-semibold">Réservation réussie !</h3>
                <p className="text-green-700 text-sm">Nous vous contacterons bientôt pour confirmer votre réservation.</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Nom et Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => handleInputChange('prenom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleInputChange('telephone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Nombre de places */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de places *
              </label>
              <input
                type="number"
                min="1"
                max={pkg.placesDisponibles || 10}
                value={formData.nombrePlaces}
                onChange={(e) => handleInputChange('nombrePlaces', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {pkg.placesDisponibles && (
                <p className="text-xs text-gray-500 mt-1">
                  {pkg.placesDisponibles} places disponibles
                </p>
              )}
            </div>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commentaire
              </label>
              <textarea
                value={formData.commentaire}
                onChange={(e) => handleInputChange('commentaire', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Informations supplémentaires, demandes spéciales..."
              />
            </div>

            {/* Résumé */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Montant total :</span>
                <span className="text-xl font-bold text-blue-600">
                  {montantTotal.toLocaleString('fr-FR')} DZD
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.nombrePlaces} place(s) × {pkg.prix} DZD
              </p>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Réservation...' : 'Confirmer la réservation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReservationModal; 