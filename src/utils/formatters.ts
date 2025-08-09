/**
 * Formate un statut de facture pour l'affichage
 * @param statut - Le statut brut de la base de données
 * @returns Le statut formaté pour l'affichage
 */
export const formatStatut = (statut: string): string => {
  const statutsMap: Record<string, string> = {
    'brouillon': 'Brouillon',
    'en_attente': 'En attente',
    'envoyee': 'Envoyée',
    'recue': 'Reçue',
    'partiellement_payee': 'Partiellement payée',
    'payee': 'Payée',
    'en_retard': 'En retard',
    'annulee': 'Annulée',
    'envoye': 'Envoyé',
    'accepte': 'Accepté',
    'refuse': 'Refusé',
    'facture': 'Facture'
  };

  return statutsMap[statut] || statut;
};

/**
 * Formate un montant en dinars algériens
 * @param montant - Le montant à formater
 * @returns Le montant formaté avec la devise
 */
export const formatMontant = (montant: number): string => {
  return `${montant.toLocaleString('fr-FR')} DA`;
};

/**
 * Formate un montant avec style currency en DA
 * @param montant - Le montant à formater
 * @returns Le montant formaté avec style currency en DA
 */
export const formatMontantCurrency = (montant: number): string => {
  return `${montant.toLocaleString('fr-FR')} DA`;
};

/**
 * Formate une date pour l'affichage
 * @param date - La date à formater
 * @returns La date formatée
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('fr-FR');
};

/**
 * Formate un numéro de téléphone
 * @param telephone - Le numéro de téléphone à formater
 * @returns Le numéro formaté
 */
export const formatTelephone = (telephone: string): string => {
  if (!telephone) return 'Non renseigné';
  
  // Supprimer tous les caractères non numériques
  const cleaned = telephone.replace(/\D/g, '');
  
  // Formater selon la longueur
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{2})/, '$1 $2 $3 $4');
  } else if (cleaned.length === 9) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }
  
  return telephone;
}; 