import { billetsAPI, hotelAPI, visaAPI, assuranceAPI } from './api';

// Types pour le système d'import intelligent
export interface EmailContent {
  id: string;
  subject: string;
  body: string;
  attachments: EmailAttachment[];
  sender: string;
  date: Date;
  metadata?: any;
}

export interface EmailAttachment {
  name: string;
  content: string | ArrayBuffer;
  type: string;
  size: number;
}

export interface DetectionResult {
  moduleType: 'billets' | 'hotel' | 'visa' | 'assurance' | 'unknown';
  confidence: number;
  indicators: string[];
  suggestedData?: any;
}

export interface ImportResult {
  success: boolean;
  originalModule: string;
  finalModule: string;
  reclassified: boolean;
  entryId?: string;
  message: string;
  data?: any;
}

export interface ImportLog {
  id: string;
  timestamp: Date;
  emailId: string;
  originalModule: string;
  finalModule: string;
  reclassified: boolean;
  confidence: number;
  indicators: string[];
  status: 'success' | 'error' | 'pending';
  message: string;
  userId: string;
  agenceId: string;
}

class SmartImportService {
  private detectionPatterns = {
    billets: {
      // Patterns pour détecter les billets d'avion
      filenames: [
        /billet.*\.pdf$/i,
        /ticket.*\.pdf$/i,
        /e-ticket.*\.pdf$/i,
        /vol.*\.pdf$/i,
        /flight.*\.pdf$/i,
        /boarding.*pass.*\.pdf$/i,
        /itinerary.*\.pdf$/i,
        /confirmation.*vol.*\.pdf$/i
      ],
      keywords: [
        'billet d\'avion', 'e-ticket', 'boarding pass', 'vol confirmé',
        'compagnie aérienne', 'numéro de vol', 'terminal', 'porte d\'embarquement',
        'air france', 'lufthansa', 'emirates', 'turkish airlines', 'royal air maroc',
        'classe économique', 'classe affaires', 'baggage allowance', 'seat',
        'departure', 'arrival', 'gate', 'flight number'
      ],
      subjects: [
        /vol.*confirmé/i,
        /your.*flight.*confirmation/i,
        /e-ticket.*confirmation/i,
        /boarding.*pass/i,
        /itinerary.*confirmation/i,
        /ticket.*électronique/i
      ],
      senders: [
        /@airfrance\.fr$/i,
        /@lufthansa\.com$/i,
        /@emirates\.com$/i,
        /@turkishairlines\.com$/i,
        /@royalairmaroc\.com$/i,
        /@booking\.com$/i,
        /@expedia\.com$/i,
        /@kayak\.com$/i
      ]
    },
    hotel: {
      filenames: [
        /hotel.*\.pdf$/i,
        /reservation.*hotel.*\.pdf$/i,
        /booking.*confirmation.*\.pdf$/i,
        /accommodation.*\.pdf$/i,
        /sejour.*\.pdf$/i,
        /hebergement.*\.pdf$/i
      ],
      keywords: [
        'réservation hôtel', 'hotel booking', 'accommodation', 'check-in',
        'check-out', 'nuitée', 'suite', 'chambre', 'room', 'hébergement',
        'booking.com', 'hotels.com', 'expedia', 'agoda', 'trivago',
        'pension complète', 'demi-pension', 'petit déjeuner inclus',
        'spa', 'piscine', 'wifi gratuit', 'room service'
      ],
      subjects: [
        /hotel.*confirmation/i,
        /booking.*confirmed/i,
        /reservation.*confirmée/i,
        /your.*hotel.*booking/i,
        /accommodation.*confirmation/i,
        /hébergement.*confirmé/i
      ],
      senders: [
        /@booking\.com$/i,
        /@hotels\.com$/i,
        /@expedia\.com$/i,
        /@agoda\.com$/i,
        /@airbnb\.com$/i,
        /@hilton\.com$/i,
        /@marriott\.com$/i,
        /@accor\.com$/i
      ]
    },
    visa: {
      filenames: [
        /visa.*\.pdf$/i,
        /passeport.*\.pdf$/i,
        /demande.*visa.*\.pdf$/i,
        /visa.*application.*\.pdf$/i,
        /entry.*permit.*\.pdf$/i,
        /autorisation.*voyage.*\.pdf$/i
      ],
      keywords: [
        'demande de visa', 'visa application', 'passport', 'passeport',
        'consulat', 'ambassade', 'embassy', 'consulate', 'entry permit',
        'autorisation de voyage', 'visa touristique', 'visa affaires',
        'schengen', 'esta', 'evisa', 'visa électronique',
        'formulaire visa', 'rendez-vous consulat', 'appointment'
      ],
      subjects: [
        /visa.*application/i,
        /demande.*visa/i,
        /visa.*confirmation/i,
        /passport.*appointment/i,
        /consulat.*rendez-vous/i,
        /embassy.*appointment/i
      ],
      senders: [
        /@consulat\..*$/i,
        /@embassy\..*$/i,
        /@vfs.*global\.com$/i,
        /@tlscontact\.com$/i,
        /@blsinternational\.com$/i,
        /@france-visas\.gouv\.fr$/i
      ]
    },
    assurance: {
      filenames: [
        /assurance.*\.pdf$/i,
        /insurance.*\.pdf$/i,
        /police.*assurance.*\.pdf$/i,
        /travel.*insurance.*\.pdf$/i,
        /couverture.*voyage.*\.pdf$/i,
        /assistance.*voyage.*\.pdf$/i
      ],
      keywords: [
        'assurance voyage', 'travel insurance', 'police d\'assurance',
        'couverture médicale', 'assistance rapatriement', 'frais médicaux',
        'responsabilité civile', 'bagages', 'annulation voyage',
        'allianz', 'axa', 'groupama', 'mondial assistance',
        'europ assistance', 'assur travel', 'chapka', 'heyme'
      ],
      subjects: [
        /assurance.*voyage/i,
        /travel.*insurance/i,
        /police.*assurance/i,
        /insurance.*confirmation/i,
        /couverture.*confirmée/i,
        /assistance.*voyage/i
      ],
      senders: [
        /@allianz\..*$/i,
        /@axa\..*$/i,
        /@groupama\..*$/i,
        /@mondial-assistance\..*$/i,
        /@europ-assistance\..*$/i,
        /@chapka\.com$/i,
        /@heyme\.care$/i
      ]
    }
  };

