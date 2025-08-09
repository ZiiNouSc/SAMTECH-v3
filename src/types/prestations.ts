export type PrestationType = 'billet' | 'hotel' | 'visa' | 'assurance' | 'autre';

export interface BasePrestationFields {
  type: PrestationType;
  designation: string;
  designationAuto?: boolean;
}

export interface BilletFields extends BasePrestationFields {
  type: 'billet';
  pax: string;
  numeroBillet: string;
  dateDepart: string;
  dateRetour: string;
  villeDepart: string;
  villeArrivee: string;
  compagnie?: string;
}

export interface HotelFields extends BasePrestationFields {
  type: 'hotel';
  nomClient: string;
  nomHotel: string;
  ville: string;
  dateEntree: string;
  dateSortie: string;
  numeroVoucher: string;
}

export interface VisaFields extends BasePrestationFields {
  type: 'visa';
  nomClient: string;
  typeVisa: string;
  paysVise: string;
  dateDepot: string;
}

export interface AssuranceFields extends BasePrestationFields {
  type: 'assurance';
  nomAssure: string;
  typeAssurance: string;
  dateDebut: string;
  dateFin: string;
  numeroPolice: string;
}

export interface AutrePrestationFields extends BasePrestationFields {
  type: 'autre';
  designationLibre: string;
  dateDebut?: string;
  dateFin?: string;
  ville?: string;
  duree?: string;
}

export type PrestationFields = 
  | BilletFields 
  | HotelFields 
  | VisaFields 
  | AssuranceFields 
  | AutrePrestationFields;

export interface PrestationFieldsConfig {
  type: PrestationType;
  label: string;
  icon: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'date' | 'select';
    required: boolean;
    options?: string[];
    placeholder?: string;
  }>;
  generateDesignation: (fields: any) => string;
}

export interface ArticleWithPrestation {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
  prestation?: PrestationFields;
} 

export interface PrestationExistante {
  id: string;
  type: PrestationType;
  reference: string;
  designation: string;
  prix: number;
  datePrestation: string;
  client: {
    _id: string;
    nom: string;
    prenom: string;
    entreprise?: string;
  };
  details: PrestationFields;
  selected?: boolean;
} 