const mongoose = require('mongoose');
const Operation = require('./models/operationModel');
const Fournisseur = require('./models/fournisseurModel');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/samtech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function corrigerOperationsAutomatique() {
  try {
    console.log('🔧 Correction automatique des opérations...\n');
    
    // 1. Corriger toutes les opérations avec des montants négatifs
    const operationsNegatives = await Operation.find({
      montant: { $lt: 0 }
    });
    
    console.log(`📊 ${operationsNegatives.length} opérations avec montants négatifs trouvées`);
    
    if (operationsNegatives.length > 0) {
      const resultat = await Operation.updateMany(
        { montant: { $lt: 0 } },
        [
          {
            $set: {
              montant: { $abs: '$montant' }
            }
          }
        ]
      );
      
      console.log(`✅ ${resultat.modifiedCount} opérations corrigées (montants rendus positifs)`);
    }
    
    // 2. Corriger les opérations fournisseurs avec mauvais type
    const operationsFournisseursIncorrectes = await Operation.find({
      $or: [
        { categorie: 'avance_fournisseur', type: { $ne: 'sortie' } },
        { categorie: 'paiement_fournisseur', type: { $ne: 'sortie' } }
      ]
    });
    
    console.log(`📊 ${operationsFournisseursIncorrectes.length} opérations fournisseurs avec mauvais type trouvées`);
    
    if (operationsFournisseursIncorrectes.length > 0) {
      const resultat = await Operation.updateMany(
        {
          $or: [
            { categorie: 'avance_fournisseur', type: { $ne: 'sortie' } },
            { categorie: 'paiement_fournisseur', type: { $ne: 'sortie' } }
          ]
        },
        { type: 'sortie' }
      );
      
      console.log(`✅ ${resultat.modifiedCount} opérations fournisseurs corrigées (type = sortie)`);
    }
    
    // 3. Recalculer les soldes de tous les fournisseurs
    console.log('\n🔄 Recalcul des soldes fournisseurs...');
    const fournisseurs = await Fournisseur.find({});
    
    for (const fournisseur of fournisseurs) {
      await fournisseur.calculerSoldes();
      console.log(`   ${fournisseur.entreprise}: Dette=${fournisseur.detteFournisseur}, Solde=${fournisseur.soldeCrediteur}`);
    }
    
    // 4. Afficher un résumé des corrections
    console.log('\n📋 RÉSUMÉ DES CORRECTIONS:');
    console.log('─'.repeat(50));
    console.log(`✅ Montants négatifs corrigés: ${operationsNegatives.length}`);
    console.log(`✅ Types d'opérations fournisseurs corrigés: ${operationsFournisseursIncorrectes.length}`);
    console.log(`✅ Soldes fournisseurs recalculés: ${fournisseurs.length}`);
    console.log('─'.repeat(50));
    
    console.log('\n🎯 Correction automatique terminée avec succès !');
    console.log('💡 Toutes les nouvelles opérations seront maintenant correctes par défaut.');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
}

corrigerOperationsAutomatique(); 