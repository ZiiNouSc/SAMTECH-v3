const mongoose = require('mongoose');
const Fournisseur = require('./models/fournisseurModel');
const FactureFournisseur = require('./models/factureFournisseurModel');
const Operation = require('./models/operationModel');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/samtech';

async function recalculerSoldesFournisseurs() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    console.log('🔍 Récupération de tous les fournisseurs...');
    const fournisseurs = await Fournisseur.find({});
    console.log(`📊 ${fournisseurs.length} fournisseurs trouvés\n`);

    let corrections = 0;

    for (const fournisseur of fournisseurs) {
      console.log(`\n🔍 Traitement de ${fournisseur.entreprise}...`);
      
      try {
        // Recalculer les soldes
        const soldes = await fournisseur.calculerSoldes();
        
        console.log(`   📊 Avant: Dette=${fournisseur.detteFournisseur}, Solde=${fournisseur.soldeCrediteur}`);
        console.log(`   📊 Après: Dette=${soldes.detteFournisseur}, Solde=${soldes.soldeCrediteur}`);
        
        // Sauvegarder si les valeurs ont changé
        if (fournisseur.detteFournisseur !== soldes.detteFournisseur || 
            fournisseur.soldeCrediteur !== soldes.soldeCrediteur) {
          
          fournisseur.detteFournisseur = soldes.detteFournisseur;
          fournisseur.soldeCrediteur = soldes.soldeCrediteur;
          await fournisseur.save();
          
          console.log(`   ✅ Soldes corrigés`);
          corrections++;
        } else {
          console.log(`   ✅ Soldes déjà corrects`);
        }
        
        // Afficher les détails
        console.log(`   📋 Détails:`);
        console.log(`      - Dette factures: ${soldes.detteFactures} DA`);
        console.log(`      - Dette initiale: ${soldes.detteInitiale} DA`);
        console.log(`      - Total avances: ${soldes.totalAvances} DA`);
        console.log(`      - Total paiements: ${soldes.totalPaiements} DA`);
        console.log(`      - Factures impayées: ${soldes.facturesImpayees}`);
        
      } catch (error) {
        console.error(`   ❌ Erreur pour ${fournisseur.entreprise}:`, error.message);
      }
    }

    console.log(`\n🎯 ${corrections} fournisseur(s) corrigé(s)`);
    console.log('✅ Recalcul terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du recalcul:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
if (require.main === module) {
  recalculerSoldesFournisseurs();
}

module.exports = recalculerSoldesFournisseurs; 