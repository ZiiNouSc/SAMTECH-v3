const mongoose = require('mongoose');
require('../models/billetModel');
const asyncHandler = require('express-async-handler');
const FactureFournisseur = require('../models/factureFournisseurModel');
const Fournisseur = require('../models/fournisseurModel');
const Operation = require('../models/operationModel');
const FournisseurService = require('../services/fournisseurService');
const BilletAvion = require('../models/billetModel');

// Fonction pour générer un numéro séquentiel par agence
const generateNumeroFacture = async (agenceId) => {
  try {
    // Trouver la dernière facture de cette agence
    const derniereFacture = await FactureFournisseur.findOne({ agenceId })
      .sort({ numero: -1 })
      .select('numero');

    let prochainNumero = 1;
    
    if (derniereFacture && derniereFacture.numero) {
      // Extraire le numéro de la dernière facture (format: FF-YYYYMM-XXX)
      const match = derniereFacture.numero.match(/FF-\d{6}-(\d+)/);
      if (match) {
        prochainNumero = parseInt(match[1]) + 1;
      }
    }

    // Générer le nouveau numéro
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const numero = String(prochainNumero).padStart(3, '0');
    
    return `FF-${year}${month}-${numero}`;
  } catch (error) {
    console.error('Erreur lors de la génération du numéro:', error);
    // Fallback: générer un numéro avec timestamp
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-3);
    return `FF-${year}${month}-${timestamp}`;
  }
};

// Récupérer toutes les factures fournisseurs
const getAllFactures = async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    const factures = await FactureFournisseur.find({ agenceId })
      .populate('fournisseurId', 'nom entreprise email telephone')
      .populate('billetsAssocies', 'numero_billet passager compagnie prix_ttc netfournisseur')
      .sort({ createdAt: -1 });

    // Calculer le net fournisseur pour chaque facture
    const facturesAvecNetFournisseur = factures.map(facture => {
      const factureObj = facture.toObject();
      
      // Calculer le net fournisseur basé sur les billets associés
      let netFournisseur = 0;
      if (factureObj.billetsAssocies && factureObj.billetsAssocies.length > 0) {
        // Somme des net fournisseurs des billets
        netFournisseur = factureObj.billetsAssocies.reduce((sum, billet) => {
          const netBillet = billet.netfournisseur || 
                           (billet.informations && billet.informations.netfournisseur) || 
                           billet.prix_ttc || 
                           0;
          return sum + netBillet;
        }, 0);
      } else {
        // Si pas de billets associés, utiliser le montant TTC comme net fournisseur
        netFournisseur = factureObj.montantTTC;
      }
      
      return {
        ...factureObj,
        netFournisseur
      };
    });

    res.json({
      success: true,
      count: facturesAvecNetFournisseur.length,
      data: facturesAvecNetFournisseur
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des factures fournisseurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures fournisseurs'
    });
  }
};

// Obtenir une facture par ID
const getFactureById = async (req, res) => {
  try {
    const facture = await FactureFournisseur.findById(req.params.id)
      .populate('fournisseurId', 'nom entreprise email telephone adresse')
      .populate('billetsAssocies', 'numero_billet passager compagnie prix_ttc');

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture fournisseur non trouvée'
      });
    }

    res.json({
      success: true,
      data: facture
    });
  } catch (error) {
    console.error('Erreur récupération facture fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture fournisseur'
    });
  }
};

