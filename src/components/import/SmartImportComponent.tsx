import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Info,
  RefreshCw
} from 'lucide-react';

interface AnalysisProgress {
  etape: 'debut' | 'extraction' | 'analyse' | 'termine' | 'erreur';
  message: string;
  pourcentage: number;
}

interface SmartImportComponentProps {
  moduleType: 'billet' | 'hotel' | 'visa' | 'assurance';
  onAnalysisComplete: (result: any) => void;
  extractPdfText: (file: File) => Promise<any>;
  analyzeText: (text: string) => Promise<any>;
  activeTab: 'manual' | 'pdf';
  setActiveTab: (tab: 'manual' | 'pdf') => void;
  children?: React.ReactNode; // Pour le contenu du formulaire manuel
}

const SmartImportComponent: React.FC<SmartImportComponentProps> = ({
  moduleType,
  onAnalysisComplete,
  extractPdfText,
  analyzeText,
  activeTab,
  setActiveTab,
  children
}) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Configuration par module
  const moduleConfig = {
    billet: {
      title: 'Import de billet d\'avion',
      description: 'Sélectionnez un fichier PDF de billet d\'avion',
      instructions: [
        'Sélectionnez un fichier PDF de billet d\'avion',
        'Le système extrait automatiquement le texte du PDF',
        'Le formulaire est pré-rempli pour vous permettre de vérifier et modifier si nécessaire'
      ]
    },
    hotel: {
      title: 'Import de voucher hôtel',
      description: 'Sélectionnez un fichier PDF de voucher ou confirmation d\'hôtel',
      instructions: [
        'Sélectionnez un fichier PDF de voucher hôtel',
        'Le système extrait automatiquement les informations de réservation',
        'Le formulaire est pré-rempli avec les détails de l\'hôtel et du séjour'
      ]
    },
    visa: {
      title: 'Import de demande de visa',
      description: 'Sélectionnez un fichier PDF de demande ou confirmation de visa',
      instructions: [
        'Sélectionnez un fichier PDF de demande de visa',
        'Le système extrait automatiquement les informations consulaires',
        'Le formulaire est pré-rempli avec les détails du visa et du demandeur'
      ]
    },
    assurance: {
      title: 'Import de police d\'assurance',
      description: 'Sélectionnez un fichier PDF de police ou attestation d\'assurance',
      instructions: [
        'Sélectionnez un fichier PDF de police d\'assurance',
        'Le système extrait automatiquement les informations de couverture',
        'Le formulaire est pré-rempli avec les détails de l\'assurance et de l\'assuré'
      ]
    }
  };

  const config = moduleConfig[moduleType];

  const handleTabChange = (tab: 'manual' | 'pdf') => {
    setActiveTab(tab);
    if (tab === 'manual') {
      // Reset PDF state when switching to manual
      setPdfFile(null);
      setAnalysisProgress(null);
      setAnalysisComplete(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setPdfLoading(true);
    setAnalysisProgress({
      etape: 'debut',
      message: 'Démarrage de l\'analyse...',
      pourcentage: 0
    });
    setAnalysisComplete(false);
    
    try {
      // Étape 1: Extraction du texte
      setAnalysisProgress({
        etape: 'extraction',
        message: 'Extraction du texte du PDF...',
        pourcentage: 25
      });
      
      let text = '';
      try {
        const extractResult = await extractPdfText(file);
        text = extractResult.data?.text || '';
      } catch (extractError) {
        console.error('Erreur extraction:', extractError);
        setAnalysisProgress({
          etape: 'erreur',
          message: 'Erreur lors de l\'extraction du texte PDF',
          pourcentage: 25
        });
        return;
      }

      if (!text.trim()) {
        setAnalysisProgress({
          etape: 'erreur',
          message: 'Aucun texte trouvé dans le PDF',
          pourcentage: 25
        });
        return;
      }

      // Étape 2: Analyse IA
      setAnalysisProgress({
        etape: 'analyse',
        message: 'Analyse intelligente en cours...',
        pourcentage: 75
      });

      try {
        const analysisResult = await analyzeText(text);
        
        // Étape 3: Terminé
        setAnalysisProgress({
          etape: 'termine',
          message: 'Analyse terminée avec succès !',
          pourcentage: 100
        });

        setAnalysisComplete(true);
        
        // Appeler le callback avec les résultats
        onAnalysisComplete(analysisResult.data);

      } catch (analysisError) {
        console.error('Erreur analyse IA:', analysisError);
        setAnalysisProgress({
          etape: 'erreur',
          message: 'Erreur lors de l\'analyse IA',
          pourcentage: 75
        });
      }

    } catch (error) {
      console.error('Erreur générale:', error);
      setAnalysisProgress({
        etape: 'erreur',
        message: 'Erreur inattendue lors du traitement',
        pourcentage: 0
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const resetAnalysis = () => {
    setPdfFile(null);
    setAnalysisProgress(null);
    setAnalysisComplete(false);
    setPdfLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('manual')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Saisie manuelle
          </button>
          <button
            onClick={() => handleTabChange('pdf')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pdf'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            📧 Capture Mail / Import PDF
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'manual' ? (
        <div className="space-y-6">
          {children}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upload PDF */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">{config.title}</h3>
            
            {/* Message d'information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <h4 className="font-medium mb-2">Comment fonctionne l'import PDF :</h4>
                  <ul className="space-y-1">
                    {config.instructions.map((instruction, index) => (
                      <li key={index}>• {instruction}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {config.description}
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPdfFile(file);
                      handlePdfUpload(file);
                    }
                  }}
                  className="input w-full"
                />
              </div>
              
              {pdfLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Analyse du PDF en cours...</span>
                </div>
              )}

              {analysisProgress && (
                <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    {analysisProgress.etape === 'erreur' ? (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    ) : analysisProgress.pourcentage === 100 ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
                    )}
                    <span className="font-medium text-blue-800">{analysisProgress.message}</span>
                  </div>
                  <div className="w-full bg-blue-300 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        analysisProgress.etape === 'erreur' ? 'bg-red-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${analysisProgress.pourcentage}%` }}
                    ></div>
                  </div>
                  
                  {analysisProgress.etape === 'erreur' && (
                    <div className="mt-3">
                      <button
                        onClick={resetAnalysis}
                        className="btn-secondary flex items-center text-sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Réessayer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {analysisComplete && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">Analyse terminée avec succès !</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Le formulaire a été pré-rempli avec les informations extraites du PDF.
                    Vous pouvez maintenant vérifier et modifier les données si nécessaire.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => setActiveTab('manual')}
                      className="btn-primary text-sm"
                    >
                      Voir le formulaire pré-rempli
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartImportComponent; 