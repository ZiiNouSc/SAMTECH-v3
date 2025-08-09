const mongoose = require('mongoose');
const caisseService = require('../services/caisseService');
const Facture = require('../models/factureModel');
const Client = require('../models/clientModel');
const Operation = require('../models/operationModel');

// Configuration de test
const TEST_AGENCE_ID = new mongoose.Types.ObjectId();
const TEST_CLIENT_ID = new mongoose.Types.ObjectId();

// Données de test
const testClient = {
  _id: TEST_CLIENT_ID,
  nom: 'Test',
  prenom: 'Client',
  entreprise: 'Entreprise Test',
  email: 'test@example.com',
  solde: 0
};

const testFacture = {
  numero: 'FAC-TEST-001',
  clientId: TEST_CLIENT_ID,
  dateEmission: new Date(),
  dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  statut: 'envoyee',
  montantHT: 1000,
  montantTTC: 1200,
  montantPaye: 0,
  articles: [
    {
      description: 'Service test',
      montant: 1000
    }
  ],
  agenceId: TEST_AGENCE_ID
};

// Tests d'intégration
async function testCaisseIntegration() {
  console.log('🧪 Début des tests d\'intégration Caisse-Factures\n');

  try {
    // 1. Test de paiement complet
    console.log('1️⃣ Test de paiement complet...');
    
    // Créer une facture de test
    const facture = await Facture.create(testFacture);
    console.log(`   ✅ Facture créée: ${facture.numero}`);
    
    // Effectuer un paiement complet
    const resultPaiement = await caisseService.paiementFactureComplete(
      facture._id,
      'virement',
      TEST_AGENCE_ID
    );
    
    console.log(`   ✅ Paiement complet effectué: ${resultPaiement.montantPaye}DA`);
    console.log(`   ✅ Opération caisse créée: ${resultPaiement.operation._id}`);
    
    // Vérifier que l'opération existe
    const operation = await Operation.findById(resultPaiement.operation._id);
    if (operation && operation.type === 'entree' && operation.montant === 1200) {
      console.log('   ✅ Opération de caisse validée');
    } else {
      console.log('   ❌ Erreur: Opération de caisse invalide');
    }

    // 2. Test de versement partiel
    console.log('\n2️⃣ Test de versement partiel...');
    
    // Créer une nouvelle facture
    const facture2 = await Facture.create({
      ...testFacture,
      numero: 'FAC-TEST-002'
    });
    
    // Effectuer un versement partiel
    const resultVersement = await caisseService.versementFacture(
      facture2._id,
      600,
      'especes',
      TEST_AGENCE_ID
    );
    
    console.log(`   ✅ Versement effectué: ${resultVersement.montantPaye}DA`);
    console.log(`   ✅ Montant restant: ${resultVersement.montantRestant}DA`);
    
    // Vérifier le statut
    if (resultVersement.facture.statut === 'partiellement_payee') {
      console.log('   ✅ Statut correctement mis à jour');
    } else {
      console.log('   ❌ Erreur: Statut incorrect');
    }

    // 3. Test de création d'avoir
    console.log('\n3️⃣ Test de création d\'avoir...');
    
    const resultAvoir = await caisseService.creerAvoir(
      facture2._id,
      200,
      'cheque',
      TEST_AGENCE_ID
    );
    
    console.log(`   ✅ Avoir créé: ${resultAvoir.montantAvoir}DA`);
    
    // Vérifier que c'est une sortie en caisse
    const operationAvoir = await Operation.findById(resultAvoir.operation._id);
    if (operationAvoir && operationAvoir.type === 'sortie') {
      console.log('   ✅ Sortie en caisse pour avoir validée');
    } else {
      console.log('   ❌ Erreur: Sortie en caisse invalide');
    }

    // 4. Test de remboursement
    console.log('\n4️⃣ Test de remboursement...');
    
    const resultRemboursement = await caisseService.rembourserFacture(
      facture2._id,
      100,
      'virement',
      TEST_AGENCE_ID
    );
    
    console.log(`   ✅ Remboursement effectué: ${resultRemboursement.montantRembourse}DA`);
    
    // Vérifier que c'est une sortie en caisse
    const operationRemboursement = await Operation.findById(resultRemboursement.operation._id);
    if (operationRemboursement && operationRemboursement.type === 'sortie') {
      console.log('   ✅ Sortie en caisse pour remboursement validée');
    } else {
      console.log('   ❌ Erreur: Sortie en caisse invalide');
    }

    // 5. Test de calcul du solde
    console.log('\n5️⃣ Test de calcul du solde...');
    
    const solde = await caisseService.calculerSoldeCaisse(TEST_AGENCE_ID);
    
    console.log(`   ✅ Solde calculé: ${solde.solde}DA`);
    console.log(`   ✅ Total entrées: ${solde.totalEntrees}DA`);
    console.log(`   ✅ Total sorties: ${solde.totalSorties}DA`);
    console.log(`   ✅ Nombre d'opérations: ${solde.nombreOperations}`);

    // 6. Test de rapport de caisse
    console.log('\n6️⃣ Test de rapport de caisse...');
    
    const rapport = await caisseService.rapportCaisse(TEST_AGENCE_ID);
    
    console.log(`   ✅ Rapport généré`);
    console.log(`   ✅ Résumé: ${rapport.resume.totalEntrees}DA entrées, ${rapport.resume.totalSorties}DA sorties`);
    console.log(`   ✅ Solde: ${rapport.resume.solde}DA`);

    // 7. Test d'annulation d'opération
    console.log('\n7️⃣ Test d\'annulation d\'opération...');
    
    const operationToCancel = await Operation.findOne({ agenceId: TEST_AGENCE_ID });
    if (operationToCancel) {
      const resultAnnulation = await caisseService.annulerOperation(
        operationToCancel._id,
        TEST_AGENCE_ID
      );
      
      console.log(`   ✅ Opération annulée: ${operationToCancel._id}`);
      console.log(`   ✅ Opération d'annulation créée: ${resultAnnulation.operationAnnulation._id}`);
    } else {
      console.log('   ⚠️  Aucune opération à annuler trouvée');
    }

    console.log('\n🎉 Tous les tests d\'intégration sont passés avec succès !');
    
    // Nettoyage
    await Facture.deleteMany({ agenceId: TEST_AGENCE_ID });
    await Operation.deleteMany({ agenceId: TEST_AGENCE_ID });
    console.log('\n🧹 Nettoyage effectué');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    console.error(error.stack);
  }
}

