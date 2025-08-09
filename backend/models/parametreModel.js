const mongoose = require('mongoose');

const parametreSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  valeur: {
    type: String,
    required: true,
    trim: true
  },
  categorie: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['texte', 'nombre', 'booleen', 'date', 'email', 'url'],
    default: 'texte'
  },
  obligatoire: {
    type: Boolean,
    default: false
  },
  ordre: {
    type: Number,
    default: 0
  },
  agenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agence',
    required: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date
  },
  modifiePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  historique: [{
    valeur: String,
    dateModification: Date,
    modifiePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Utilisateur'
    }
  }]
}, {
  timestamps: true
});

// Index pour améliorer les performances
parametreSchema.index({ agenceId: 1, categorie: 1 });
parametreSchema.index({ agenceId: 1, nom: 1 }, { unique: true });
parametreSchema.index({ agenceId: 1, ordre: 1 });

// Méthodes statiques
parametreSchema.statics.findByAgence = function(agenceId, options = {}) {
  const query = { agenceId };
  
  if (options.categorie) query.categorie = options.categorie;
  if (options.type) query.type = options.type;
  if (options.obligatoire !== undefined) query.obligatoire = options.obligatoire;
  
  return this.find(query)
    .sort({ categorie: 1, ordre: 1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

parametreSchema.statics.findByCategory = function(agenceId, categorie) {
  return this.find({ agenceId, categorie })
    .sort({ ordre: 1 });
};

parametreSchema.statics.getCategories = function(agenceId) {
  return this.distinct('categorie', { agenceId });
};

parametreSchema.statics.getParametre = function(agenceId, nom, categorie) {
  return this.findOne({ agenceId, nom, categorie });
};

parametreSchema.statics.setParametre = function(agenceId, nom, valeur, categorie, options = {}) {
  return this.findOneAndUpdate(
    { agenceId, nom, categorie },
    { 
      valeur,
      dateModification: new Date(),
      ...options
    },
    { 
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

// Méthodes d'instance
parametreSchema.methods.updateValue = function(nouvelleValeur, utilisateurId) {
  // Sauvegarder dans l'historique
  this.historique.push({
    valeur: this.valeur,
    dateModification: this.dateModification || this.dateCreation,
    modifiePar: this.modifiePar
  });
  
  // Limiter l'historique à 10 entrées
  if (this.historique.length > 10) {
    this.historique = this.historique.slice(-10);
  }
  
  this.valeur = nouvelleValeur;
  this.dateModification = new Date();
  this.modifiePar = utilisateurId;
  
  return this.save();
};

// Validation personnalisée
parametreSchema.pre('save', function(next) {
  // Vérifier que le nom est unique par agence et catégorie
  if (this.isNew || this.isModified('nom') || this.isModified('categorie')) {
    this.constructor.findOne({
      agenceId: this.agenceId,
      nom: this.nom,
      categorie: this.categorie,
      _id: { $ne: this._id }
    }).then(existing => {
      if (existing) {
        next(new Error(`Un paramètre avec le nom "${this.nom}" existe déjà dans la catégorie "${this.categorie}"`));
      } else {
        next();
      }
    }).catch(next);
  } else {
    next();
  }
});

// Méthodes virtuelles
parametreSchema.virtual('valeurTyped').get(function() {
  switch (this.type) {
    case 'nombre':
      return parseFloat(this.valeur) || 0;
    case 'booleen':
      return this.valeur === 'true' || this.valeur === '1';
    case 'date':
      return new Date(this.valeur);
    default:
      return this.valeur;
  }
});

// Configuration pour inclure les virtuels dans la sérialisation JSON
parametreSchema.set('toJSON', { virtuals: true });
parametreSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Parametre', parametreSchema); 