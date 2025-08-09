import { 
  PrestationFieldsConfig, 
  PrestationType, 
  BilletFields, 
  HotelFields, 
  VisaFields, 
  AssuranceFields, 
  AutrePrestationFields 
} from '../types/prestations';

export const prestationConfigs: Record<PrestationType, PrestationFieldsConfig> = {
  billet: {
    type: 'billet',
    label: 'Billet d\'avion',
    icon: '✈️',
    fields: [
      { key: 'pax', label: 'Nom du passager (PAX)', type: 'text', required: true, placeholder: 'Ex: DUPONT/JEAN MR' },
      { key: 'numeroBillet', label: 'Numéro de billet', type: 'text', required: true, placeholder: 'Ex: 0571234567890' },
      { key: 'dateDepart', label: 'Date de départ', type: 'date', required: true },
      { key: 'dateRetour', label: 'Date de retour', type: 'date', required: false },
      { key: 'villeDepart', label: 'Ville de départ', type: 'text', required: true, placeholder: 'Ex: Alger' },
      { key: 'villeArrivee', label: 'Ville d\'arrivée', type: 'text', required: true, placeholder: 'Ex: Paris' },
      { key: 'compagnie', label: 'Compagnie aérienne', type: 'text', required: false, placeholder: 'Ex: Air Algérie' }
    ],
    generateDesignation: (fields: BilletFields) => {
      const compagnieText = fields.compagnie ? `, vol ${fields.compagnie}` : '';
      const retourText = fields.dateRetour ? `, retour le ${new Date(fields.dateRetour).toLocaleDateString('fr-FR')}` : '';
      return `Billet d'avion pour ${fields.pax}${compagnieText}, ${fields.villeDepart} → ${fields.villeArrivee}, départ le ${new Date(fields.dateDepart).toLocaleDateString('fr-FR')}${retourText} - N° billet : ${fields.numeroBillet}`;
    }
  },

  hotel: {
    type: 'hotel',
    label: 'Hôtel',
    icon: '🏨',
    fields: [
      { key: 'nomClient', label: 'Nom du client', type: 'text', required: true, placeholder: 'Ex: M. DUPONT Jean' },
      { key: 'nomHotel', label: 'Nom de l\'hôtel', type: 'text', required: true, placeholder: 'Ex: Hôtel Hilton' },
      { key: 'ville', label: 'Ville', type: 'text', required: true, placeholder: 'Ex: Paris' },
      { key: 'dateEntree', label: 'Date d\'entrée', type: 'date', required: true },
      { key: 'dateSortie', label: 'Date de sortie', type: 'date', required: true },
      { key: 'numeroVoucher', label: 'Numéro de voucher', type: 'text', required: true, placeholder: 'Ex: HTL2024001' }
    ],
    generateDesignation: (fields: HotelFields) => {
      return `Réservation hôtel ${fields.nomHotel} pour ${fields.nomClient}, du ${new Date(fields.dateEntree).toLocaleDateString('fr-FR')} au ${new Date(fields.dateSortie).toLocaleDateString('fr-FR')} à ${fields.ville} - Voucher N° ${fields.numeroVoucher}`;
    }
  },

  visa: {
    type: 'visa',
    label: 'Visa',
    icon: '📋',
    fields: [
      { key: 'nomClient', label: 'Nom du client', type: 'text', required: true, placeholder: 'Ex: M. DUPONT Jean' },
      { 
        key: 'typeVisa', 
        label: 'Type de visa', 
        type: 'select', 
        required: true,
        options: ['Court séjour', 'Long séjour', 'Multiple entrées', 'Transit', 'Affaires', 'Tourisme', 'Étudiant']
      },
      { key: 'paysVise', label: 'Pays visé', type: 'text', required: true, placeholder: 'Ex: France' },
      { key: 'dateDepot', label: 'Date de dépôt', type: 'date', required: true }
    ],
    generateDesignation: (fields: VisaFields) => {
      return `Demande de visa ${fields.typeVisa} pour ${fields.nomClient} - Destination : ${fields.paysVise} - Déposé le ${new Date(fields.dateDepot).toLocaleDateString('fr-FR')}`;
    }
  },

  assurance: {
    type: 'assurance',
    label: 'Assurance',
    icon: '🛡️',
    fields: [
      { key: 'nomAssure', label: 'Nom de l\'assuré', type: 'text', required: true, placeholder: 'Ex: M. DUPONT Jean' },
      { 
        key: 'typeAssurance', 
        label: 'Type d\'assurance', 
        type: 'select', 
        required: true,
        options: ['Voyage', 'Rapatriement', 'Annulation', 'Multirisque', 'Santé internationale', 'Responsabilité civile']
      },
      { key: 'dateDebut', label: 'Date de début', type: 'date', required: true },
      { key: 'dateFin', label: 'Date de fin', type: 'date', required: true },
      { key: 'numeroPolice', label: 'Référence police', type: 'text', required: true, placeholder: 'Ex: ASS2024001' }
    ],
    generateDesignation: (fields: AssuranceFields) => {
      return `Assurance ${fields.typeAssurance} pour ${fields.nomAssure}, du ${new Date(fields.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(fields.dateFin).toLocaleDateString('fr-FR')} - Réf : ${fields.numeroPolice}`;
    }
  },

  autre: {
    type: 'autre',
    label: 'Autre prestation',
    icon: '📦',
    fields: [
      { key: 'designationLibre', label: 'Désignation de la prestation', type: 'text', required: true, placeholder: 'Ex: Transport privé, Guide touristique...' },
      { key: 'ville', label: 'Ville/Destination', type: 'text', required: false, placeholder: 'Ex: Alger' },
      { key: 'dateDebut', label: 'Date de début', type: 'date', required: false },
      { key: 'dateFin', label: 'Date de fin', type: 'date', required: false },
      { key: 'duree', label: 'Durée', type: 'text', required: false, placeholder: 'Ex: 3 jours, 2 heures...' }
    ],
    generateDesignation: (fields: AutrePrestationFields) => {
      let designation = `Prestation : ${fields.designationLibre}`;
      
      if (fields.ville) {
        designation += ` à ${fields.ville}`;
      }
      
      if (fields.dateDebut && fields.dateFin) {
        designation += ` du ${new Date(fields.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(fields.dateFin).toLocaleDateString('fr-FR')}`;
      } else if (fields.dateDebut) {
        designation += ` le ${new Date(fields.dateDebut).toLocaleDateString('fr-FR')}`;
      }
      
      if (fields.duree) {
        designation += ` - Durée : ${fields.duree}`;
      }
      
      return designation;
    }
  }
};

