const Fournisseur = require('../models/fournisseurModel');
const Facture = require('../models/factureModel');

class FournisseurService {
  /**
   * Gère la création d'une facture fournisseur et la mise à jour des soldes
   * @param {Object} params
   * @param {string} params.fournisseurId
   * @param {number} params.montantTTC
   * @param {string} params.agenceId
   * @param {string} params.userId
   * @param {string} params.numero
   * @param {Date} params.dateEmission
   * @param {Date} params.dateEcheance
   * @param {Array} params.articles
   * @param {string} params.statut
   * @param {number} params.montantHT
   * @param {number} params.tva
   * @returns {Object}
   */
  static async handleCreationFacture({
    fournisseurId,
    montantTTC,
    agenceId,
    userId,
    numero,
    dateEmission,
    dateEcheance,
    articles,
    statut,
    montantHT,
    tva
  }) {
    try {
      console.log('🔄 Début handleCreationFacture pour fournisseur:', fournisseurId);
      console.log('📊 Montant facture:', montantTTC, 'DA, Statut:', statut);

      // Récupérer le fournisseur
      const fournisseur = await Fournisseur.findById(fournisseurId);
      if (!fournisseur) {
        throw new Error('Fournisseur non trouvé');
      }

      console.log('💰 Dette initiale du fournisseur:', fournisseur.detteFournisseur || 0, 'DA');

      // MISE À JOUR IMMÉDIATE DE LA DETTE DANS LA BASE DE DONNÉES
      // On ajoute le montant de la facture à la dette existante (peu importe le statut)
      const nouvelleDette = (fournisseur.detteFournisseur || 0) + montantTTC;
      
      await Fournisseur.findByIdAndUpdate(fournisseurId, {
        detteFournisseur: nouvelleDette
      });

      console.log('✅ Dette mise à jour:', nouvelleDette, 'DA');
      console.log('📈 Dette ajoutée:', montantTTC, 'DA');

      // Log de création de la facture
      console.log('📋 Facture créée:', {
        numero,
        montant: montantTTC,
        statut,
        detteAvant: fournisseur.detteFournisseur || 0,
        detteApres: nouvelleDette
      });

      return {
        success: true,
        message: 'Facture créée et dette mise à jour',
        detteAjoutee: montantTTC,
        nouvelleDette: nouvelleDette
      };

    } catch (error) {
      console.error('❌ Erreur dans handleCreationFacture:', error);
      throw error;
    }
  }

  /**
   * Calcule dynamiquement la dette et le solde de chaque fournisseur
   * @param {string} agenceId - ID de l'agence
   * @returns {Array} Liste des fournisseurs avec leurs soldes calculés
   */
  static async getSyntheseFournisseurs(agenceId) {
    try {
      console.log('🔄 Calcul de la synthèse des fournisseurs pour agence:', agenceId);

      // Récupérer tous les fournisseurs de l'agence
      const fournisseurs = await Fournisseur.find({ agenceId });
      console.log(`📊 ${fournisseurs.length} fournisseurs trouvés`);

      const synthese = [];

      for (const fournisseur of fournisseurs) {
        console.log(`\n🔍 Traitement fournisseur: ${fournisseur.entreprise} (${fournisseur._id})`);

        // 1. Récupérer toutes les factures du fournisseur (peu importe le statut)
        const factures = await Facture.find({ 
          fournisseurId: fournisseur._id,
          agenceId 
        });
        
        const totalFactures = factures.reduce((sum, facture) => sum + (facture.montantTTC || 0), 0);
        console.log(`   📋 Total factures: ${totalFactures.toLocaleString('fr-FR')} DA (${factures.length} factures)`);

        // 2. Calculer les versements depuis les factures
        let totalVersementsManuels = 0;
        let totalRegleViaSolde = 0;
        
        for (const facture of factures) {
          if (facture.versements && facture.versements.length > 0) {
            for (const versement of facture.versements) {
              if (versement.utiliseSoldeCrediteur) {
                // Versement effectué via le solde créditeur du fournisseur
                totalRegleViaSolde += Math.abs(versement.montant) || 0;
              } else {
                // Versement effectué en caisse/banque
                totalVersementsManuels += Math.abs(versement.montant) || 0;
              }
            }
          }
        }
        
        console.log(`   💰 Total versements manuels: ${totalVersementsManuels.toLocaleString('fr-FR')} DA`);
        console.log(`   💳 Total réglé via solde: ${totalRegleViaSolde.toLocaleString('fr-FR')} DA`);

        // 3. Calculer le solde affiché = solde_initial - total_réglé_via_solde
        const soldeCalcule = Math.max(0, (fournisseur.soldeCrediteur || 0) - totalRegleViaSolde);
        console.log(`   💵 Solde calculé: ${soldeCalcule.toLocaleString('fr-FR')} DA`);

        // 4. Calculer la dette affichée = dette_initiale + total_factures - total_versements - total_réglé_via_solde
        const detteCalculee = Math.max(0, 
          (fournisseur.detteFournisseur || 0) + 
          totalFactures - 
          totalVersementsManuels - 
          totalRegleViaSolde
        );
        console.log(`   🏦 Dette calculée: ${detteCalculee.toLocaleString('fr-FR')} DA`);

        // 5. Détails pour debug
        const details = {
          detteInitiale: fournisseur.detteFournisseur || 0,
          soldeInitial: fournisseur.soldeCrediteur || 0,
          totalFactures,
          totalVersementsManuels,
          totalRegleViaSolde,
          nombreFactures: factures.length
        };

        console.log(`   📊 Détails:`, details);

        synthese.push({
          _id: fournisseur._id,
          entreprise: fournisseur.entreprise,
          nom: fournisseur.nom,
          prenom: fournisseur.prenom,
          email: fournisseur.email,
          telephone: fournisseur.telephone,
          adresse: fournisseur.adresse,
          soldeCrediteur: fournisseur.soldeCrediteur || 0,
          detteFournisseur: fournisseur.detteFournisseur || 0,
          // Nouvelles valeurs calculées
          soldeCalcule,
          detteCalculee,
          createdAt: fournisseur.createdAt,
          // Détails pour debug
          details
        });
      }

      console.log(`✅ Synthèse calculée pour ${synthese.length} fournisseurs`);
      return synthese;

    } catch (error) {
      console.error('❌ Erreur dans getSyntheseFournisseurs:', error);
      throw error;
    }
  }

