import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Edit3, 
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Plane,
  Hotel,
  FileText,
  Shield,
  Package
} from 'lucide-react';
import { ArticleWithPrestation, PrestationType } from '../../types/prestations';
import { 
  prestationConfigs, 
  createEmptyPrestationFields, 
  generateDesignationForPrestation,
  validatePrestationFields 
} from '../../utils/prestationUtils';
import PrestationFields from './PrestationFields';

interface DynamicArticleLineProps {
  article: ArticleWithPrestation;
  onUpdate: (updatedArticle: ArticleWithPrestation) => void;
  onRemove: () => void;
  errors?: string[];
}

const DynamicArticleLine: React.FC<DynamicArticleLineProps> = ({
  article,
  onUpdate,
  onRemove,
  errors = []
}) => {
  const [showPrestationFields, setShowPrestationFields] = useState(false);
  const [isEditingDesignation, setIsEditingDesignation] = useState(false);
  const [prestationErrors, setPrestationErrors] = useState<string[]>([]);

  // Fonction pour déterminer le type de prestation à partir de l'article
  const getPrestationType = () => {
    if (article.type === 'billet' || article.billetId) {
      return { 
        icon: Plane, 
        label: 'Billet d\'avion', 
        color: 'text-blue-600 bg-blue-50 border-blue-200' 
      };
    }
    if (article.type === 'hotel' || article.hotelId) {
      return { 
        icon: Hotel, 
        label: 'Hôtel', 
        color: 'text-green-600 bg-green-50 border-green-200' 
      };
    }
    if (article.type === 'visa' || article.visaId) {
      return { 
        icon: FileText, 
        label: 'Visa', 
        color: 'text-purple-600 bg-purple-50 border-purple-200' 
      };
    }
    if (article.type === 'assurance' || article.assuranceId) {
      return { 
        icon: Shield, 
        label: 'Assurance', 
        color: 'text-orange-600 bg-orange-50 border-orange-200' 
      };
    }
    return { 
      icon: Package, 
      label: 'Article', 
      color: 'text-gray-600 bg-gray-50 border-gray-200' 
    };
  };

  const prestationType = getPrestationType();
  const PrestationIcon = prestationType.icon;

  // Calculer le montant automatiquement
  useEffect(() => {
    const montant = article.quantite * article.prixUnitaire;
    if (montant !== article.montant) {
      onUpdate({
        ...article,
        montant
      });
    }
  }, [article.quantite, article.prixUnitaire]);

  // Détecter automatiquement le type de prestation et remplir la désignation
  useEffect(() => {
    if (article.type && !article.prestation) {
      const prestationType = getPrestationType();
      
      // Extraire les données réelles depuis la désignation détaillée venant des sélecteurs
      let prestationData: any = {
        type: article.type as PrestationType,
        designation: article.designation,
        designationAuto: true
      };

      // Extraire et structurer les données selon le type
      if (article.type === 'billet' && article.billetId) {
        prestationData = {
          ...prestationData,
          ...extractBilletDataFromDesignation(article.designation),
          billetId: article.billetId
        };
      } else if (article.type === 'hotel' && article.hotelId) {
        prestationData = {
          ...prestationData,
          ...extractHotelDataFromDesignation(article.designation),
          hotelId: article.hotelId
        };
      } else if (article.type === 'visa' && article.visaId) {
        prestationData = {
          ...prestationData,
          ...extractVisaDataFromDesignation(article.designation),
          visaId: article.visaId
        };
      } else if (article.type === 'assurance' && article.assuranceId) {
        prestationData = {
          ...prestationData,
          ...extractAssuranceDataFromDesignation(article.designation),
          assuranceId: article.assuranceId
        };
      }

      onUpdate({
        ...article,
        prestation: prestationData
      });
    }
  }, [article.type, article.billetId, article.hotelId, article.visaId, article.assuranceId]);

  // Fonctions d'extraction des données depuis les désignations
  const extractBilletDataFromDesignation = (designation: string): any => {
    const lines = designation.split('\n');
    const data: any = {};
    
    // Extraire le nom du passager
    const firstLine = lines[0] || '';
    const passagerMatch = firstLine.match(/Billet d'avion - (.+)$/);
    if (passagerMatch) {
      data.passager = passagerMatch[1];
    }
    
    // Extraire le trajet
    const trajetLine = lines.find(line => line.startsWith('Trajet:'));
    if (trajetLine) {
      const trajetMatch = trajetLine.match(/Trajet: (.+) → (.+)$/);
      if (trajetMatch) {
        data.origine = trajetMatch[1];
        data.destination = trajetMatch[2];
      }
    }
    
    // Extraire la compagnie et le vol
    const compagnieLine = lines.find(line => line.includes('Vol') || line.includes('Compagnie'));
    if (compagnieLine) {
      const compagnieMatch = compagnieLine.match(/(.+) - Vol (.+)$/);
      if (compagnieMatch) {
        data.compagnie = compagnieMatch[1].replace('Compagnie: ', '');
        data.numeroVol = compagnieMatch[2];
      }
    }
    
    // Extraire les dates
    const dateLine = lines.find(line => line.startsWith('Date de départ:'));
    if (dateLine) {
      const dateMatch = dateLine.match(/Date de départ: (\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        const [day, month, year] = dateMatch[1].split('/');
        data.dateDepart = `${year}-${month}-${day}`;
      }
    }
    
    return data;
  };

  const extractHotelDataFromDesignation = (designation: string): any => {
    const lines = designation.split('\n');
    const data: any = {};
    
    // Extraire le nom de l'hôtel et la ville
    const firstLine = lines[0] || '';
    const hotelMatch = firstLine.match(/Réservation hôtel - (.+?) à (.+)$/);
    if (hotelMatch) {
      data.nomHotel = hotelMatch[1];
      data.ville = hotelMatch[2];
    }
    
    // Extraire les dates et durée
    const periodeLine = lines.find(line => line.startsWith('Période:'));
    if (periodeLine) {
      const periodeMatch = periodeLine.match(/du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})(.*)?/);
      if (periodeMatch) {
        const [day1, month1, year1] = periodeMatch[1].split('/');
        const [day2, month2, year2] = periodeMatch[2].split('/');
        data.dateArrivee = `${year1}-${month1}-${day1}`;
        data.dateDepart = `${year2}-${month2}-${day2}`;
        
        const dureeMatch = periodeMatch[3]?.match(/\((\d+) nuit/);
        if (dureeMatch) {
          data.nombreNuits = parseInt(dureeMatch[1]);
        }
      }
    }
    
    // Extraire les chambres
    const chambreLine = lines.find(line => line.includes('chambre'));
    if (chambreLine) {
      const chambreMatch = chambreLine.match(/(\d+) chambre\(s\) (.+)$/);
      if (chambreMatch) {
        data.nombreChambres = parseInt(chambreMatch[1]);
        data.typeChambres = chambreMatch[2];
      }
    }
    
    // Extraire le client
    const clientLine = lines.find(line => line.startsWith('Client:'));
    if (clientLine) {
      data.clientNom = clientLine.replace('Client: ', '');
    }
    
    return data;
  };

  const extractVisaDataFromDesignation = (designation: string): any => {
    const lines = designation.split('\n');
    const data: any = {};
    
    // Extraire le type et le pays
    const firstLine = lines[0] || '';
    const visaMatch = firstLine.match(/(.+) pour (.+)$/);
    if (visaMatch) {
      data.typeVisa = visaMatch[1];
      data.pays = visaMatch[2];
    }
    
    // Extraire le demandeur
    const demandeurLine = lines.find(line => line.startsWith('Demandeur:'));
    if (demandeurLine) {
      data.demandeur = demandeurLine.replace('Demandeur: ', '');
    }
    
    // Extraire le passeport
    const passeportLine = lines.find(line => line.startsWith('Passeport:'));
    if (passeportLine) {
      data.numeroPasseport = passeportLine.replace('Passeport: ', '');
    }
    
    // Extraire la durée
    const dureeLine = lines.find(line => line.startsWith('Durée:'));
    if (dureeLine) {
      data.duree = dureeLine.replace('Durée: ', '');
    }
    
    return data;
  };

  const extractAssuranceDataFromDesignation = (designation: string): any => {
    const lines = designation.split('\n');
    const data: any = {};
    
    // Extraire le type et la compagnie
    const firstLine = lines[0] || '';
    const assuranceMatch = firstLine.match(/(.+?) - (.+)$/);
    if (assuranceMatch) {
      data.typeAssurance = assuranceMatch[1];
      data.compagnieAssurance = assuranceMatch[2];
    } else {
      data.typeAssurance = firstLine;
    }
    
    // Extraire l'assuré
    const assureLine = lines.find(line => line.startsWith('Assuré:'));
    if (assureLine) {
      data.assure = assureLine.replace('Assuré: ', '');
    }
    
    // Extraire la police
    const policeLine = lines.find(line => line.startsWith('Police N°:'));
    if (policeLine) {
      data.numeroPolice = policeLine.replace('Police N°: ', '');
    }
    
    // Extraire la couverture
    const couvertureLine = lines.find(line => line.startsWith('Couverture:'));
    if (couvertureLine) {
      const montantMatch = couvertureLine.match(/Couverture: (.+)/);
      if (montantMatch) {
        data.montantCouverture = montantMatch[1];
      }
    }
    
    return data;
  };

  // Générer automatiquement la désignation si une prestation est sélectionnée
  useEffect(() => {
    if (article.prestation && article.prestation.designationAuto) {
      const newDesignation = generateDesignationForPrestation(article.prestation);
      if (newDesignation !== article.designation) {
        onUpdate({
          ...article,
          designation: newDesignation
        });
      }
    }
  }, [article.prestation]);

  const handlePrestationFieldsChange = (updatedPrestation: any) => {
    onUpdate({
      ...article,
      prestation: updatedPrestation
    });
    setPrestationErrors([]);
  };

  const handleDesignationChange = (designation: string) => {
    onUpdate({
      ...article,
      designation,
      prestation: article.prestation ? {
        ...article.prestation,
        designation,
        designationAuto: false
      } : undefined
    });
  };

  const handleRegenerateDesignation = () => {
    if (article.prestation) {
      const updatedPrestation = {
        ...article.prestation,
        designationAuto: true
      };
      onUpdate({
        ...article,
        prestation: updatedPrestation
      });
    }
  };

  const toggleDesignationEdit = () => {
    setIsEditingDesignation(!isEditingDesignation);
    if (article.prestation && !isEditingDesignation) {
      // Passer en mode édition manuelle
      onUpdate({
        ...article,
        prestation: {
          ...article.prestation,
          designationAuto: false
        }
      });
    }
  };

  const prestationValidation = article.prestation ? validatePrestationFields(article.prestation) : { isValid: true, errors: [] };

  return (
    <div className={`border rounded-lg p-4 space-y-4 bg-white ${prestationType.color.split(' ')[2]}`}>
      {/* En-tête de l'article avec type de prestation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${prestationType.color}`}>
            <PrestationIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{prestationType.label}</span>
          </div>
          {article.prestation && !prestationValidation.isValid && (
            <AlertCircle className="w-4 h-4 text-red-500" title="Champs manquants" />
          )}
          {article.prestation && prestationValidation.isValid && (
            <CheckCircle className="w-4 h-4 text-green-500" title="Prestation complète" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Bouton pour toggler les champs de prestation */}
          {article.prestation && (
            <button
              type="button"
              onClick={() => setShowPrestationFields(!showPrestationFields)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
              title={showPrestationFields ? "Masquer les détails" : "Afficher les détails"}
            >
              {showPrestationFields ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-500 hover:text-red-700 rounded"
            title="Supprimer cet article"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Champs de l'article */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantité *
          </label>
          <input
            type="number"
            value={article.quantite}
            onChange={(e) => onUpdate({
              ...article,
              quantite: parseInt(e.target.value) || 1
            })}
            className="input-field"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix unitaire (DA) *
          </label>
          <input
            type="number"
            value={article.prixUnitaire}
            onChange={(e) => onUpdate({
              ...article,
              prixUnitaire: parseFloat(e.target.value) || 0
            })}
            className="input-field"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant total (DA)
          </label>
          <input
            type="number"
            value={article.montant}
            readOnly
            className="input-field bg-gray-50"
          />
        </div>
      </div>

      {/* Désignation */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Désignation *
          </label>
          <div className="flex items-center space-x-2">
            {article.prestation && (
              <>
                <button
                  onClick={handleRegenerateDesignation}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  title="Régénérer automatiquement"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Auto</span>
                </button>
                <button
                  onClick={toggleDesignationEdit}
                  className={`text-xs flex items-center space-x-1 ${
                    isEditingDesignation || !article.prestation?.designationAuto
                      ? 'text-orange-600 hover:text-orange-700'
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                  title={isEditingDesignation ? "Mode édition active" : "Éditer manuellement"}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Éditer</span>
                </button>
              </>
            )}
          </div>
        </div>
        
        <textarea
          value={article.designation}
          onChange={(e) => handleDesignationChange(e.target.value)}
          className={`input-field ${errors.some(e => e.includes('désignation')) ? 'border-red-500' : ''}`}
          rows={3}
          placeholder={article.prestation ? "La désignation sera générée automatiquement..." : "Saisissez la désignation de l'article"}
          required
        />
        
        {article.prestation?.designationAuto && (
          <p className="text-xs text-blue-600 mt-1">
            ✨ Désignation générée automatiquement
          </p>
        )}
      </div>

      {/* Champs spécifiques à la prestation */}
      {article.prestation && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Détails de la prestation</h4>
            <button
              onClick={() => setShowPrestationFields(!showPrestationFields)}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <span>{showPrestationFields ? 'Masquer' : 'Afficher'}</span>
              {showPrestationFields ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {showPrestationFields && (
            <PrestationFields
              prestation={article.prestation}
              onChange={handlePrestationFieldsChange}
              errors={prestationErrors}
            />
          )}
        </div>
      )}

      {/* Erreurs globales */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <ul className="text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DynamicArticleLine; 