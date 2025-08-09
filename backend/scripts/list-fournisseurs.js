const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const adminDb = client.db().admin();
  const dbs = await adminDb.listDatabases();

  for (const dbInfo of dbs.databases) {
    const dbName = dbInfo.name;
    if (['admin', 'local', 'config'].includes(dbName)) continue;
    const db = client.db(dbName);
    const fournisseurs = await db.collection('fournisseurs').find().toArray();
    if (fournisseurs.length > 0) {
      console.log(`\nBase : ${dbName}`);
      fournisseurs.forEach(f => {
        console.log(`  _id: ${f._id} | nom: ${f.nom} | agenceId: ${f.agenceId}`);
      });
    }
  }

  await client.close();
}

main().catch(console.error); 