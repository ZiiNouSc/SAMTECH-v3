const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    nom: {
      type: String,
      required: true,
    },
    prenom: {
      type: String,
      default: '',
    },
    telephone: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['superadmin', 'agence', 'agent'],
      required: true,
    },
    statut: {
      type: String,
      enum: ['actif', 'suspendu', 'en_attente', 'rejete'],
      default: 'actif',
    },
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
    },
    // Liste des agences pour les agents multi-agences
    agences: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
    }],
    permissions: [
      {
        module: {
          type: String,
          required: true,
        },
        actions: [String],
      },
    ],
    dateInscription: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;