// Créer une nouvelle facture fournisseur
const createFacture = async (req, res) => {
  try {
    const {
      fournisseurId,
      dateEmission,
      dateEcheance,
      montantHT,
      montantTTC,
      montantTVA,
      tva,
      articles,
      notes,
      conditionsPaiement,
      billetsAssocies
    } = req.body;

    const { agenceId } = req.user;

    console.log('🏭 Création facture fournisseur - Données reçues:', {
      fournisseurId,
      agenceId,
      montantHT,
      montantTTC,
      billetsAssociesCount: billetsAssocies?.length || 0,
      articlesCount: articles?.length || 0
    });

    // Validation des champs obligatoires
    if (!fournisseurId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID du fournisseur est obligatoire'
      });
    }

    if (!agenceId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de l\'agence est manquant'
      });
    }

    // Vérifier que le fournisseur existe et appartient à la même agence
    const fournisseur = await Fournisseur.findOne({ _id: fournisseurId, agenceId });
    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé ou non autorisé pour cette agence'
      });
    }

    console.log('✅ Fournisseur validé:', fournisseur.entreprise || fournisseur.nom);

    // Générer le numéro de facture fournisseur
    const numero = await generateNumeroFacture(agenceId);
    console.log('📝 Numéro de facture généré:', numero);

    // Traiter les articles avec les billets
    let articlesFinaux = [...(articles || [])];
    
    // Si des billets sont associés, créer des articles détaillés pour chacun
    if (billetsAssocies && billetsAssocies.length > 0) {
      try {
        console.log(`🔍 Recherche de ${billetsAssocies.length} billet(s) pour l'agence ${agenceId}`);
        
        const billets = await BilletAvion.find({ 
          _id: { $in: billetsAssocies },
          agenceId 
        });

        console.log(`✅ Trouvé ${billets.length} billet(s) valide(s)`);

        if (billets.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Aucun billet valide trouvé pour cette agence'
          });
        }

        if (billets.length !== billetsAssocies.length) {
          const billetsNonTrouves = billetsAssocies.filter(id => 
            !billets.some(billet => billet._id.toString() === id.toString())
          );
          console.log(`⚠️ Billets non trouvés ou non autorisés: ${billetsNonTrouves.join(', ')}`);
        }

        const articlesBillets = billets.map(billet => {
          // Créer une désignation détaillée pour chaque billet
          const passager = billet.passager || 
                          (billet.informations && billet.informations.nom_passager) || 
                          'Passager non spécifié';
          const origine = billet.origine || 
                         (billet.informations && billet.informations.ville_depart) || 
                         (billet.informations && billet.informations.origine) || 
                         '';
          const destination = billet.destination || 
                             (billet.informations && billet.informations.ville_arrivee) || 
                             (billet.informations && billet.informations.destination) || 
                             '';
          const compagnie = billet.compagnie || 
                           (billet.informations && billet.informations.compagnie_aerienne) || 
                           billet.code_compagnie || 
                           '';
          const numeroVol = billet.numeroVol || 
                           (billet.informations && billet.informations.numero_vol) || 
                           billet.numero_billet || 
                           '';
          const dateDepart = billet.dateDepart || 
                            (billet.informations && billet.informations.date_depart) || 
                            '';
          const dateRetour = billet.dateRetour || 
                            (billet.informations && billet.informations.date_retour) || 
                            '';
          const classe = billet.classe || 
                        (billet.informations && billet.informations.classe) || 
                        '';
          const typeVol = billet.type_vol || 
                         (billet.informations && billet.informations.type_vol) || 
                         '';
          const numeroBillet = billet.numero_billet || 
                              (billet.informations && billet.informations.numero_billet) || 
                              '';
          
          // Désignation simplifiée en une ligne
          let designation = `BILLET D'AVION - ${passager}`;
          
          // Ajouter les détails en une seule ligne
          let details = [];
          
          if (origine && destination) {
            details.push(`Trajet: ${origine} -> ${destination}`);
          }
          
          if (compagnie) {
            let infoCompagnie = `Compagnie: ${compagnie}`;
            if (numeroVol) {
              infoCompagnie += ` Vol ${numeroVol}`;
            }
            details.push(infoCompagnie);
          }
          
          if (classe) {
            details.push(`Classe: ${classe}`);
          }
          
          if (typeVol) {
            details.push(`Type: ${typeVol}`);
          }
          
          if (dateDepart) {
            try {
              const dateFormatee = new Date(dateDepart).toLocaleDateString('fr-FR');
              let infoDate = `Depart: ${dateFormatee}`;
              
              if (dateRetour && dateRetour !== dateDepart) {
                const dateRetourFormatee = new Date(dateRetour).toLocaleDateString('fr-FR');
                infoDate += ` Retour: ${dateRetourFormatee}`;
              }
              details.push(infoDate);
            } catch (e) {
              console.log(`⚠️ Erreur formatage date pour billet ${billet._id}: ${dateDepart}`);
            }
          }
          
          if (numeroBillet) {
            details.push(`N° Billet: ${numeroBillet}`);
          }
          
          // Joindre tous les détails en une ligne
          if (details.length > 0) {
            designation += ` - ${details.join(' | ')}`;
          }

          // Utiliser uniquement le net fournisseur (chercher dans informations aussi)
          const prix = billet.netfournisseur || 
                      (billet.informations && billet.informations.netfournisseur) || 
                      0;
          
          console.log(`📄 Article créé pour billet ${billet._id}: ${prix} DA (Net fournisseur direct: ${billet.netfournisseur || 'N/A'}, dans informations: ${billet.informations?.netfournisseur || 'N/A'})`);

          return {
            designation,
            quantite: 1,
            prixUnitaire: prix,
            montant: prix
          };
        });

        articlesFinaux = [...articlesFinaux, ...articlesBillets];
        console.log(`✅ ${articlesBillets.length} article(s) billet ajouté(s) à la facture`);
        
      } catch (error) {
        console.error('❌ Erreur lors du traitement des billets:', error);
        return res.status(400).json({
          success: false,
          message: `Erreur lors du traitement des billets: ${error.message}`
        });
      }
    }

    // Validation des montants
    if (!montantHT || montantHT <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant HT doit être supérieur à 0'
      });
    }

    if (!montantTTC || montantTTC <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant TTC doit être supérieur à 0'
      });
    }

    console.log(`💰 Montants validés: HT=${montantHT}, TTC=${montantTTC}`);

    const facture = new FactureFournisseur({
      numero,
      fournisseurId,
      agenceId,
      dateEmission: dateEmission || new Date(),
      dateEcheance: dateEcheance || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      montantHT,
      montantTTC,
      montantTVA: montantTVA || 0,
      tva: tva || 0,
      articles: articlesFinaux,
      notes,
      conditionsPaiement,
      billetsAssocies
    });

    console.log('💾 Sauvegarde de la facture...');
    await facture.save();
    console.log('✅ Facture sauvegardée avec succès');

    // Mettre à jour les billets associés avec l'ID de la facture fournisseur
    if (billetsAssocies && billetsAssocies.length > 0) {
      try {
        await BilletAvion.updateMany(
          { _id: { $in: billetsAssocies }, agenceId },
          { factureFournisseurId: facture._id }
        );
        console.log(`✅ ${billetsAssocies.length} billet(s) lié(s) à la facture fournisseur ${numero}`);
      } catch (error) {
        console.error('❌ Erreur lors de la liaison des billets à la facture fournisseur:', error);
        // Ne pas faire échouer la création de la facture
      }
    }

    // Populate les relations
    await facture.populate('fournisseurId', 'nom entreprise');
    await facture.populate('billetsAssocies', 'numero_billet passager compagnie');

    console.log('🎉 Facture fournisseur créée avec succès:', numero);

    res.status(201).json({
      success: true,
      data: facture,
      message: 'Facture fournisseur créée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur création facture fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la facture fournisseur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mettre à jour une facture fournisseur
const updateFacture = async (req, res) => {
  try {
    const facture = await FactureFournisseur.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('fournisseurId', 'nom entreprise')
     .populate('billetsAssocies', 'numero_billet passager');

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture fournisseur non trouvée'
      });
    }

    res.json({
      success: true,
      data: facture,
      message: 'Facture fournisseur mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour facture fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la facture fournisseur'
    });
  }
};

