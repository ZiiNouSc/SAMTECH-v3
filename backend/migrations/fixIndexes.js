const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/samtech', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once('open', async () => {
  console.log('Connexion à MongoDB établie');
  
  try {
    // Supprimer l'ancien index unique sur numero pour les factures
    console.log('Suppression de l\'ancien index unique sur numero pour les factures...');
    await db.collection('factures').dropIndex('numero_1');
    console.log('✅ Index numero_1 supprimé pour les factures');
  } catch (error) {
    console.log('ℹ️ Index numero_1 n\'existe pas pour les factures ou déjà supprimé');
  }
  
  try {
    // Supprimer l'ancien index unique sur numero pour les devis
    console.log('Suppression de l\'ancien index unique sur numero pour les devis...');
    await db.collection('prefactures').dropIndex('numero_1');
    console.log('✅ Index numero_1 supprimé pour les devis');
  } catch (error) {
    console.log('ℹ️ Index numero_1 n\'existe pas pour les devis ou déjà supprimé');
  }
  
  // Créer les nouveaux index composés
  console.log('Création des nouveaux index composés...');
  
  try {
    await db.collection('factures').createIndex(
      { numero: 1, agenceId: 1 }, 
      { unique: true, name: 'numero_agenceId_unique' }
    );
    console.log('✅ Index composé créé pour les factures');
  } catch (error) {
    console.log('❌ Erreur lors de la création de l\'index pour les factures:', error.message);
  }
  
  try {
    await db.collection('prefactures').createIndex(
      { numero: 1, agenceId: 1 }, 
      { unique: true, name: 'numero_agenceId_unique' }
    );
    console.log('✅ Index composé créé pour les devis');
  } catch (error) {
    console.log('❌ Erreur lors de la création de l\'index pour les devis:', error.message);
  }
  
  console.log('Migration terminée !');
  process.exit(0);
});

db.on('error', (err) => {
  console.error('Erreur de connexion MongoDB:', err);
  process.exit(1);
}); 