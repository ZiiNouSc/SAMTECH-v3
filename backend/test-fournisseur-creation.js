const mongoose = require('mongoose');
const Fournisseur = require('./models/fournisseurModel');
const Operation = require('./models/operationModel');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/samtech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testFournisseurCreation() {
  try {
    console.log('🧪 Test de création de fournisseur avec solde initial...\n');
    
    // 1. Créer un fournisseur avec une dette initiale
    console.log('📝 Création d\'un fournisseur avec dette initiale...');
    const fournisseurAvecDette = await Fournisseur.create({
      nom: 'Test Dette',
      entreprise: 'Entreprise Test Dette',
      email: 'test.dette@example.com',
      telephone: '0123456789',
      adresse: '123 Rue Test',
      codePostal: '12345',
      ville: 'Ville Test',
      pays: 'Algérie',
      siret: '12345678901234',
      tva: 'DZ123456789',
      notes: 'Test dette initiale',
      agenceId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // ID d'agence de test
      detteFournisseur: 1000,
      soldeCrediteur: 0
    });
    
    console.log(`✅ Fournisseur créé: ${fournisseurAvecDette.entreprise}`);
    console.log(`   Dette: ${fournisseurAvecDette.detteFournisseur} DA`);
    console.log(`   Solde: ${fournisseurAvecDette.soldeCrediteur} DA`);
    
    // 2. Créer une opération correspondante
    await Operation.create({
      type: 'sortie',
      montant: 1000,
      description: 'Dette initiale - Entreprise Test Dette (Test dette initiale)',
      categorie: 'paiement_fournisseur',
      reference: 'INITIAL',
      agenceId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      fournisseurId: fournisseurAvecDette._id,
      userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      modePaiement: 'especes',
      date: new Date()
    });
    
    console.log('✅ Opération de dette initiale créée');
    
    // 3. Créer un fournisseur avec un solde créditeur initial
    console.log('\n📝 Création d\'un fournisseur avec solde créditeur initial...');
    const fournisseurAvecSolde = await Fournisseur.create({
      nom: 'Test Solde',
      entreprise: 'Entreprise Test Solde',
      email: 'test.solde@example.com',
      telephone: '0987654321',
      adresse: '456 Rue Test',
      codePostal: '54321',
      ville: 'Ville Test 2',
      pays: 'Algérie',
      siret: '98765432109876',
      tva: 'DZ987654321',
      notes: 'Test solde créditeur initial',
      agenceId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      detteFournisseur: 0,
      soldeCrediteur: 500
    });
    
    console.log(`✅ Fournisseur créé: ${fournisseurAvecSolde.entreprise}`);
    console.log(`   Dette: ${fournisseurAvecSolde.detteFournisseur} DA`);
    console.log(`   Solde: ${fournisseurAvecSolde.soldeCrediteur} DA`);
    
    // 4. Créer une opération correspondante
    await Operation.create({
      type: 'sortie',
      montant: 500,
      description: 'Solde initial - Entreprise Test Solde (Test solde créditeur initial)',
      categorie: 'avance_fournisseur',
      reference: 'INITIAL',
      agenceId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      fournisseurId: fournisseurAvecSolde._id,
      userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      modePaiement: 'especes',
      date: new Date()
    });
    
    console.log('✅ Opération de solde créditeur initial créée');
    
    // 5. Vérifier les opérations créées
    console.log('\n🔍 Vérification des opérations créées...');
    const operations = await Operation.find({
      fournisseurId: { $in: [fournisseurAvecDette._id, fournisseurAvecSolde._id] }
    }).populate('fournisseurId', 'entreprise');
    
    operations.forEach(op => {
      console.log(`   ${op.type.toUpperCase()}: ${op.montant} DA - ${op.categorie} - ${op.fournisseurId.entreprise}`);
    });
    
    // 6. Nettoyer les données de test
    console.log('\n🧹 Nettoyage des données de test...');
    await Fournisseur.deleteMany({
      email: { $in: ['test.dette@example.com', 'test.solde@example.com'] }
    });
    await Operation.deleteMany({
      fournisseurId: { $in: [fournisseurAvecDette._id, fournisseurAvecSolde._id] }
    });
    
    console.log('✅ Données de test supprimées');
    console.log('\n🎯 Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    mongoose.connection.close();
  }
}

testFournisseurCreation(); 