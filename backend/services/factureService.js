const Facture = require('../models/factureModel');
const Fournisseur = require('../models/fournisseurModel');
const Operation = require('../models/operationModel');

class FactureService {
  /**
   * Gère le paiement d'une facture fournisseur avec choix du mode de paiement
   * @param {Object} params - Paramètres du paiement
   * @param {string} params.factureId - ID de la facture
   * @param {string} params.fournisseurId - ID du fournisseur
   * @param {number} params.montantAPayer - Montant à payer
   * @param {string} params.modePaiement - 'solde_crediteur', 'moyen_paiement', ou 'mixte'
   * @param {string} params.moyenPaiement - Moyen de paiement (si applicable)
   * @param {string} params.agenceId - ID de l'agence
   * @param {string} params.userId - ID de l'utilisateur
   * @returns {Object} Résultat du paiement
   */
  static async payerFactureFournisseur(params) {
    const {
      factureId,
      fournisseurId,
      montantAPayer,
      modePaiement,
      moyenPaiement = 'especes',
      agenceId,
      userId
    } = params;

    // Récupérer la facture et le fournisseur
    const facture = await Facture.findById(factureId);
    const fournisseur = await Fournisseur.findById(fournisseurId);

    if (!facture || !fournisseur) {
      throw new Error('Facture ou fournisseur non trouvé');
    }

    const montantRestant = facture.montantTTC - (facture.montantPaye || 0);
    const soldeCrediteur = fournisseur.soldeCrediteur || 0;

    let montantPayeParSolde = 0;
    let montantPayeParMoyen = 0;
    let nouveauStatut = facture.statut;

    // Calculer les montants selon le mode de paiement
    switch (modePaiement) {
      case 'solde_crediteur':
        // Payer uniquement avec le solde créditeur
        if (soldeCrediteur >= montantAPayer) {
          montantPayeParSolde = montantAPayer;
          nouveauStatut = 'payee';
        } else {
          montantPayeParSolde = soldeCrediteur;
          nouveauStatut = 'partiellement_payee';
        }
        break;

      case 'moyen_paiement':
        // Payer uniquement avec le moyen de paiement
        montantPayeParMoyen = montantAPayer;
        nouveauStatut = montantAPayer >= montantRestant ? 'payee' : 'partiellement_payee';
        break;

      case 'mixte':
        // Payer d'abord avec le solde, puis avec le moyen de paiement
        if (soldeCrediteur > 0) {
          montantPayeParSolde = Math.min(soldeCrediteur, montantAPayer);
          montantPayeParMoyen = montantAPayer - montantPayeParSolde;
        } else {
          montantPayeParMoyen = montantAPayer;
        }
        nouveauStatut = (montantPayeParSolde + montantPayeParMoyen) >= montantRestant ? 'payee' : 'partiellement_payee';
        break;

      default:
        throw new Error('Mode de paiement invalide');
    }

    // Mettre à jour la facture
    const nouveauMontantPaye = (facture.montantPaye || 0) + montantPayeParSolde + montantPayeParMoyen;
    
    facture.montantPaye = nouveauMontantPaye;
    facture.statut = nouveauStatut;
    facture.modePaiement = modePaiement;
    facture.montantPayeParSolde = (facture.montantPayeParSolde || 0) + montantPayeParSolde;
    facture.montantPayeParMoyen = (facture.montantPayeParMoyen || 0) + montantPayeParMoyen;

    // Ajouter le versement si payé par moyen de paiement
    if (montantPayeParMoyen > 0) {
      facture.versements.push({
        montant: montantPayeParMoyen,
        date: new Date(),
        moyenPaiement: moyenPaiement,
        utiliseSoldeCrediteur: false
      });
    }

    // Ajouter un versement virtuel pour le solde créditeur
    if (montantPayeParSolde > 0) {
      facture.versements.push({
        montant: montantPayeParSolde,
        date: new Date(),
        moyenPaiement: 'solde_crediteur',
        utiliseSoldeCrediteur: true
      });
    }

    await facture.save();

    // Mettre à jour le solde créditeur du fournisseur
    if (montantPayeParSolde > 0) {
      fournisseur.soldeCrediteur = Math.max(0, fournisseur.soldeCrediteur - montantPayeParSolde);
      await fournisseur.save();
    }

    // Créer une opération de caisse si payé par moyen de paiement
    if (montantPayeParMoyen > 0) {
      await Operation.create({
        type: 'sortie',
        categorie: 'paiement_fournisseur',
        montant: montantPayeParMoyen,
        description: `Paiement facture ${facture.numero} - ${fournisseur.entreprise || fournisseur.nom}`,
        modePaiement: moyenPaiement,
        fournisseurId: fournisseurId,
        factureId: factureId,
        agenceId: agenceId,
        userId: userId,
        date: new Date()
      });
    }

    // Mettre à jour la dette du fournisseur
    await fournisseur.calculerSoldes();

    return {
      success: true,
      facture: facture,
      fournisseur: fournisseur,
      details: {
        montantPayeParSolde,
        montantPayeParMoyen,
        nouveauStatut,
        soldeCrediteurRestant: fournisseur.soldeCrediteur
      }
    };
  }

  /**
   * Vérifie si un fournisseur peut payer une facture avec son solde créditeur
   * @param {string} fournisseurId - ID du fournisseur
   * @param {number} montantFacture - Montant de la facture
   * @returns {Object} Informations sur la capacité de paiement
   */
  static async verifierCapacitePaiement(fournisseurId, montantFacture) {
    const fournisseur = await Fournisseur.findById(fournisseurId);
    if (!fournisseur) {
      throw new Error('Fournisseur non trouvé');
    }

    const soldeCrediteur = fournisseur.soldeCrediteur || 0;
    const peutPayerCompletement = soldeCrediteur >= montantFacture;
    const montantPayable = Math.min(soldeCrediteur, montantFacture);
    const montantRestant = montantFacture - montantPayable;

    return {
      soldeCrediteur,
      peutPayerCompletement,
      montantPayable,
      montantRestant,
      statutRecommandé: peutPayerCompletement ? 'payee' : 'partiellement_payee'
    };
  }
}

module.exports = FactureService; 