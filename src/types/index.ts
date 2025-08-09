export interface User {
  id: string;
  _id?: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: 'superadmin' | 'agence' | 'agent';
  agenceId?: string;
  agences?: Agence[];
  permissions?: Permission[];
  statut?: 'actif' | 'suspendu' | 'en_attente';
  token?: string;
}

export interface Agence {
  id: string;
  _id?: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  logo?: string;
  statut: 'en_attente' | 'approuve' | 'rejete' | 'suspendu';
  dateInscription: string;
  modulesActifs: string[];
  modulesDemandes?: string[];
  modulesChoisis?: string[];
  pays?: string;
  wilaya?: string;
  siteWeb?: string;
  numeroRC?: string;
  numeroNIF?: string;
  numeroNIS?: string;
  articleImposition?: string;
  ibanRIB?: string;
  typeActivite?: string;
  informationsBancaires?: {
    banque: string;
    rib: string;
    swift?: string;
  };
}

export interface Permission {
  module: string;
  actions: string[];
}

export interface Client {
  id: string;
  _id?: string;
  nom: string;
  prenom?: string;
  entreprise?: string;
  typeClient: 'particulier' | 'entreprise' | 'partenaire';
  email: string;
  telephone: string;
  adresse: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  solde: number;
  statut: 'actif' | 'inactif' | 'suspendu';
  notes?: string;
  dateCreation: string;
}

export interface Fournisseur {
  id: string;
  _id?: string;
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  adresse: string;
  typeServices: string[]; // Billets, Visa, Hôtels, Packages, Autres
  contact?: string;
  detteFournisseur: number; // Montants à payer (factures impayées)
  soldeCrediteur: number; // Avances versées non encore utilisées
  dateCreation?: string;
}

export interface PreFacture {
  id: string;
  _id?: string;
  numero: string;
  clientId: string;
  client: Client;
  dateCreation: string;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'facture';
  montantHT: number;
  montantTTC: number;
  articles: ArticleCommande[];
}

export interface ArticleCommande {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
  prestation?: import('./prestations').PrestationFields;
}

export interface VersementFacture {
  montant: number;
  date: string;
}

export interface Reglement {
  montant: number;
  date: string;
  moyenPaiement?: string;
}

export interface Facture {
  id: string;
  _id?: string;
  numero: string;
  clientId?: string;
  client?: Client;
  fournisseurId?: string;
  fournisseur?: Fournisseur;
  dateEmission: string;
  dateEcheance: string;
  statut: 'brouillon' | 'envoyee' | 'partiellement_payee' | 'payee' | 'en_retard' | 'annulee';
  montantHT: number;
  montantTTC: number;
  montantPaye?: number;
  montantRestant?: number;
  articles: ArticleCommande[];
  versements?: VersementFacture[];
  modePaiement?: string;
  reglements?: Reglement[];
  resteAPayer?: number;
}

export interface OperationCaisse {
  id: string;
  type: 'entree' | 'sortie';
  montant: number;
  description: string;
  date: string;
  categorie: string;
  reference?: string;
  typeOperation: 'paiement_facture' | 'recharge_client' | 'vente_libre' | 'remboursement' | 'avoir' | 'paiement_fournisseur' | 'salaire_agent' | 'depense_diverse' | 'autre';
  modePaiement: 'especes' | 'cheque' | 'virement';
  referenceFacture?: string;
  referenceClient?: string;
  referenceAgent?: string;
  referenceFournisseur?: string;
  produit?: string;
  origine?: string;
  motif?: string;
}

export interface Package {
  _id?: string;
  id: string;
  nom: string;
  prix: number;
  description: string;
  duree: string;
  villesHotels: { ville: string; hotel: string }[];
  pays: string;
  placesDisponibles: number;
  dateDebut: string;
  dateFin: string;
  image: string;
  enAvant: boolean;
  inclusions: string[];
  itineraire: { jour: number; description:string }[];
  visible: boolean;
  dateCreation: string;
}

export interface BilletAvion {
  id: string;
  numeroVol: string;
  compagnie: string;
  dateDepart: string;
  dateArrivee: string;
  origine: string;
  destination: string;
  passager: string;
  prix: number;
  statut: 'confirme' | 'annule' | 'en_attente';
}

export interface Agent {
  id: string;
  _id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  permissions: Permission[];
  statut: 'actif' | 'suspendu';
  dateCreation: string;
}

export interface Ticket {
  id: string;
  agenceId: string;
  agence: {
    nom: string;
    email: string;
    telephone: string;
  };
  sujet: string;
  description: string;
  statut: 'ouvert' | 'en_cours' | 'ferme';
  priorite: 'faible' | 'normale' | 'haute' | 'urgente';
  dateCreation: string;
  dateMAJ: string;
  reponses?: TicketReponse[];
}

export interface TicketReponse {
  id?: string;
  message: string;
  date: string;
  userId: string;
  userName: string;
  userRole: string;
}

export interface Reservation {
  id: string;
  numero: string;
  clientId: string;
  clientNom: string;
  type: 'vol' | 'hotel' | 'package' | 'transport';
  destination: string;
  dateDepart: string;
  dateRetour: string;
  nombrePersonnes: number;
  montant: number;
  statut: 'confirmee' | 'en_attente' | 'annulee' | 'terminee';
  dateCreation: string;
  notes?: string;
}

export interface Document {
  id: string;
  nom: string;
  type: 'pdf' | 'doc' | 'excel' | 'image' | 'autre';
  taille: number;
  clientId?: string;
  clientNom?: string;
  categorie: 'contrat' | 'facture' | 'devis' | 'photo' | 'passeport' | 'autre';
  dateCreation: string;
  dateModification: string;
  url: string;
  description?: string;
}

export interface Contact {
  id: string;
  nom: string;
  prenom: string;
  entreprise?: string;
  email: string;
  telephone: string;
  statut: 'prospect' | 'client' | 'ancien_client';
  source: 'site_web' | 'recommandation' | 'publicite' | 'salon' | 'autre';
  score: number;
  derniereInteraction: string;
  prochainRappel?: string;
  notes: string;
  interactions: Interaction[];
  dateCreation: string;
}

export interface Interaction {
  id: string;
  type: 'appel' | 'email' | 'rencontre' | 'devis' | 'vente';
  date: string;
  description: string;
  resultat?: 'positif' | 'neutre' | 'negatif';
}

// Interface Notification - COMMENTÉ TEMPORAIREMENT
// export interface Notification {
//   id: string;
//   type: 'email' | 'sms' | 'push' | 'systeme';
//   titre: string;
//   message: string;
//   destinataire: string;
//   statut: 'envoye' | 'en_attente' | 'echec' | 'lu';
//   priorite: 'faible' | 'normale' | 'haute' | 'urgente';
//   dateCreation: string;
//   dateEnvoi?: string;
//   dateOuverture?: string;
//   erreur?: string;
// }

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  type: 'reservation' | 'rappel' | 'rendez_vous' | 'tache' | 'autre';
  clientId?: string;
  clientNom?: string;
  description?: string;
  location?: string;
  color: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  duration?: number;
  affectedResource?: string;
  oldValue?: any;
  newValue?: any;
}

export interface ModuleRequest {
  id: string;
  agenceId: string;
  modules: string[];
  message: string;
  statut: 'en_attente' | 'approuve' | 'rejete';
  dateCreation: string;
  dateTraitement?: string;
  commentaireAdmin?: string;
  agence: {
    nom: string;
    email: string;
    telephone: string;
  };
}

// Export des types de prestations
export * from './prestations';