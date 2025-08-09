const Operation = require('../models/operationModel');
const Facture = require('../models/factureModel');
const Client = require('../models/clientModel');
const Fournisseur = require('../models/fournisseurModel');
const AuditLog = require('../models/auditModel');

/**
 * Service pour automatiser les opérations de caisse
 */
class CaisseService {
  
  /**
   * Enregistrer une entrée en caisse (paiement facture, versement, etc.)
   */
  static async enregistrerEntree(data) {
    const {
      montant,
      description,
      categorie = 'encaissement_facture_client',
      reference,
      agenceId,
      userId,
      moyenPaiement,
      type_operation = 'paiement_facture',
      factureId = null,
      clientId = null,
      fournisseurId = null,
      notes = '',
      remboursementType = null
    } = data;

    if (!montant || montant <= 0) {
      throw new Error('Montant invalide');
    }

    if (!agenceId) {
      throw new Error('ID d\'agence requis');
    }

    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    // Gestion intelligente du remboursement fournisseur (flexible selon remboursementType)
    if (categorie === 'remboursement_fournisseur' && fournisseurId) {
      const remboursementType = data.remboursementType;
      const fournisseur = await Fournisseur.findById(fournisseurId);
      if (!fournisseur) {
        throw new Error('Fournisseur non trouvé');
      }
      const solde = fournisseur.soldeCrediteur || 0;
      const dette = fournisseur.detteFournisseur || 0;
      if (remboursementType === 'solde') {
        console.log('[DEBUG] Fournisseur avant update:', fournisseurId, solde);
        const nouveauSolde = Math.max(0, solde - montant);
        const fournisseurMaj = await Fournisseur.findByIdAndUpdate(
          fournisseurId,
          { $set: { soldeCrediteur: nouveauSolde } },
          { new: true }
        );
        if (!fournisseurMaj) {
          console.error('[ERREUR] Impossible de mettre à jour le solde du fournisseur');
        } else {
          console.log(`[DEBUG] Fournisseur après update : soldeCrediteur=${fournisseurMaj.soldeCrediteur}, detteFournisseur=${fournisseurMaj.detteFournisseur}`);
        }
        return await Operation.create({
          type: 'entree',
          montant,
          description: description + ' (remboursement solde)',
          categorie: 'remboursement_fournisseur_solde',
          reference,
          agenceId,
          userId,
          modePaiement: moyenPaiement,
          factureId,
          clientId,
          fournisseurId,
          notes,
          date: new Date()
        });
      } else if (remboursementType === 'dette') {
        // Diminuer la dette (même si 0)
        const nouvelleDette = Math.max(0, dette - montant);
        const fournisseurMaj = await Fournisseur.findByIdAndUpdate(
          fournisseurId,
          { $set: { detteFournisseur: nouvelleDette } },
          { new: true }
        );
        if (!fournisseurMaj) {
          console.error('[ERREUR] Impossible de mettre à jour la dette du fournisseur');
        } else {
          console.log(`[DEBUG] Fournisseur après update : soldeCrediteur=${fournisseurMaj.soldeCrediteur}, detteFournisseur=${fournisseurMaj.detteFournisseur}`);
        }
        // Ne pas créer d'opération dans la caisse, juste un log
        return { success: true, message: 'Remise sur dette enregistrée', fournisseur: fournisseurMaj };
      } else if (remboursementType === 'exceptionnel') {
        // Cas exceptionnel
        console.log(`🟡 Remboursement fournisseur exceptionnel : ${fournisseur.entreprise} +${montant}`);
        // Entrée réelle en caisse
        return await Operation.create({
          type: 'entree',
          montant,
          description: description + ' (exceptionnel)',
          categorie: 'remboursement_fournisseur_exceptionnel',
          reference,
          agenceId,
          userId,
          modePaiement: moyenPaiement,
          factureId,
          clientId,
          fournisseurId,
          notes,
          date: new Date()
        });
      }
    }

    const operation = await Operation.create({
      type: 'entree',
      montant,
      description,
      categorie,
      reference,
      agenceId,
      userId,
      modePaiement: moyenPaiement,
      factureId,
      clientId,
      fournisseurId,
      date: new Date()
    });

    console.log(`✅ Entrée en caisse enregistrée: ${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} - ${description}`);
    
    return operation;
  }

