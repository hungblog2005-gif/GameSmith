const { MongoClient } = require('mongodb');
const c = new MongoClient('mongodb://localhost:27017');

c.connect().then(async () => {
  const db = c.db('gamesmith_db');
  await db.command({
    collMod: 'users',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['username', 'email', 'password_hash', 'role', 'status'],
        properties: {
          username: { bsonType: 'string', minLength: 3, maxLength: 50, pattern: '^[a-zA-Z0-9_]+$' },
          email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
          password_hash: { bsonType: 'string', minLength: 60 },
          role: { enum: ['user', 'creator', 'admin', 'moderator'] },
          status: { enum: ['active', 'inactive', 'suspended', 'banned'] },
          wallet_balance: { bsonType: 'number', minimum: 0 }
        }
      }
    },
    validationLevel: 'moderate'
  });
  console.log('✅ Validator updated successfully!');
  await c.close();
}).catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