  /**
   * Détecte automatiquement le type de contenu d'un email
   */
  detectContentType(email: EmailContent): DetectionResult {
    const scores = {
      billets: 0,
      hotel: 0,
      visa: 0,
      assurance: 0
    };

    const indicators: string[] = [];

    // Analyse des pièces jointes
    for (const attachment of email.attachments) {
      for (const [moduleType, patterns] of Object.entries(this.detectionPatterns)) {
        for (const pattern of patterns.filenames) {
          if (pattern.test(attachment.name)) {
            scores[moduleType as keyof typeof scores] += 3;
            indicators.push(`Fichier "${attachment.name}" correspond au module ${moduleType}`);
          }
        }
      }
    }

    // Analyse du sujet
    for (const [moduleType, patterns] of Object.entries(this.detectionPatterns)) {
      for (const pattern of patterns.subjects) {
        if (pattern.test(email.subject)) {
          scores[moduleType as keyof typeof scores] += 2;
          indicators.push(`Sujet "${email.subject}" correspond au module ${moduleType}`);
        }
      }
    }

    // Analyse de l'expéditeur
    for (const [moduleType, patterns] of Object.entries(this.detectionPatterns)) {
      for (const pattern of patterns.senders) {
        if (pattern.test(email.sender)) {
          scores[moduleType as keyof typeof scores] += 2;
          indicators.push(`Expéditeur "${email.sender}" correspond au module ${moduleType}`);
        }
      }
    }

    // Analyse du contenu
    const emailText = `${email.subject} ${email.body}`.toLowerCase();
    for (const [moduleType, patterns] of Object.entries(this.detectionPatterns)) {
      for (const keyword of patterns.keywords) {
        if (emailText.includes(keyword.toLowerCase())) {
          scores[moduleType as keyof typeof scores] += 1;
          indicators.push(`Mot-clé "${keyword}" trouvé dans le contenu`);
        }
      }
    }

    // Déterminer le module avec le score le plus élevé
    const maxScore = Math.max(...Object.values(scores));
    const detectedModule = Object.keys(scores).find(
      key => scores[key as keyof typeof scores] === maxScore
    ) as keyof typeof scores;

    const confidence = maxScore > 0 ? Math.min(maxScore / 10 * 100, 100) : 0;

    return {
      moduleType: confidence > 30 ? detectedModule : 'unknown',
      confidence,
      indicators,
      suggestedData: this.extractSuggestedData(email, detectedModule)
    };
  }

  /**
   * Extrait les données suggérées selon le type détecté
   */
  private extractSuggestedData(email: EmailContent, moduleType: string): any {
    const emailText = `${email.subject} ${email.body}`;
    
    switch (moduleType) {
      case 'billets':
        return this.extractFlightData(emailText, email.attachments);
      case 'hotel':
        return this.extractHotelData(emailText, email.attachments);
      case 'visa':
        return this.extractVisaData(emailText, email.attachments);
      case 'assurance':
        return this.extractInsuranceData(emailText, email.attachments);
      default:
        return null;
    }
  }

