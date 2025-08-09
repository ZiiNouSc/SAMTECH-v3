const mongoose = require('mongoose');

const historiqueSchema = mongoose.Schema(
  {
    // Client concerné
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    
    // Agence
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
      required: true,
    },
    
    // Type d'événement
    type: {
      type: String,
      enum: [
        'creation_facture',
        'modification_facture',
        'suppression_facture',
        'envoi_facture',
        'paiement_facture',
        'annulation_facture',
        'creation_prefacture',
        'modification_prefacture',
        'suppression_prefacture',
        'envoi_prefacture',
        'acceptation_prefacture',
        'refus_prefacture',
        'conversion_prefacture',
        'operation_caisse',
        'annulation_operation',
        'creation_client',
        'modification_client'
      ],
      required: true,
    },
    
    // Description de l'événement
    description: {
      type: String,
      required: true,
    },
    
    // Données de la facture (pour les événements liés aux factures)
    factureData: {
      numero: String,
      montantTTC: Number,
      montantPaye: Number,
      statut: String,
      dateEmission: Date,
      dateEcheance: Date,
      articles: [{
        description: String,
        quantite: Number,
        prixUnitaire: Number,
        montant: Number
      }]
    },
    
    // Données du devis (pour les événements liés aux devis)
    devisData: {
      numero: String,
      montantTTC: Number,
      statut: String,
      dateCreation: Date,
      articles: [{
        description: String,
        quantite: Number,
        prixUnitaire: Number,
        montant: Number
      }]
    },
    
    // Données de l'opération de caisse
    operationData: {
      type: String, // 'entree' ou 'sortie'
      montant: Number,
      description: String,
      categorie: String,
      reference: String,
      moyenPaiement: String
    },
    
    // Utilisateur qui a effectué l'action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Nom de l'utilisateur (pour éviter les lookups)
    userName: {
      type: String,
      required: true,
    },
    
    // Date de l'événement
    dateEvenement: {
      type: Date,
      default: Date.now,
    },
    
    // Métadonnées supplémentaires
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    }
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
historiqueSchema.index({ clientId: 1, dateEvenement: -1 });
historiqueSchema.index({ agenceId: 1, type: 1 });
historiqueSchema.index({ userId: 1, dateEvenement: -1 });

// Méthode statique pour créer un événement d'historique
historiqueSchema.statics.creerEvenement = async function(data) {
  try {
    const evenement = await this.create(data);
    console.log(`📝 Événement historique créé: ${data.type} - ${data.description}`);
    return evenement;
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement historique:', error);
    throw error;
  }
};

// Méthode statique pour récupérer l'historique d'un client
historiqueSchema.statics.getHistoriqueClient = async function(clientId, agenceId, options = {}) {
  const { limit = 100, types = null } = options;
  
  const filter = { clientId, agenceId };
  if (types && Array.isArray(types)) {
    filter.type = { $in: types };
  }
  
  return await this.find(filter)
    .sort({ dateEvenement: -1 })
    .limit(limit)
    .populate('userId', 'nom prenom');
};

module.exports = mongoose.model('Historique', historiqueSchema); 