  /**
   * Calcule la synthèse pour un fournisseur spécifique
   * @param {string} fournisseurId - ID du fournisseur
   * @param {string} agenceId - ID de l'agence
   * @returns {Object} Fournisseur avec ses soldes calculés
   */
  static async getSyntheseFournisseur(fournisseurId, agenceId) {
    try {
      const fournisseur = await Fournisseur.findOne({ _id: fournisseurId, agenceId });
      if (!fournisseur) {
        throw new Error('Fournisseur non trouvé');
      }

      // Récupérer toutes les factures du fournisseur
      const factures = await Facture.find({ 
        fournisseurId: fournisseur._id, 
        agenceId 
      });

      // Calculer les totaux
      let totalFactures = 0;
      let totalVersementsManuels = 0;
      let totalRegleViaSolde = 0;

      for (const facture of factures) {
        totalFactures += facture.montantTTC || 0;
        
        if (facture.versements && facture.versements.length > 0) {
          for (const versement of facture.versements) {
            if (versement.utiliseSoldeCrediteur) {
              totalRegleViaSolde += Math.abs(versement.montant) || 0;
            } else {
              totalVersementsManuels += Math.abs(versement.montant) || 0;
            }
          }
        }
      }

      // Appliquer la logique métier
      const detteCalculee = Math.max(0, 
        (fournisseur.detteFournisseur || 0) + 
        (totalFactures - totalVersementsManuels - totalRegleViaSolde)
      );

      const soldeCalcule = Math.max(0, 
        (fournisseur.soldeCrediteur || 0) - totalRegleViaSolde
      );

      return {
        ...fournisseur.toObject(),
        detteCalculee: Math.round(detteCalculee * 100) / 100,
        soldeCalcule: Math.round(soldeCalcule * 100) / 100,
        _debug: {
          detteInitiale: fournisseur.detteFournisseur || 0,
          soldeInitial: fournisseur.soldeCrediteur || 0,
          totalFactures,
          totalVersementsManuels,
          totalRegleViaSolde,
          nombreFactures: factures.length
        }
      };
    } catch (error) {
      console.error('Erreur lors du calcul de la synthèse du fournisseur:', error);
      throw new Error(`Erreur lors du calcul de la synthèse: ${error.message}`);
    }
  }

  static async handlePaiementFacture({ fournisseurId, montant, typePaiement, factureId, agenceId, userId }) {
    try {
      console.log('🔄 Début handlePaiementFacture');
      console.log('📊 Montant:', montant, 'DA, Type:', typePaiement);

      // Récupérer le fournisseur
      const fournisseur = await Fournisseur.findById(fournisseurId);
      if (!fournisseur) {
        throw new Error('Fournisseur non trouvé');
      }

      console.log('💰 Dette actuelle du fournisseur:', fournisseur.detteFournisseur || 0, 'DA');

      let nouvelleDette = fournisseur.detteFournisseur || 0;
      let nouveauSolde = fournisseur.soldeCrediteur || 0;

      if (typePaiement === 'solde') {
        // Paiement via solde créditeur
        if (nouveauSolde < montant) {
          throw new Error('Solde insuffisant pour ce paiement');
        }
        
        nouveauSolde -= montant;
        nouvelleDette = Math.max(0, nouvelleDette - montant);
        
        console.log('💳 Paiement via solde:', montant, 'DA');
        console.log('💵 Nouveau solde:', nouveauSolde, 'DA');
        
      } else {
        // Paiement en caisse/banque
        nouvelleDette = Math.max(0, nouvelleDette - montant);
        
        console.log('💰 Paiement en caisse/banque:', montant, 'DA');
      }

      console.log('🏦 Nouvelle dette:', nouvelleDette, 'DA');

      // Mettre à jour le fournisseur
      await Fournisseur.findByIdAndUpdate(fournisseurId, {
        detteFournisseur: nouvelleDette,
        soldeCrediteur: nouveauSolde
      });

      // Log du paiement
      console.log('📋 Paiement traité:', {
        montant,
        typePaiement,
        detteAvant: fournisseur.detteFournisseur || 0,
        detteApres: nouvelleDette,
        soldeAvant: fournisseur.soldeCrediteur || 0,
        soldeApres: nouveauSolde
      });

      return {
        success: true,
        message: 'Paiement traité avec succès',
        nouvelleDette,
        nouveauSolde,
        montantPaye: montant
      };

    } catch (error) {
      console.error('❌ Erreur dans handlePaiementFacture:', error);
      throw error;
    }
  }
}

module.exports = FournisseurService; 