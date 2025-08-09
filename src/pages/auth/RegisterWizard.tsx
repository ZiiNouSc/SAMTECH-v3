import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { 
  Building2, 
  FileText, 
  User,
  Upload, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getAgencyModules } from '../../config/modules';

interface RegistrationData {
  // Étape 1: Informations de l'agence
  nomCommercial: string;
  typeActivite: string;
  pays: string;
  wilaya: string;
  adresse: string;
  siteWeb: string;
  
  // Étape 2: Coordonnées administratives
  numeroRC: string;
  numeroNIF: string;
  numeroNIS: string;
  articleImposition: string;
  emailProfessionnel: string;
  telephoneProfessionnel: string;
  ibanRIB: string;
  
  // Étape 3: Informations du responsable
  nomResponsable: string;
  prenomResponsable: string;
  emailResponsable: string;
  telephoneResponsable: string;
  password: string;
  confirmPassword: string;
  
  // Étape 4: Logo
  logo: File | null;
  
  // Étape 5: Modules
  modulesChoisis: string[];
}

const RegisterWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<RegistrationData>({
    nomCommercial: '',
    typeActivite: '',
    pays: 'Algérie',
    wilaya: '',
    adresse: '',
    siteWeb: '',
    numeroRC: '',
    numeroNIF: '',
    numeroNIS: '',
    articleImposition: '',
    emailProfessionnel: '',
    telephoneProfessionnel: '',
    ibanRIB: '',
    nomResponsable: '',
    prenomResponsable: '',
    emailResponsable: '',
    telephoneResponsable: '',
    password: '',
    confirmPassword: '',
    logo: null,
    modulesChoisis: []
  });

  const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
    'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
    'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
    'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
    'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
    'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa',
    'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès', 'In Salah',
    'In Guezzam', 'Touggourt', 'Djanet', 'El M\'Ghair', 'El Meniaa'
  ];

  // Utiliser la configuration centralisée des modules
  const availableModules = getAgencyModules().map(module => ({
    id: module.id,
    name: module.name,
    description: module.description,
    essential: module.essential
  }));

  const steps = [
    { number: 1, title: 'Informations de l\'agence', icon: Building2, description: 'Créer l\'entité "agence"' },
    { number: 2, title: 'Coordonnées administratives', icon: FileText, description: 'Informations légales/fiscales' },
    { number: 3, title: 'Informations du responsable', icon: User, description: 'Créer l\'utilisateur principal' },
    { number: 4, title: 'Logo', icon: Upload, description: 'Identité visuelle' },
    { number: 5, title: 'Modules souhaités', icon: Settings, description: 'Choisir les fonctionnalités' }
  ];

  // Auto-select essential modules when reaching step 5
  useEffect(() => {
    if (currentStep === 5 && formData.modulesChoisis.length === 0) {
      const essentialModuleIds = availableModules
        .filter(m => m.essential)
        .map(m => m.id);
      
      setFormData(prev => ({
        ...prev,
        modulesChoisis: essentialModuleIds
      }));
    }
  }, [currentStep, formData.modulesChoisis.length, availableModules]);

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      modulesChoisis: prev.modulesChoisis.includes(moduleId)
        ? (prev.modulesChoisis || []).filter(id => id !== moduleId)
        : [...prev.modulesChoisis, moduleId]
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'Le fichier ne doit pas dépasser 2MB' }));
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, logo: 'Veuillez sélectionner un fichier image' }));
        return;
      }
      handleInputChange('logo', file);
      setErrors(prev => ({ ...prev, logo: '' }));
    }
  };

  const validateNIF = (nif: string): boolean => {
    // NIF algérien = 15 chiffres, mais on accepte aussi d'autres formats
    return nif.trim().length >= 10; // Au moins 10 caractères
  };

  const validateRC = (rc: string): boolean => {
    // RC algérien = format spécifique, mais on accepte aussi d'autres formats
    return rc.trim().length >= 5; // Au moins 5 caractères
  };

  const validateNIS = (nis: string): boolean => {
    // NIS algérien = 9 chiffres, mais on accepte aussi d'autres formats
    return nis.trim().length >= 5; // Au moins 5 caractères
  };

  const validateStep = (step: number): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.nomCommercial.trim()) {
          newErrors.nomCommercial = 'Le nom commercial est requis';
        }
        if (!formData.typeActivite) {
          newErrors.typeActivite = 'Veuillez sélectionner un type d\'activité';
        }
        if (!formData.wilaya) {
          newErrors.wilaya = 'Veuillez sélectionner une wilaya';
        }
        if (!formData.adresse.trim()) {
          newErrors.adresse = 'L\'adresse complète est requise';
        }
        break;

      case 2:
        if (!formData.numeroRC.trim()) {
          newErrors.numeroRC = 'Le numéro RC est requis';
        } else if (!validateRC(formData.numeroRC)) {
          newErrors.numeroRC = 'Le numéro RC doit contenir au moins 5 caractères';
        }
        if (!formData.numeroNIF.trim()) {
          newErrors.numeroNIF = 'Le numéro NIF est requis';
        } else if (!validateNIF(formData.numeroNIF)) {
          newErrors.numeroNIF = 'Le NIF doit contenir au moins 10 caractères';
        }
        if (!formData.numeroNIS.trim()) {
          newErrors.numeroNIS = 'Le numéro NIS est requis';
        } else if (!validateNIS(formData.numeroNIS)) {
          newErrors.numeroNIS = 'Le NIS doit contenir au moins 5 caractères';
        }
        if (!formData.emailProfessionnel.trim()) {
          newErrors.emailProfessionnel = 'L\'email professionnel est requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailProfessionnel)) {
          newErrors.emailProfessionnel = 'Format d\'email invalide';
        }
        if (!formData.telephoneProfessionnel.trim()) {
          newErrors.telephoneProfessionnel = 'Le téléphone professionnel est requis';
        }
        break;

      case 3:
        if (!formData.nomResponsable.trim()) {
          newErrors.nomResponsable = 'Le nom est requis';
        }
        if (!formData.prenomResponsable.trim()) {
          newErrors.prenomResponsable = 'Le prénom est requis';
        }
        if (!formData.emailResponsable.trim()) {
          newErrors.emailResponsable = 'L\'email est requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailResponsable)) {
          newErrors.emailResponsable = 'Format d\'email invalide';
        }
        if (!formData.telephoneResponsable.trim()) {
          newErrors.telephoneResponsable = 'Le téléphone mobile est requis';
        }
        if (!formData.password) {
          newErrors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }
        break;

      case 4:
        // Logo is optional
        break;

      case 5:
        // Check if at least one module is selected
        if (formData.modulesChoisis.length === 0) {
          newErrors.modules = 'Veuillez sélectionner au moins un module';
        }
        break;
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  // Fonction séparée pour vérifier si l'étape est valide sans modifier l'état
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.nomCommercial.trim() && formData.typeActivite && formData.wilaya && formData.adresse.trim());
      case 2:
        return !!(formData.numeroRC.trim() && formData.numeroRC.trim().length >= 5 && 
                 formData.numeroNIF.trim() && formData.numeroNIF.trim().length >= 10 &&
                 formData.numeroNIS.trim() && formData.numeroNIS.trim().length >= 5 &&
                 formData.emailProfessionnel.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailProfessionnel) &&
                 formData.telephoneProfessionnel.trim());
      case 3:
        return !!(formData.nomResponsable.trim() && formData.prenomResponsable.trim() &&
                 formData.emailResponsable.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailResponsable) &&
                 formData.telephoneResponsable.trim() && formData.password && formData.password.length >= 8 &&
                 formData.confirmPassword && formData.password === formData.confirmPassword);
      case 4:
        return true; // Logo is optional
      case 5:
        return formData.modulesChoisis.length > 0;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (isStepValid(currentStep) && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Only validate and show errors if step is not valid
      validateStep(currentStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid(5)) {
      validateStep(5); // Show errors if not valid
      return;
    }
    
    setLoading(true);
    try {
      // Prepare data for API
      const registrationData = {
        agence: {
          nom: formData.nomCommercial,
          typeActivite: formData.typeActivite,
          pays: formData.pays,
          wilaya: formData.wilaya,
          adresse: formData.adresse,
          siteWeb: formData.siteWeb,
          numeroRC: formData.numeroRC,
          numeroNIF: formData.numeroNIF,
          numeroNIS: formData.numeroNIS,
          articleImposition: formData.articleImposition,
          email: formData.emailProfessionnel,
          telephone: formData.telephoneProfessionnel,
          ibanRIB: formData.ibanRIB,
          modulesActifs: formData.modulesChoisis
        },
        utilisateur: {
          nom: formData.nomResponsable,
          prenom: formData.prenomResponsable,
          email: formData.emailResponsable,
          telephone: formData.telephoneResponsable,
          password: formData.password,
          role: 'agence'
        },
        logo: formData.logo
      };

      // Call registration API
      const response = await authAPI.register(registrationData);
      
      if (response.data.success) {
        navigate('/auth/pending-approval');
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'inscription');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Afficher les détails de l'erreur si disponibles
      if (error.response?.data?.errors) {
        const errorMessages = Array.isArray(error.response.data.errors) 
          ? error.response.data.errors.join('\n')
          : error.response.data.message;
        alert(`Erreur lors de l'inscription:\n${errorMessages}`);
      } else if (error.response?.data?.message) {
        alert(`Erreur lors de l'inscription: ${error.response.data.message}`);
      } else {
        alert('Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Informations de l'agence</h4>
                  <p className="text-sm text-blue-800">
                    Ces informations permettront de créer votre entité agence dans notre système.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom commercial (raison sociale) *
              </label>
              <input
                type="text"
                className={`input-field ${errors.nomCommercial ? 'border-red-500' : ''}`}
                value={formData.nomCommercial}
                onChange={(e) => handleInputChange('nomCommercial', e.target.value)}
                placeholder="Ex: Voyages Évasion SARL"
              />
              {errors.nomCommercial && (
                <p className="text-red-500 text-sm mt-1">{errors.nomCommercial}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'activité *
              </label>
              <select
                className={`input-field ${errors.typeActivite ? 'border-red-500' : ''}`}
                value={formData.typeActivite}
                onChange={(e) => handleInputChange('typeActivite', e.target.value)}
              >
                <option value="">Sélectionnez votre activité</option>
                <option value="agence-voyage">Agence de voyage</option>
                <option value="autre">Autre</option>
              </select>
              {errors.typeActivite && (
                <p className="text-red-500 text-sm mt-1">{errors.typeActivite}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays *
              </label>
              <input
                type="text"
                className="input-field bg-gray-100"
                value={formData.pays}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Pré-sélectionné pour l'Algérie</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wilaya *
              </label>
              <select
                className={`input-field ${errors.wilaya ? 'border-red-500' : ''}`}
                value={formData.wilaya}
                onChange={(e) => handleInputChange('wilaya', e.target.value)}
              >
                <option value="">Sélectionnez votre wilaya</option>
                {wilayas.map(wilaya => (
                  <option key={wilaya} value={wilaya}>{wilaya}</option>
                ))}
              </select>
              {errors.wilaya && (
                <p className="text-red-500 text-sm mt-1">{errors.wilaya}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète *
              </label>
              <textarea
                className={`input-field ${errors.adresse ? 'border-red-500' : ''}`}
                value={formData.adresse}
                onChange={(e) => handleInputChange('adresse', e.target.value)}
                placeholder="Numéro, rue, quartier, ville..."
                rows={3}
              />
              {errors.adresse && (
                <p className="text-red-500 text-sm mt-1">{errors.adresse}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site web (facultatif)
              </label>
              <input
                type="url"
                className="input-field"
                value={formData.siteWeb}
                onChange={(e) => handleInputChange('siteWeb', e.target.value)}
                placeholder="https://www.votre-agence.com"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Coordonnées administratives</h4>
                  <p className="text-sm text-blue-800">
                    Ces informations sont nécessaires pour la facturation et la conformité fiscale.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                N° de registre de commerce (RC) *
              </label>
              <input
                type="text"
                className={`input-field ${errors.numeroRC ? 'border-red-500' : ''}`}
                value={formData.numeroRC}
                onChange={(e) => handleInputChange('numeroRC', e.target.value)}
                placeholder="12/34/5678"
              />
              {errors.numeroRC && (
                <p className="text-red-500 text-sm mt-1">{errors.numeroRC}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Format recommandé: XX/XX/XXXX</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                N° d'identification fiscale (NIF) *
              </label>
              <input
                type="text"
                className={`input-field ${errors.numeroNIF ? 'border-red-500' : ''}`}
                value={formData.numeroNIF}
                onChange={(e) => handleInputChange('numeroNIF', e.target.value)}
                placeholder="123456789012345"
              />
              {errors.numeroNIF && (
                <p className="text-red-500 text-sm mt-1">{errors.numeroNIF}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">15 chiffres recommandés</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                N° d'identification statistique (NIS) *
              </label>
              <input
                type="text"
                className={`input-field ${errors.numeroNIS ? 'border-red-500' : ''}`}
                value={formData.numeroNIS}
                onChange={(e) => handleInputChange('numeroNIS', e.target.value)}
                placeholder="123456789"
              />
              {errors.numeroNIS && (
                <p className="text-red-500 text-sm mt-1">{errors.numeroNIS}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">9 chiffres recommandés</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article d'imposition (AI) - facultatif
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.articleImposition}
                onChange={(e) => handleInputChange('articleImposition', e.target.value)}
                placeholder="Article d'imposition"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email professionnel *
                </label>
                <input
                  type="email"
                  className={`input-field ${errors.emailProfessionnel ? 'border-red-500' : ''}`}
                  value={formData.emailProfessionnel}
                  onChange={(e) => handleInputChange('emailProfessionnel', e.target.value)}
                  placeholder="contact@votre-agence.com"
                />
                {errors.emailProfessionnel && (
                  <p className="text-red-500 text-sm mt-1">{errors.emailProfessionnel}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone professionnel *
                </label>
                <input
                  type="tel"
                  className={`input-field ${errors.telephoneProfessionnel ? 'border-red-500' : ''}`}
                  value={formData.telephoneProfessionnel}
                  onChange={(e) => handleInputChange('telephoneProfessionnel', e.target.value)}
                  placeholder="+213 123 456 789"
                />
                {errors.telephoneProfessionnel && (
                  <p className="text-red-500 text-sm mt-1">{errors.telephoneProfessionnel}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IBAN / RIB (facultatif mais utile pour factures)
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.ibanRIB}
                onChange={(e) => handleInputChange('ibanRIB', e.target.value)}
                placeholder="DZ 123 456 789 012 345 678 901"
              />
              <p className="text-xs text-gray-500 mt-1">Format IBAN algérien</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Informations du responsable</h4>
                  <p className="text-sm text-blue-800">
                    Ces informations permettront de créer votre compte utilisateur principal.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.nomResponsable ? 'border-red-500' : ''}`}
                  value={formData.nomResponsable}
                  onChange={(e) => handleInputChange('nomResponsable', e.target.value)}
                  placeholder="Nom du responsable"
                />
                {errors.nomResponsable && (
                  <p className="text-red-500 text-sm mt-1">{errors.nomResponsable}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.prenomResponsable ? 'border-red-500' : ''}`}
                  value={formData.prenomResponsable}
                  onChange={(e) => handleInputChange('prenomResponsable', e.target.value)}
                  placeholder="Prénom du responsable"
                />
                {errors.prenomResponsable && (
                  <p className="text-red-500 text-sm mt-1">{errors.prenomResponsable}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email (identifiant de connexion) *
                </label>
                <input
                  type="email"
                  className={`input-field ${errors.emailResponsable ? 'border-red-500' : ''}`}
                  value={formData.emailResponsable}
                  onChange={(e) => handleInputChange('emailResponsable', e.target.value)}
                  placeholder="email@exemple.com"
                />
                {errors.emailResponsable && (
                  <p className="text-red-500 text-sm mt-1">{errors.emailResponsable}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone mobile *
                </label>
                <input
                  type="tel"
                  className={`input-field ${errors.telephoneResponsable ? 'border-red-500' : ''}`}
                  value={formData.telephoneResponsable}
                  onChange={(e) => handleInputChange('telephoneResponsable', e.target.value)}
                  placeholder="+213 123 456 789"
                />
                {errors.telephoneResponsable && (
                  <p className="text-red-500 text-sm mt-1">{errors.telephoneResponsable}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Choisissez un mot de passe sécurisé"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation mot de passe *
                </label>
                <input
                  type="password"
                  className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Logo de l'agence</h4>
                  <p className="text-sm text-blue-800">
                    Votre logo apparaîtra sur vos factures et votre vitrine publique.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                {formData.logo ? (
                  <div className="space-y-4">
                    <img
                      src={URL.createObjectURL(formData.logo)}
                      alt="Logo preview"
                      className="mx-auto h-24 w-auto max-w-full"
                    />
                    <p className="text-sm text-gray-600">{formData.logo.name}</p>
                    <button
                      type="button"
                      onClick={() => handleInputChange('logo', null)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-700 font-medium">
                          Cliquez pour télécharger
                        </span>
                        <span className="text-gray-600"> ou glissez-déposez</span>
                      </label>
                      <input
                        id="logo-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, SVG jusqu'à 2MB
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {errors.logo && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                  <p className="text-sm text-red-800">{errors.logo}</p>
                </div>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Conseil :</strong> Utilisez un format carré ou rectangulaire avec un fond transparent pour un meilleur rendu sur vos factures.
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Modules souhaités</h4>
                  <p className="text-sm text-blue-800">
                    Sélectionnez les fonctionnalités dont vous avez besoin. Vous pourrez demander l'activation d'autres modules plus tard.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableModules.map((module) => (
                <div
                  key={module.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    formData.modulesChoisis.includes(module.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleModuleToggle(module.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{module.name}</h4>
                        {module.essential && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Essentiel
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      formData.modulesChoisis.includes(module.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.modulesChoisis.includes(module.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {errors.modules && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                  <p className="text-sm text-red-800">{errors.modules}</p>
                </div>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note :</strong> Les modules sélectionnés seront soumis à validation. 
                Certains modules peuvent nécessiter une approbation manuelle par notre équipe.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">ST</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Inscription SamTech</h1>
          <p className="text-gray-600 mt-2">Créez votre compte agence en quelques étapes</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      Étape {step.number}
                    </p>
                    <p className={`text-xs ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`hidden md:block w-16 h-0.5 ml-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {steps[currentStep - 1].description}
            </p>
          </div>

          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isStepValid(5) || loading}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Créer mon compte
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterWizard; 