const mongoose = require('mongoose');
const Fournisseur = require('./models/fournisseurModel');
const Operation = require('./models/operationModel');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/samtech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testInitialisation() {
  try {
    console.log('🧪 Test de l\'initialisation des soldes fournisseur...\n');
    
    // Créer un fournisseur avec des soldes initiaux
    const fournisseur = new Fournisseur({
      nom: 'Test Initial',
      entreprise: 'Entreprise Test Initial',
      email: 'test.initial@example.com',
      telephone: '0123456789',
      agenceId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // ID d'agence de test
      detteFournisseur: 5000,
      soldeCrediteur: 2000
    });
    
    await fournisseur.save();
    console.log(`✅ Fournisseur créé: ${fournisseur.entreprise}`);
    console.log(`   - Dette initiale: ${fournisseur.detteFournisseur} DA`);
    console.log(`   - Solde créditeur initial: ${fournisseur.soldeCrediteur} DA`);
    
    // Créer les opérations de caisse correspondantes
    if (fournisseur.detteFournisseur > 0) {
      await Operation.create({
        type: 'sortie',
        montant: fournisseur.detteFournisseur,
        description: `Dette initiale - ${fournisseur.entreprise}`,
        categorie: 'paiement_fournisseur',
        reference: 'INITIAL',
        agenceId: fournisseur.agenceId,
        fournisseurId: fournisseur._id,
        userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'), // ID utilisateur de test
        modePaiement: 'especes',
        date: new Date()
      });
      console.log(`   - Opération dette créée: ${fournisseur.detteFournisseur} DA`);
    }
    
    if (fournisseur.soldeCrediteur > 0) {
      await Operation.create({
        type: 'sortie',
        montant: fournisseur.soldeCrediteur,
        description: `Solde initial - ${fournisseur.entreprise}`,
        categorie: 'avance_fournisseur',
        reference: 'INITIAL',
        agenceId: fournisseur.agenceId,
        fournisseurId: fournisseur._id,
        userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        modePaiement: 'especes',
        date: new Date()
      });
      console.log(`   - Opération solde créée: ${fournisseur.soldeCrediteur} DA`);
    }
    
    // Recalculer les soldes
    await fournisseur.calculerSoldes();
    console.log(`\n📊 Soldes après calcul:`);
    console.log(`   - Dette: ${fournisseur.detteFournisseur} DA`);
    console.log(`   - Solde créditeur: ${fournisseur.soldeCrediteur} DA`);
    
    // Nettoyer
    await Fournisseur.findByIdAndDelete(fournisseur._id);
    await Operation.deleteMany({ fournisseurId: fournisseur._id });
    console.log(`\n🧹 Test terminé et nettoyé`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
}

testInitialisation(); 