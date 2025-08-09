const mongoose = require('mongoose');
const Operation = require('./models/operationModel');
const Fournisseur = require('./models/fournisseurModel');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/samtech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function corrigerOperationsFournisseurs() {
  try {
    console.log('🔧 Correction des opérations fournisseurs...\n');
    
    // 1. Identifier les opérations problématiques
    const operationsFournisseurs = await Operation.find({
      $or: [
        { categorie: 'avance_fournisseur' },
        { categorie: 'paiement_fournisseur' }
      ]
    }).populate('fournisseurId');
    
    console.log(`📊 ${operationsFournisseurs.length} opérations fournisseurs trouvées:`);
    
    let corrections = 0;
    
    for (const op of operationsFournisseurs) {
      console.log(`\n🔍 Opération: ${op._id}`);
      console.log(`   Catégorie: ${op.categorie}`);
      console.log(`   Type: ${op.type}`);
      console.log(`   Montant: ${op.montant} DA`);
      console.log(`   Description: ${op.description}`);
      console.log(`   Fournisseur: ${op.fournisseurId?.entreprise || 'N/A'}`);
      
      let correctionNecessaire = false;
      let raison = '';
      
      // Vérifier la cohérence
      if (op.categorie === 'avance_fournisseur') {
        // Une avance doit être une sortie (on donne de l'argent)
        if (op.type !== 'sortie') {
          correctionNecessaire = true;
          raison = 'Avance fournisseur doit être une sortie';
        }
        // Le montant doit être positif
        if (op.montant < 0) {
          correctionNecessaire = true;
          raison = 'Montant d\'avance négatif';
        }
      } else if (op.categorie === 'paiement_fournisseur') {
        // Un paiement doit être une sortie (on paye)
        if (op.type !== 'sortie') {
          correctionNecessaire = true;
          raison = 'Paiement fournisseur doit être une sortie';
        }
        // Le montant doit être positif
        if (op.montant < 0) {
          correctionNecessaire = true;
          raison = 'Montant de paiement négatif';
        }
      }
      
      if (correctionNecessaire) {
        console.log(`   ❌ CORRECTION NÉCESSAIRE: ${raison}`);
        
        // Demander confirmation avant correction
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const reponse = await new Promise((resolve) => {
          rl.question('   Corriger cette opération ? (o/n): ', resolve);
        });
        rl.close();
        
        if (reponse.toLowerCase() === 'o') {
          // Corriger l'opération
          const corrections = {};
          
          if (op.type !== 'sortie') {
            corrections.type = 'sortie';
          }
          
          if (op.montant < 0) {
            corrections.montant = Math.abs(op.montant);
          }
          
          if (Object.keys(corrections).length > 0) {
            await Operation.findByIdAndUpdate(op._id, corrections);
            console.log(`   ✅ Opération corrigée:`, corrections);
            corrections++;
          }
        } else {
          console.log('   ⏭️  Opération ignorée');
        }
      } else {
        console.log('   ✅ Opération correcte');
      }
    }
    
    console.log(`\n🎯 ${corrections} opérations corrigées`);
    
    // 2. Recalculer les soldes de tous les fournisseurs
    console.log('\n🔄 Recalcul des soldes fournisseurs...');
    const fournisseurs = await Fournisseur.find({});
    
    for (const fournisseur of fournisseurs) {
      await fournisseur.calculerSoldes();
      console.log(`   ${fournisseur.entreprise}: Dette=${fournisseur.detteFournisseur}, Solde=${fournisseur.soldeCrediteur}`);
    }
    
    console.log('\n✅ Correction terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
}

corrigerOperationsFournisseurs(); 