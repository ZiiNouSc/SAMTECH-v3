const mongoose = require('mongoose');
const Operation = require('./models/operationModel');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/samtech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function diagnosticCaisse() {
  try {
    console.log('🔍 Diagnostic de la caisse...\n');
    
    // Récupérer toutes les opérations
    const operations = await Operation.find({}).sort({ date: -1 }).limit(20);
    
    console.log(`📊 ${operations.length} dernières opérations:`);
    console.log('─'.repeat(80));
    
    let totalEntrees = 0;
    let totalSorties = 0;
    
    for (const op of operations) {
      const montant = op.montant;
      const type = op.type;
      const categorie = op.categorie;
      const description = op.description;
      
      if (type === 'entree') {
        totalEntrees += montant;
        console.log(`✅ ENTRÉE: +${montant} DA - ${categorie} - ${description}`);
      } else if (type === 'sortie') {
        totalSorties += montant;
        console.log(`❌ SORTIE: -${montant} DA - ${categorie} - ${description}`);
      }
    }
    
    console.log('─'.repeat(80));
    console.log(`💰 TOTAL ENTRÉES: ${totalEntrees} DA`);
    console.log(`💸 TOTAL SORTIES: ${totalSorties} DA`);
    console.log(`💳 SOLDE: ${totalEntrees - totalSorties} DA`);
    
    // Vérifier les opérations avec des montants négatifs
    const operationsNegatives = operations.filter(op => op.montant < 0);
    if (operationsNegatives.length > 0) {
      console.log('\n⚠️  OPÉRATIONS AVEC MONTANTS NÉGATIFS:');
      operationsNegatives.forEach(op => {
        console.log(`   - ${op.type}: ${op.montant} DA - ${op.categorie} - ${op.description}`);
      });
    }
    
    // Vérifier les opérations de fournisseurs
    const operationsFournisseurs = operations.filter(op => 
      op.categorie === 'avance_fournisseur' || op.categorie === 'paiement_fournisseur'
    );
    
    if (operationsFournisseurs.length > 0) {
      console.log('\n🏢 OPÉRATIONS FOURNISSEURS:');
      operationsFournisseurs.forEach(op => {
        console.log(`   - ${op.type}: ${op.montant} DA - ${op.categorie} - ${op.description}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
}

diagnosticCaisse(); 