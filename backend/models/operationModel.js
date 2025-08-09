const mongoose = require('mongoose');

const operationSchema = mongoose.Schema(
  {
    // Type d'opération (Entrée ou Sortie)
    type: {
      type: String,
      enum: ['entree', 'sortie'],
      required: true,
    },
    
    // Catégorie de l'opération
    categorie: {
      type: String,
      enum: [
        'encaissement_facture_client',
        'remboursement_fournisseur',
        'remboursement_fournisseur_solde',
        'remboursement_fournisseur_exceptionnel',
        'vente_directe_prestation',
        'versement_initial_capital',
        'autre_entree',
        'paiement_fournisseur',
        'avance_fournisseur',
        'remboursement_client',
        'achat_direct_achat_sans_facture',
        'salaire_commission',
        'retrait_de_fonds',
        'autre_sortie',
        'libre'
      ],
      required: true,
    },
    
    // Mode de paiement
    modePaiement: {
      type: String,
      enum: ['especes', 'virement', 'cheque', 'carte', 'autre'],
      required: true,
      default: 'especes'
    },
    
    // Description explicite de l'opération
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    
    // Référence (numéro de facture ou texte libre)
    reference: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    },
    
    // Montant (positif pour entrée, négatif pour sortie)
    montant: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Date de l'opération
    date: {
      type: Date,
      default: Date.now,
      required: true
    },
    
    // Liens avec les autres modules
    factureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facture',
      required: false,
    },
    
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: false,
    },
    
    fournisseurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fournisseur',
      required: false,
    },
    
    // Utilisateur qui a créé l'opération
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Agence (filtré automatiquement)
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
      required: true,
    },
    
    // Métadonnées pour la traçabilité
    metadata: {
      // Si l'opération est liée à une annulation de facture
      annulationFactureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Facture',
        required: false,
      },
      
      // Type d'annulation (avoir ou remboursement)
      typeAnnulation: {
        type: String,
        enum: ['avoir', 'remboursement'],
        required: false,
      },
      
      // Montant original de la facture annulée
      montantOriginal: {
        type: Number,
        required: false,
      },
      
      // Commentaire additionnel
      commentaire: {
        type: String,
        maxlength: 1000,
        required: false,
      }
    },
    
    // Statut de l'opération
    statut: {
      type: String,
      enum: ['validee', 'annulee', 'en_attente'],
      default: 'validee'
    }
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
operationSchema.index({ agenceId: 1, date: -1 });
operationSchema.index({ type: 1, date: -1 });
operationSchema.index({ categorie: 1, date: -1 });
operationSchema.index({ modePaiement: 1, date: -1 });
operationSchema.index({ factureId: 1 });
operationSchema.index({ clientId: 1 });
operationSchema.index({ fournisseurId: 1 });
operationSchema.index({ userId: 1 });
operationSchema.index({ 'metadata.annulationFactureId': 1 });

// Méthode virtuelle pour obtenir le montant absolu
operationSchema.virtual('montantAbsolu').get(function() {
  return Math.abs(this.montant);
});

// Méthode virtuelle pour obtenir le montant formaté
operationSchema.virtual('montantFormate').get(function() {
  const signe = this.type === 'entree' ? '+' : '-';
  return `${signe}${Math.abs(this.montant).toLocaleString('fr-FR', { 
    style: 'currency', 
    currency: 'EUR' 
  })}`;
});

// Méthode statique pour calculer le solde d'une agence
operationSchema.statics.calculerSolde = async function(agenceId, dateFin = new Date()) {
  const query = { 
    agenceId, 
    date: { $lte: dateFin },
    statut: 'validee'
  };
  
  const operations = await this.find(query);
  
  const entrees = operations
    .filter(op => op.type === 'entree')
    .reduce((sum, op) => sum + op.montant, 0);
    
  const sorties = operations
    .filter(op => op.type === 'sortie')
    .reduce((sum, op) => sum + op.montant, 0);
    
  return entrees - sorties;
};

// Méthode statique pour obtenir les statistiques
operationSchema.statics.getStatistiques = async function(agenceId, dateDebut, dateFin) {
  const query = { 
    agenceId, 
    date: { $gte: dateDebut, $lte: dateFin },
    statut: 'validee'
  };
  
  const operations = await this.find(query);
  
  const entrees = operations
    .filter(op => op.type === 'entree')
    .reduce((sum, op) => sum + op.montant, 0);
    
  const sorties = operations
    .filter(op => op.type === 'sortie')
    .reduce((sum, op) => sum + op.montant, 0);
    
  const repartitionCategorie = operations.reduce((acc, op) => {
    acc[op.categorie] = (acc[op.categorie] || 0) + op.montant;
    return acc;
  }, {});
  
  const repartitionModePaiement = operations.reduce((acc, op) => {
    acc[op.modePaiement] = (acc[op.modePaiement] || 0) + op.montant;
    return acc;
  }, {});
  
  return {
    entrees,
    sorties,
    solde: entrees - sorties,
    nombreOperations: operations.length,
    repartitionCategorie,
    repartitionModePaiement
  };
};

// Transformation pour ajouter le champ id
operationSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Transformation pour les requêtes find
operationSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Operation = mongoose.model('Operation', operationSchema);

module.exports = Operation;