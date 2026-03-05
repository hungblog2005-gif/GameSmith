const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient('mongodb://localhost:27017/gamesmith_db');
  await client.connect();
  const db = client.db('gamesmith_db');
  const result = await db.collection('assets').updateMany(
    { status: 'draft' },
    { $set: { status: 'published' } }
  );
  console.log('Updated', result.modifiedCount, 'assets to published');
  await client.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