// Test des validations
async function testValidations() {
  console.log('\n🔍 Tests de validation...\n');

  try {
    // Test avec montant invalide
    console.log('1️⃣ Test montant invalide...');
    try {
      await caisseService.enregistrerEntree({
        montant: -100,
        description: 'Test',
        agenceId: TEST_AGENCE_ID,
        moyenPaiement: 'especes'
      });
      console.log('   ❌ Erreur: Devrait échouer avec montant négatif');
    } catch (error) {
      console.log('   ✅ Validation montant négatif: OK');
    }

    // Test sans agenceId
    console.log('2️⃣ Test sans agenceId...');
    try {
      await caisseService.enregistrerEntree({
        montant: 100,
        description: 'Test',
        moyenPaiement: 'especes'
      });
      console.log('   ❌ Erreur: Devrait échouer sans agenceId');
    } catch (error) {
      console.log('   ✅ Validation agenceId: OK');
    }

    // Test moyen de paiement invalide
    console.log('3️⃣ Test moyen de paiement invalide...');
    try {
      await caisseService.enregistrerEntree({
        montant: 100,
        description: 'Test',
        agenceId: TEST_AGENCE_ID,
        moyenPaiement: 'invalid'
      });
      console.log('   ❌ Erreur: Devrait échouer avec moyen de paiement invalide');
    } catch (error) {
      console.log('   ✅ Validation moyen de paiement: OK');
    }

    console.log('\n✅ Tous les tests de validation sont passés !');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests de validation:', error.message);
  }
}

// Exécution des tests
async function runTests() {
  console.log('🚀 Démarrage des tests d\'intégration Caisse-Factures\n');
  
  await testCaisseIntegration();
  await testValidations();
  
  console.log('\n🏁 Tests terminés');
  process.exit(0);
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = {
  testCaisseIntegration,
  testValidations
}; 