// Supprimer une facture fournisseur
const deleteFacture = async (req, res) => {
  try {
    const facture = await FactureFournisseur.findById(req.params.id);
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture fournisseur non trouvée'
      });
    }

    // Supprimer la référence de la facture dans les billets
    if (facture.billetsAssocies && facture.billetsAssocies.length > 0) {
      await BilletAvion.updateMany(
        { _id: { $in: facture.billetsAssocies } },
        { $unset: { factureFournisseurId: 1 } }
      );
    }

    await FactureFournisseur.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Facture fournisseur supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression facture fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la facture fournisseur'
    });
  }
};

// Marquer comme payée
const markAsPaid = async (req, res) => {
  try {
    const facture = await FactureFournisseur.findByIdAndUpdate(
      req.params.id,
      {
        statut: 'payée',
        datePaiement: new Date()
      },
      { new: true }
    ).populate('fournisseurId', 'nom entreprise');
    
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture fournisseur non trouvée'
      });
    }

    res.json({
      success: true,
      data: facture,
      message: 'Facture marquée comme payée'
    });
  } catch (error) {
    console.error('Erreur marquage facture payée:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la facture'
    });
  }
};

// Marquer comme en retard
const markAsOverdue = async (req, res) => {
  try {
    const facture = await FactureFournisseur.findByIdAndUpdate(
      req.params.id,
      { statut: 'en_retard' },
      { new: true }
    ).populate('fournisseurId', 'nom entreprise');

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture fournisseur non trouvée'
      });
    }

    res.json({
      success: true,
      data: facture,
      message: 'Facture marquée comme en retard'
    });
  } catch (error) {
    console.error('Erreur marquage facture en retard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la facture'
    });
  }
};

// Générer le PDF de la facture fournisseur
const generatePDF = async (req, res) => {
  try {
    const facture = await FactureFournisseur.findById(req.params.id)
      .populate('fournisseurId', 'nom entreprise email telephone adresse')
      .populate('billetsAssocies', 'numero_billet passager compagnie prix_ttc');

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture fournisseur non trouvée'
      });
    }

    console.log('📄 Génération PDF demandée pour la facture fournisseur:', facture.numero);
    
    // Récupérer les informations de l'agence
    const { agenceId } = req.user;
    const Agence = require('../models/agenceModel');
    const agence = await Agence.findById(agenceId);
    
    // Importer le service PDF
    const pdfService = require('../services/pdfService');
    
    // Générer le PDF réel
    const pdfBuffer = await pdfService.generateFactureFournisseurPDF(facture, agence);
    
    // Définir les headers pour le téléchargement du PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-fournisseur-${facture.numero}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Envoyer le buffer PDF
    res.send(pdfBuffer);
    
    console.log('✅ PDF facture fournisseur envoyé avec succès');

  } catch (error) {
    console.error('❌ Erreur génération PDF facture fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllFactures,
  getFactureById,
  createFacture,
  updateFacture,
  deleteFacture,
  markAsPaid,
  markAsOverdue,
  generatePDF
}; 