export const generateDesignationForPrestation = (prestation: any): string => {
  const config = prestationConfigs[prestation.type as PrestationType];
  if (!config) return prestation.designation || '';
  
  // Si c'est une désignation déjà complète venant des sélecteurs, la retourner
  if (prestation.designation && prestation.designation.includes('\n')) {
    return prestation.designation;
  }
  
  // Générer une désignation détaillée selon le type
  switch (prestation.type) {
    case 'billet':
      return generateBilletDesignation(prestation);
    case 'hotel':
      return generateHotelDesignation(prestation);
    case 'visa':
      return generateVisaDesignation(prestation);
    case 'assurance':
      return generateAssuranceDesignation(prestation);
    default:
      return config.generateDesignation(prestation);
  }
};

// Fonction pour générer la désignation des billets
const generateBilletDesignation = (prestation: any): string => {
  const passager = prestation.passager || prestation.pax || prestation.nomPassager || 'Passager non spécifié';
  const origine = prestation.origine || prestation.villeDepart || 'Ville de départ';
  const destination = prestation.destination || prestation.villeArrivee || 'Ville d\'arrivée';
  const compagnie = prestation.compagnie || 'Compagnie aérienne';
  const numeroVol = prestation.numeroVol || prestation.numeroBillet || '';
  const dateDepart = prestation.dateDepart || '';
  const dateRetour = prestation.dateRetour || prestation.dateArrivee || '';
  
  let designation = `Billet d'avion - ${passager}`;
  
  if (origine !== 'Ville de départ' && destination !== 'Ville d\'arrivée') {
    designation += `\nTrajet: ${origine} → ${destination}`;
  }
  
  if (compagnie !== 'Compagnie aérienne') {
    designation += `\nCompagnie: ${compagnie}`;
    if (numeroVol) {
      designation += ` - Vol ${numeroVol}`;
    }
  }
  
  if (dateDepart) {
    const dateFormatee = new Date(dateDepart).toLocaleDateString('fr-FR');
    designation += `\nDate de départ: ${dateFormatee}`;
    
    if (dateRetour && dateRetour !== dateDepart) {
      const dateRetourFormatee = new Date(dateRetour).toLocaleDateString('fr-FR');
      designation += ` - Retour: ${dateRetourFormatee}`;
    }
  }
  
  if (numeroVol && !designation.includes('Vol')) {
    designation += `\nN° de billet: ${numeroVol}`;
  }
  
  return designation;
};

// Fonction pour générer la désignation des hôtels
const generateHotelDesignation = (prestation: any): string => {
  const nomHotel = prestation.nomHotel || 'Hôtel';
  const ville = prestation.ville || '';
  const dateArrivee = prestation.dateArrivee || prestation.dateEntree || '';
  const dateDepart = prestation.dateDepart || prestation.dateSortie || '';
  const nombreNuits = prestation.nombreNuits || '';
  const nombreChambres = prestation.nombreChambres || '';
  const typeChambres = prestation.typeChambres || 'Standard';
  const clientNom = prestation.clientNom || prestation.nomClient || '';
  
  let designation = `Réservation hôtel - ${nomHotel}`;
  
  if (ville) {
    designation += ` à ${ville}`;
  }
  
  if (dateArrivee && dateDepart) {
    const dateArriveeFormatee = new Date(dateArrivee).toLocaleDateString('fr-FR');
    const dateDepartFormatee = new Date(dateDepart).toLocaleDateString('fr-FR');
    designation += `\nPériode: du ${dateArriveeFormatee} au ${dateDepartFormatee}`;
    
    if (nombreNuits) {
      designation += ` (${nombreNuits} nuit${nombreNuits > 1 ? 's' : ''})`;
    }
  }
  
  if (nombreChambres) {
    designation += `\n${nombreChambres} chambre(s) ${typeChambres}`;
  }
  
  if (clientNom) {
    designation += `\nClient: ${clientNom}`;
  }
  
  return designation;
};

