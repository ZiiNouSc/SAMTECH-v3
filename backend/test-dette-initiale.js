const mongoose = require('mongoose');
const Fournisseur = require('./models/fournisseurModel');
const Operation = require('./models/operationModel');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/samtech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testDetteInitiale() {
  try {
    console.log('🧪 Test de dette initiale...\n');
    
    // 1. Créer un fournisseur avec une dette initiale
    console.log('📝 Création d\'un fournisseur avec dette initiale...');
    const fournisseur = await Fournisseur.create({
      nom: 'Test Dette Initiale',
      entreprise: 'Entreprise Test Dette',
      email: 'test.dette.initiale@example.com',
      telephone: '0123456789',
      adresse: '123 Rue Test',
      codePostal: '12345',
      ville: 'Ville Test',
      pays: 'Algérie',
      siret: '12345678901234',
      tva: 'DZ123456789',
      notes: 'Test dette initiale',
      agenceId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      detteFournisseur: 0, // Sera recalculé
      soldeCrediteur: 0
    });
    
    console.log(`✅ Fournisseur créé: ${fournisseur.entreprise}`);
    
    // 2. Créer une opération de dette initiale
    await Operation.create({
      type: 'sortie',
      montant: 1500,
      description: 'Dette initiale - Entreprise Test Dette (Test dette initiale)',
      categorie: 'paiement_fournisseur',
      reference: 'INITIAL',
      agenceId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      fournisseurId: fournisseur._id,
      userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      modePaiement: 'especes',
      date: new Date()
    });
    
    console.log('✅ Opération de dette initiale créée (1500 DA)');
    
    // 3. Calculer les soldes
    console.log('\n🔄 Calcul des soldes...');
    const soldes = await fournisseur.calculerSoldes();
    
    console.log('📊 Résultats du calcul:');
    console.log(`   Dette totale: ${soldes.detteFournisseur} DA`);
    console.log(`   Dette factures: ${soldes.detteFactures} DA`);
    console.log(`   Dette initiale: ${soldes.detteInitiale} DA`);
    console.log(`   Solde créditeur: ${soldes.soldeCrediteur} DA`);
    
    // 4. Vérifier que les champs sont mis à jour
    console.log('\n🔍 Vérification des champs du fournisseur:');
    console.log(`   detteFournisseur: ${fournisseur.detteFournisseur} DA`);
    console.log(`   soldeCrediteur: ${fournisseur.soldeCrediteur} DA`);
    
    // 5. Sauvegarder et recharger pour vérifier
    await fournisseur.save();
    const fournisseurRecharge = await Fournisseur.findById(fournisseur._id);
    console.log('\n🔄 Après sauvegarde et rechargement:');
    console.log(`   detteFournisseur: ${fournisseurRecharge.detteFournisseur} DA`);
    console.log(`   soldeCrediteur: ${fournisseurRecharge.soldeCrediteur} DA`);
    
    // 6. Tester avec findWithSoldes
    console.log('\n🔍 Test avec findWithSoldes:');
    const fournisseursAvecSoldes = await Fournisseur.findWithSoldes({
      email: 'test.dette.initiale@example.com'
    });
    
    if (fournisseursAvecSoldes.length > 0) {
      const fournisseurAvecSoldes = fournisseursAvecSoldes[0];
      console.log(`   detteFournisseur: ${fournisseurAvecSoldes.detteFournisseur} DA`);
      console.log(`   soldeCrediteur: ${fournisseurAvecSoldes.soldeCrediteur} DA`);
    }
    
    // 7. Nettoyer
    console.log('\n🧹 Nettoyage...');
    await Fournisseur.deleteOne({ _id: fournisseur._id });
    await Operation.deleteMany({ fournisseurId: fournisseur._id });
    
    console.log('✅ Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDetteInitiale(); 