  private extractFlightData(text: string, attachments: EmailAttachment[]): any {
    // Extraction basique des données de vol
    const flightNumberMatch = text.match(/vol\s*(?:n°|number)?\s*([A-Z]{2}\d{3,4})/i);
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    const airlineMatch = text.match(/(air france|lufthansa|emirates|turkish airlines|royal air maroc)/i);
    
    return {
      numeroVol: flightNumberMatch?.[1] || '',
      compagnie: airlineMatch?.[1] || '',
      dateVol: dateMatch?.[1] || '',
      pieceJointe: attachments[0]?.name || ''
    };
  }

  private extractHotelData(text: string, attachments: EmailAttachment[]): any {
    const hotelNameMatch = text.match(/hotel\s+([^,\n\.]+)/i);
    const checkInMatch = text.match(/check-?in\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    const checkOutMatch = text.match(/check-?out\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    
    return {
      nomHotel: hotelNameMatch?.[1]?.trim() || '',
      dateArrivee: checkInMatch?.[1] || '',
      dateDepart: checkOutMatch?.[1] || '',
      pieceJointe: attachments[0]?.name || ''
    };
  }

  private extractVisaData(text: string, attachments: EmailAttachment[]): any {
    const passportMatch = text.match(/passeport\s*n°?\s*([A-Z0-9]+)/i);
    const consulateMatch = text.match(/(consulat|embassy)\s+([^,\n\.]+)/i);
    
    return {
      numeroPasseport: passportMatch?.[1] || '',
      consulat: consulateMatch?.[2]?.trim() || '',
      pieceJointe: attachments[0]?.name || ''
    };
  }

  private extractInsuranceData(text: string, attachments: EmailAttachment[]): any {
    const policyMatch = text.match(/police\s*n°?\s*([A-Z0-9]+)/i);
    const insurerMatch = text.match(/(allianz|axa|groupama|mondial assistance)/i);
    
    return {
      numeroPolice: policyMatch?.[1] || '',
      assureur: insurerMatch?.[1] || '',
      pieceJointe: attachments[0]?.name || ''
    };
  }

  /**
   * Importe intelligemment un email dans le bon module
   */
  async importEmail(
    email: EmailContent,
    requestedModule: string,
    userId: string,
    agenceId: string
  ): Promise<ImportResult> {
    try {
      // Détecter le type de contenu
      const detection = this.detectContentType(email);
      
      // Vérifier si le module demandé correspond à la détection
      const finalModule = detection.confidence > 50 ? detection.moduleType : requestedModule;
      const reclassified = finalModule !== requestedModule && detection.confidence > 50;

      // Log de l'import
      const importLog: ImportLog = {
        id: this.generateId(),
        timestamp: new Date(),
        emailId: email.id,
        originalModule: requestedModule,
        finalModule,
        reclassified,
        confidence: detection.confidence,
        indicators: detection.indicators,
        status: 'pending',
        message: '',
        userId,
        agenceId
      };

      let result: ImportResult;

      // Importer dans le bon module
      switch (finalModule) {
        case 'billets':
          result = await this.importToBillets(email, detection.suggestedData, importLog);
          break;
        case 'hotel':
          result = await this.importToHotel(email, detection.suggestedData, importLog);
          break;
        case 'visa':
          result = await this.importToVisa(email, detection.suggestedData, importLog);
          break;
        case 'assurance':
          result = await this.importToAssurance(email, detection.suggestedData, importLog);
          break;
        default:
          // Si aucun module détecté clairement, utiliser le module demandé
          result = await this.importToRequestedModule(email, requestedModule, importLog);
      }

      // Mettre à jour le log
      importLog.status = result.success ? 'success' : 'error';
      importLog.message = result.message;
      await this.saveImportLog(importLog);

      return {
        ...result,
        originalModule: requestedModule,
        finalModule,
        reclassified
      };

    } catch (error) {
      console.error('Erreur lors de l\'import intelligent:', error);
      return {
        success: false,
        originalModule: requestedModule,
        finalModule: requestedModule,
        reclassified: false,
        message: 'Erreur lors de l\'import: ' + (error as Error).message
      };
    }
  }

  private async importToBillets(email: EmailContent, suggestedData: any, log: ImportLog): Promise<ImportResult> {
    try {
      const billetData = {
        emailId: email.id,
        sujetEmail: email.subject,
        expediteurEmail: email.sender,
        dateEmail: email.date,
        pieceJointe: email.attachments[0]?.name || '',
        contenuEmail: email.body,
        ...suggestedData,
        statusImport: 'automatique',
        reclassifie: log.reclassified
      };

      const response = await billetsAPI.create(billetData);
      
      return {
        success: true,
        originalModule: log.originalModule,
        finalModule: 'billets',
        reclassified: log.reclassified,
        entryId: response.data._id,
        message: log.reclassified 
          ? `Email reclassifié automatiquement vers Billets (confiance: ${log.confidence.toFixed(1)}%)`
          : 'Billet créé avec succès',
        data: response.data
      };
    } catch (error) {
      throw new Error('Erreur lors de la création du billet: ' + (error as Error).message);
    }
  }

  private async importToHotel(email: EmailContent, suggestedData: any, log: ImportLog): Promise<ImportResult> {
    try {
      const hotelData = {
        emailId: email.id,
        sujetEmail: email.subject,
        expediteurEmail: email.sender,
        dateEmail: email.date,
        pieceJointe: email.attachments[0]?.name || '',
        contenuEmail: email.body,
        ...suggestedData,
        statusImport: 'automatique',
        reclassifie: log.reclassified
      };

      const response = await hotelAPI.create(hotelData);
      
      return {
        success: true,
        originalModule: log.originalModule,
        finalModule: 'hotel',
        reclassified: log.reclassified,
        entryId: response.data._id,
        message: log.reclassified 
          ? `Email reclassifié automatiquement vers Hôtels (confiance: ${log.confidence.toFixed(1)}%)`
          : 'Réservation d\'hôtel créée avec succès',
        data: response.data
      };
    } catch (error) {
      throw new Error('Erreur lors de la création de la réservation d\'hôtel: ' + (error as Error).message);
    }
  }

  private async importToVisa(email: EmailContent, suggestedData: any, log: ImportLog): Promise<ImportResult> {
    try {
      const visaData = {
        emailId: email.id,
        sujetEmail: email.subject,
        expediteurEmail: email.sender,
        dateEmail: email.date,
        pieceJointe: email.attachments[0]?.name || '',
        contenuEmail: email.body,
        ...suggestedData,
        statusImport: 'automatique',
        reclassifie: log.reclassified
      };

      const response = await visaAPI.create(visaData);
      
      return {
        success: true,
        originalModule: log.originalModule,
        finalModule: 'visa',
        reclassified: log.reclassified,
        entryId: response.data._id,
        message: log.reclassified 
          ? `Email reclassifié automatiquement vers Visas (confiance: ${log.confidence.toFixed(1)}%)`
          : 'Demande de visa créée avec succès',
        data: response.data
      };
    } catch (error) {
      throw new Error('Erreur lors de la création de la demande de visa: ' + (error as Error).message);
    }
  }

  private async importToAssurance(email: EmailContent, suggestedData: any, log: ImportLog): Promise<ImportResult> {
    try {
      const assuranceData = {
        emailId: email.id,
        sujetEmail: email.subject,
        expediteurEmail: email.sender,
        dateEmail: email.date,
        pieceJointe: email.attachments[0]?.name || '',
        contenuEmail: email.body,
        ...suggestedData,
        statusImport: 'automatique',
        reclassifie: log.reclassified
      };

      const response = await assuranceAPI.create(assuranceData);
      
      return {
        success: true,
        originalModule: log.originalModule,
        finalModule: 'assurance',
        reclassified: log.reclassified,
        entryId: response.data._id,
        message: log.reclassified 
          ? `Email reclassifié automatiquement vers Assurances (confiance: ${log.confidence.toFixed(1)}%)`
          : 'Assurance voyage créée avec succès',
        data: response.data
      };
    } catch (error) {
      throw new Error('Erreur lors de la création de l\'assurance: ' + (error as Error).message);
    }
  }

  private async importToRequestedModule(email: EmailContent, module: string, log: ImportLog): Promise<ImportResult> {
    // Import dans le module demandé si aucune détection claire
    switch (module) {
      case 'billets':
        return this.importToBillets(email, {}, log);
      case 'hotel':
        return this.importToHotel(email, {}, log);
      case 'visa':
        return this.importToVisa(email, {}, log);
      case 'assurance':
        return this.importToAssurance(email, {}, log);
      default:
        throw new Error(`Module "${module}" non supporté`);
    }
  }

  private async saveImportLog(log: ImportLog): Promise<void> {
    // Sauvegarder le log dans la base de données
    try {
      await fetch('/api/import-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log)
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du log d\'import:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Récupère l'historique des imports
   */
  async getImportHistory(agenceId: string, filters?: {
    module?: string;
    reclassified?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<ImportLog[]> {
    try {
      const params = new URLSearchParams();
      params.append('agenceId', agenceId);
      
      if (filters?.module) params.append('module', filters.module);
      if (filters?.reclassified !== undefined) params.append('reclassified', filters.reclassified.toString());
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());

      const response = await fetch(`/api/import-logs?${params.toString()}`);
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }
}

export const smartImportService = new SmartImportService(); 