// Fonction pour générer la désignation des visas
const generateVisaDesignation = (prestation: any): string => {
  const typeVisa = prestation.typeVisa || 'Visa';
  const pays = prestation.pays || prestation.paysVise || '';
  const demandeur = prestation.demandeur || prestation.clientNom || prestation.nomClient || '';
  const numeroPasseport = prestation.numeroPasseport || '';
  const duree = prestation.duree || '';
  const dateDebut = prestation.dateDebut || prestation.dateDepot || '';
  const dateFin = prestation.dateFin || '';
  
  let designation = typeVisa;
  
  if (pays) {
    designation += ` pour ${pays}`;
  }
  
  if (demandeur) {
    designation += `\nDemandeur: ${demandeur}`;
  }
  
  if (numeroPasseport) {
    designation += `\nPasseport: ${numeroPasseport}`;
  }
  
  if (duree) {
    designation += `\nDurée: ${duree}`;
  }
  
  if (dateDebut && dateFin) {
    const dateDebutFormatee = new Date(dateDebut).toLocaleDateString('fr-FR');
    const dateFinFormatee = new Date(dateFin).toLocaleDateString('fr-FR');
    designation += `\nValidité: du ${dateDebutFormatee} au ${dateFinFormatee}`;
  } else if (dateDebut) {
    const dateFormatee = new Date(dateDebut).toLocaleDateString('fr-FR');
    designation += `\nDate de dépôt: ${dateFormatee}`;
  }
  
  return designation;
};

// Fonction pour générer la désignation des assurances
const generateAssuranceDesignation = (prestation: any): string => {
  const typeAssurance = prestation.typeAssurance || 'Assurance';
  const compagnie = prestation.compagnieAssurance || '';
  const assure = prestation.assure || prestation.clientNom || prestation.nomAssure || '';
  const numeroPolice = prestation.numeroPolice || '';
  const montantCouverture = prestation.montantCouverture || '';
  const dateDebut = prestation.dateDebut || '';
  const dateFin = prestation.dateFin || '';
  
  let designation = typeAssurance;
  
  if (compagnie) {
    designation += ` - ${compagnie}`;
  }
  
  if (assure) {
    designation += `\nAssuré: ${assure}`;
  }
  
  if (numeroPolice) {
    designation += `\nPolice N°: ${numeroPolice}`;
  }
  
  if (montantCouverture) {
    designation += `\nCouverture: ${typeof montantCouverture === 'number' ? montantCouverture.toLocaleString('fr-FR') + ' DA' : montantCouverture}`;
  }
  
  if (dateDebut && dateFin) {
    const dateDebutFormatee = new Date(dateDebut).toLocaleDateString('fr-FR');
    const dateFinFormatee = new Date(dateFin).toLocaleDateString('fr-FR');
    designation += `\nPériode: du ${dateDebutFormatee} au ${dateFinFormatee}`;
  } else if (dateDebut) {
    const dateFormatee = new Date(dateDebut).toLocaleDateString('fr-FR');
    designation += `\nDate de début: ${dateFormatee}`;
  }
  
  return designation;
};

export const createEmptyPrestationFields = (type: PrestationType): any => {
  const baseFields = {
    type,
    designation: '',
    designationAuto: true
  };

  switch (type) {
    case 'billet':
      return {
        ...baseFields,
        pax: '',
        numeroBillet: '',
        dateDepart: '',
        dateRetour: '',
        villeDepart: '',
        villeArrivee: '',
        compagnie: ''
      };
    
    case 'hotel':
      return {
        ...baseFields,
        nomClient: '',
        nomHotel: '',
        ville: '',
        dateEntree: '',
        dateSortie: '',
        numeroVoucher: ''
      };
    
    case 'visa':
      return {
        ...baseFields,
        nomClient: '',
        typeVisa: '',
        paysVise: '',
        dateDepot: ''
      };
    
    case 'assurance':
      return {
        ...baseFields,
        nomAssure: '',
        typeAssurance: '',
        dateDebut: '',
        dateFin: '',
        numeroPolice: ''
      };
    
    case 'autre':
      return {
        ...baseFields,
        designationLibre: '',
        ville: '',
        dateDebut: '',
        dateFin: '',
        duree: ''
      };
    
    default:
      return baseFields;
  }
};

export const validatePrestationFields = (prestation: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = prestationConfigs[prestation.type as PrestationType];
  
  if (!config) {
    errors.push('Type de prestation invalide');
    return { isValid: false, errors };
  }

  config.fields.forEach(field => {
    if (field.required && (!prestation[field.key] || prestation[field.key].trim() === '')) {
      errors.push(`Le champ "${field.label}" est obligatoire`);
    }
  });

  return { isValid: errors.length === 0, errors };
}; 