  /**
   * Enregistrer une sortie en caisse (remboursement, avoir, etc.)
   */
  static async enregistrerSortie(data) {
    let {
      montant,
      description,
      categorie = 'remboursement',
      reference,
      agenceId,
      userId,
      moyenPaiement,
      type_operation = 'remboursement',
      factureId = null,
      clientId = null,
      fournisseurId = null,
      notes = ''
    } = data;

    // Correction ici : forcer le montant à être positif
    montant = Math.abs(Number(montant));

    if (!montant || montant <= 0) {
      throw new Error('Montant invalide');
    }

    if (!agenceId) {
      throw new Error('ID d\'agence requis');
    }

    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    // Gestion du solde créditeur fournisseur
    if (categorie === 'avance_fournisseur' && fournisseurId) {
      const fournisseur = await Fournisseur.findById(fournisseurId);
      if (!fournisseur) {
        throw new Error('Fournisseur non trouvé');
      }
      // Augmenter le solde créditeur du fournisseur
      fournisseur.soldeCrediteur = (fournisseur.soldeCrediteur || 0) + montant;
      await fournisseur.save();
      const fournisseurApres = await Fournisseur.findById(fournisseurId);
      console.log(`💰 Avance fournisseur enregistrée: ${fournisseur.entreprise} +${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} (Nouveau solde: ${fournisseurApres.soldeCrediteur.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})`);
    }

    // Gestion des ajustements de solde fournisseur
    if (categorie === 'ajustement_solde_fournisseur' && fournisseurId) {
      const fournisseur = await Fournisseur.findById(fournisseurId);
      if (!fournisseur) {
        throw new Error('Fournisseur non trouvé');
      }
      
      // Pour un ajustement, on modifie directement le solde créditeur
      // Le montant peut être positif (augmentation) ou négatif (diminution)
      fournisseur.soldeCrediteur = Math.max(0, (fournisseur.soldeCrediteur || 0) + montant);
      await fournisseur.save();
      const fournisseurApres = await Fournisseur.findById(fournisseurId);
      const operationType = montant > 0 ? 'augmentation' : 'diminution';
      console.log(`🔧 Ajustement solde fournisseur: ${fournisseur.entreprise} ${operationType} de ${Math.abs(montant).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} = ${fournisseurApres.soldeCrediteur.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
    }

    // Gestion des paiements fournisseur
    if (categorie === 'paiement_fournisseur' && fournisseurId) {
      const fournisseur = await Fournisseur.findById(fournisseurId);
      if (!fournisseur) {
        throw new Error('Fournisseur non trouvé');
      }
      
      // Ne pas modifier directement le solde, laisser le calcul automatique
      // L'opération sera prise en compte dans calculerSoldes()
      console.log(`💸 Paiement fournisseur enregistré: ${fournisseur.entreprise} -${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
    }

    const operation = await Operation.create({
      type: 'sortie',
      montant,
      description,
      categorie,
      reference,
      agenceId,
      userId,
      modePaiement: moyenPaiement,
      factureId,
      clientId,
      fournisseurId,
      date: new Date()
    });

    console.log(`💸 Sortie en caisse enregistrée: ${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} - ${description}`);
    
    return operation;
  }

  /**
   * Paiement complet d'une facture
   */
  static async paiementFactureComplete(factureId, moyenPaiement, agenceId, userId) {
    const facture = await Facture.findById(factureId);
    if (!facture) throw new Error('Facture non trouvée');
    let client = null;
    let fournisseur = null;
    if (facture.clientId) client = await Client.findById(facture.clientId);
    if (facture.fournisseurId) fournisseur = await Fournisseur.findById(facture.fournisseurId);
    const montant = facture.montantTTC - (facture.montantPaye || 0);
    if (montant <= 0) throw new Error('Facture déjà payée');
    let operation;
    if (client) {
      // Facture client → entrée
      operation = await Operation.create({
        type: 'entree',
        categorie: 'encaissement_facture_client',
        montant,
        description: `Encaissement facture ${facture.numero} - ${client.entreprise || client.prenom + ' ' + client.nom}`,
        reference: facture.numero,
        factureId: facture._id,
        clientId: client._id,
        agenceId,
        userId,
        moyenPaiement,
        date: new Date()
      });
    } else if (fournisseur) {
      // Facture fournisseur → sortie
      operation = await Operation.create({
        type: 'sortie',
        categorie: 'paiement_fournisseur',
        montant,
        description: `Paiement facture ${facture.numero} - ${fournisseur.entreprise}`,
        reference: facture.numero,
        factureId: facture._id,
        fournisseurId: fournisseur._id,
        agenceId,
        userId,
        moyenPaiement,
        date: new Date()
      });
    } else {
      throw new Error('Aucun client ou fournisseur lié à la facture');
    }
    // Mettre à jour la facture
    facture.montantPaye = (facture.montantPaye || 0) + montant;
    facture.statut = 'payee';
    await facture.save();
    return { facture, operation, montantPaye: montant };
  }

  /**
   * Versement partiel sur une facture
   */
  static async versementFacture(factureId, montant, moyenPaiement, agenceId, userId) {
    const facture = await Facture.findById(factureId).populate('clientId fournisseurId');
    if (!facture) {
      throw new Error('Facture non trouvée');
    }
    const montantRestant = facture.montantTTC - (facture.montantPaye || 0);
    if (montant > montantRestant) {
      throw new Error('Le montant du versement dépasse le montant restant à payer');
    }
    // Mettre à jour la facture
    facture.montantPaye = (facture.montantPaye || 0) + montant;
    facture.versements = facture.versements || [];
    facture.versements.push({ 
      montant, 
      date: new Date(), 
      moyenPaiement 
    });
    // Mettre à jour le statut
    if (facture.montantPaye >= facture.montantTTC) {
      facture.statut = 'payee';
    } else if (facture.montantPaye > 0) {
      facture.statut = 'partiellement_payee';
    }
    await facture.save();
    const client = facture.clientId;
    const fournisseur = facture.fournisseurId;
    let operation;
    if (client) {
      // Facture client → entrée
      operation = await this.enregistrerEntree({
        montant,
        description: `Versement facture ${facture.numero} - ${client.entreprise || `${client.prenom} ${client.nom}`}`,
        categorie: 'encaissement_facture_client',
        reference: facture.numero,
        agenceId,
        userId,
        moyenPaiement,
        type_operation: 'paiement_facture',
        factureId: facture._id,
        clientId: client._id,
        notes: `Versement partiel de ${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} sur la facture ${facture.numero}`
      });
    } else if (fournisseur) {
      // Facture fournisseur → sortie
      operation = await this.enregistrerSortie({
        montant,
        description: `Versement facture ${facture.numero} - ${fournisseur.entreprise}`,
        categorie: 'paiement_fournisseur',
        reference: facture.numero,
        agenceId,
        userId,
        moyenPaiement,
        type_operation: 'paiement_facture',
        factureId: facture._id,
        fournisseurId: fournisseur._id,
        notes: `Versement partiel de ${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} sur la facture ${facture.numero}`
      });
    } else {
      throw new Error('Aucun client ou fournisseur lié à la facture');
    }
    return {
      facture,
      operation,
      montantPaye: montant,
      montantRestant: facture.montantTTC - facture.montantPaye
    };
  }

  /**
   * Créer un avoir sur une facture
   */
  static async creerAvoir(factureId, montant, moyenPaiement, agenceId, userId) {
    const facture = await Facture.findById(factureId).populate('clientId fournisseurId');
    
    if (!facture) {
      throw new Error('Facture non trouvée');
    }

    const montantDisponible = facture.montantTTC - (facture.avoirsTotal || 0);
    
    if (montant > montantDisponible) {
      throw new Error('Le montant de l\'avoir dépasse le montant disponible');
    }

    // Mettre à jour la facture
    facture.montantTTC -= montant;
    facture.avoirsTotal = (facture.avoirsTotal || 0) + montant;
    facture.versements = facture.versements || [];
    facture.versements.push({ 
      montant: -montant, 
      date: new Date(), 
      moyenPaiement,
      type: 'avoir'
    });

    // Si l'avoir solde la facture
    if (facture.montantTTC <= (facture.montantPaye || 0)) {
      facture.statut = 'payee';
    }

    await facture.save();

    // Enregistrer la sortie en caisse
    const client = facture.clientId;
    const fournisseur = facture.fournisseurId;
    
    const operation = await this.enregistrerSortie({
      montant,
      description: `Avoir facture ${facture.numero} - ${client?.entreprise || `${client?.prenom} ${client?.nom}`}`,
      categorie: 'encaissement_facture_client',
      reference: facture.numero,
      agenceId,
      userId,
      moyenPaiement,
      type_operation: 'avoir',
      factureId: facture._id,
      clientId: client?._id,
      fournisseurId: fournisseur?._id,
      notes: `Avoir de ${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} sur la facture ${facture.numero}`
    });

    return {
      facture,
      operation,
      montantAvoir: montant
    };
  }

  /**
   * Remboursement d'une facture
   */
  static async rembourserFacture(factureId, montant, moyenPaiement, agenceId, userId) {
    const facture = await Facture.findById(factureId).populate('clientId fournisseurId');
    if (!facture) {
      throw new Error('Facture non trouvée');
    }
    const montantPaye = facture.montantPaye || 0;
    if (montant > montantPaye) {
      throw new Error('Le montant de remboursement ne peut pas dépasser le montant payé');
    }
    // Mettre à jour la facture
    facture.montantPaye = montantPaye - montant;
    facture.versements = facture.versements || [];
    facture.versements.push({ 
      montant: -montant, 
      date: new Date(), 
      moyenPaiement,
      type: 'remboursement'
    });
    // Mettre à jour le statut
    if (facture.montantPaye <= 0) {
      facture.statut = 'envoyee';
    } else if (facture.montantPaye < facture.montantTTC) {
      facture.statut = 'partiellement_payee';
    }
    await facture.save();
    const client = facture.clientId;
    const fournisseur = facture.fournisseurId;
    let operation;
    if (client) {
      // Remboursement client → sortie
      operation = await this.enregistrerSortie({
        montant,
        description: `Remboursement facture ${facture.numero} - ${client.entreprise || `${client.prenom} ${client.nom}`}`,
        categorie: 'remboursement_client',
        reference: facture.numero,
        agenceId,
        userId,
        moyenPaiement,
        type_operation: 'remboursement',
        factureId: facture._id,
        clientId: client._id,
        notes: `Remboursement de ${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} sur la facture ${facture.numero}`
      });
    } else if (fournisseur) {
      // Remboursement fournisseur → entrée
      operation = await this.enregistrerEntree({
        montant,
        description: `Remboursement facture ${facture.numero} - ${fournisseur.entreprise}`,
        categorie: 'remboursement_fournisseur',
        reference: facture.numero,
        agenceId,
        userId,
        moyenPaiement,
        type_operation: 'remboursement',
        factureId: facture._id,
        fournisseurId: fournisseur._id,
        notes: `Remboursement de ${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} sur la facture ${facture.numero}`
      });
    } else {
      throw new Error('Aucun client ou fournisseur lié à la facture');
    }
    return {
      facture,
      operation,
      montantRembourse: montant
    };
  }

  /**
   * Calculer le solde de caisse d'une agence
   */
  static async calculerSoldeCaisse(agenceId, dateDebut = null, dateFin = null) {
    const filter = { agenceId };
    
    if (dateDebut || dateFin) {
      filter.date = {};
      if (dateDebut) filter.date.$gte = new Date(dateDebut);
      if (dateFin) filter.date.$lte = new Date(dateFin);
    }

    const operations = await Operation.find(filter);
    
    let solde = 0;
    const entrees = [];
    const sorties = [];

    operations.forEach(op => {
      if (op.type === 'entree') {
        solde += op.montant;
        entrees.push(op);
      } else if (op.type === 'sortie') {
        solde -= op.montant;
        sorties.push(op);
      }
    });

    const totalEntrees = entrees.reduce((sum, op) => sum + op.montant, 0);
    const totalSorties = sorties.reduce((sum, op) => sum + op.montant, 0);

    console.log(`💰 Calcul solde caisse: Entrées=${totalEntrees}, Sorties=${totalSorties}, Solde=${solde}`);

    return {
      solde,
      totalEntrees,
      totalSorties,
      nombreOperations: operations.length,
      nombreEntrees: entrees.length,
      nombreSorties: sorties.length,
      operations: operations.sort((a, b) => b.date - a.date)
    };
  }

  /**
   * Obtenir le rapport de caisse détaillé
   */
  static async rapportCaisse(agenceId, dateDebut, dateFin) {
    const filter = { agenceId };
    
    if (dateDebut || dateFin) {
      filter.date = {};
      if (dateDebut) filter.date.$gte = new Date(dateDebut);
      if (dateFin) filter.date.$lte = new Date(dateFin);
    }

    const operations = await Operation.find(filter)
      .populate('clientId', 'nom prenom entreprise')
      .populate('fournisseurId', 'nom entreprise')
      .populate('factureId', 'numero')
      .sort({ date: -1 });

    // Grouper par catégorie
    const parCategorie = {};
    const parMoyenPaiement = {};
    const parType = { entree: 0, sortie: 0 };

    operations.forEach(op => {
      // Par catégorie
      if (!parCategorie[op.categorie]) {
        parCategorie[op.categorie] = { total: 0, operations: [] };
      }
      parCategorie[op.categorie].total += op.montant;
      parCategorie[op.categorie].operations.push(op);

      // Par moyen de paiement
      if (!parMoyenPaiement[op.moyenPaiement]) {
        parMoyenPaiement[op.moyenPaiement] = { total: 0, operations: [] };
      }
      parMoyenPaiement[op.moyenPaiement].total += op.montant;
      parMoyenPaiement[op.moyenPaiement].operations.push(op);

      // Par type
      parType[op.type] += op.montant;
    });

    return {
      periode: { dateDebut, dateFin },
      resume: {
        totalEntrees: parType.entree,
        totalSorties: parType.sortie,
        solde: parType.entree - parType.sortie,
        nombreOperations: operations.length
      },
      parCategorie,
      parMoyenPaiement,
      operations
    };
  }

  /**
   * Annuler une opération de caisse
   */
  static async annulerOperation(operationId, agenceId) {
    const operation = await Operation.findById(operationId);
    
    if (!operation) {
      throw new Error('Opération non trouvée');
    }

    if (operation.agenceId.toString() !== agenceId) {
      throw new Error('Accès non autorisé à cette opération');
    }

    // Créer une opération d'annulation
    const operationAnnulation = await Operation.create({
      type: operation.type === 'entree' ? 'sortie' : 'entree',
      montant: operation.montant,
      description: `ANNULATION: ${operation.description}`,
      categorie: operation.categorie,
      reference: operation.reference,
      agenceId,
      moyenPaiement: operation.moyenPaiement,
      type_operation: 'annulation',
      factureId: operation.factureId,
      clientId: operation.clientId,
      fournisseurId: operation.fournisseurId,
      notes: `Annulation de l'opération ${operation._id}`,
      date: new Date()
    });

    // Marquer l'opération originale comme annulée
    operation.statut = 'annulee';
    operation.operationAnnulation = operationAnnulation._id;
    await operation.save();

    console.log(`🔄 Opération annulée: ${operation.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} - ${operation.description}`);

    return {
      operationAnnulee: operation,
      operationAnnulation
    };
  }

  /**
   * Créer un log d'audit
   */
  static async createAuditLog(userId, userName, userRole, action, details, req, affectedResource = null, oldValue = null, newValue = null) {
    try {
      await AuditLog.createLog({
        userId,
        userName,
        userRole,
        action,
        module: 'caisse',
        details,
        ipAddress: req?.ip || req?.connection?.remoteAddress || 'system',
        userAgent: req?.get('User-Agent') || 'system',
        affectedResource,
        oldValue,
        newValue
      });
    } catch (error) {
      console.error('Erreur lors de la création du log d\'audit:', error);
    }
  }

  /**
   * Valider les données d'une opération
   */
  static validateOperationData(data) {
    const errors = [];

    if (!data.type || !['entree', 'sortie'].includes(data.type)) {
      errors.push('Type d\'opération invalide');
    }

    if (!data.categorie) {
      errors.push('Catégorie requise');
    }

    if (!data.modePaiement) {
      errors.push('Mode de paiement requis');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description requise');
    }

    if (!data.montant || data.montant <= 0) {
      errors.push('Montant invalide');
    }

    if (!data.agenceId) {
      errors.push('ID d\'agence requis');
    }

    if (!data.userId) {
      errors.push('ID utilisateur requis');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = CaisseService; 