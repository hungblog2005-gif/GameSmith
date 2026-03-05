const { MongoClient } = require('mongodb');
const c = new MongoClient('mongodb://localhost:27017');

c.connect().then(async () => {
  const db = c.db('gamesmith_db');

  // Fix users collection validator
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
  console.log('✅ users validator updated!');

  // Fix assets collection validator
  await db.command({
    collMod: 'assets',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['title', 'slug', 'creatorId', 'price', 'categoryId', 'status', 'createdAt', 'updatedAt'],
        properties: {
          title:             { bsonType: 'string', minLength: 3, maxLength: 200 },
          slug:              { bsonType: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
          creatorId:         { bsonType: 'objectId' },
          description:       { bsonType: 'string', maxLength: 5000 },
          shortDescription:  { bsonType: 'string', maxLength: 200 },
          price:             { bsonType: 'number', minimum: 0 },
          discountPercent:   { bsonType: 'number', minimum: 0, maximum: 100 },
          isFree:            { bsonType: 'bool' },
          licenseType:       { enum: ['personal', 'commercial', 'enterprise', 'extended', 'free', null] },
          categoryId:        { bsonType: 'objectId' },
          tags:              { bsonType: 'array', items: { bsonType: 'string', maxLength: 50 } },
          fileFormat:        { bsonType: 'array', items: { bsonType: 'string' } },
          polygonCount:      { bsonType: ['number', 'null'] },
          textureResolution: { bsonType: 'string', enum: ['512', '1K', '2K', '4K', '8K', 'N/A'] },
          rigged:            { bsonType: 'bool' },
          animated:          { bsonType: 'bool' },
          gameEngineSupport: { bsonType: 'array', items: { bsonType: 'string' } },
          previewImages:     { bsonType: 'array', items: { bsonType: 'string' } },
          thumbnailUrl:      { bsonType: 'string' },
          videoDemoUrl:      { bsonType: ['string', 'null'] },
          fileSize:          { bsonType: 'string' },
          version:           { bsonType: 'string' },
          stats:             { bsonType: 'object' },
          ratings:           { bsonType: 'object' },
          status:            { enum: ['draft', 'pending', 'published', 'hidden', 'archived'] },
          featured:          { bsonType: 'bool' },
          isTrending:        { bsonType: 'bool' },
          createdAt:         { bsonType: 'date' },
          updatedAt:         { bsonType: 'date' },
          publishedAt:       { bsonType: ['date', 'null'] },
        },
      },
    },
    validationLevel: 'moderate',
    validationAction: 'error',
  });
  console.log('✅ assets validator updated!');

  // Fix profiles collection validator
  await db.command({
    collMod: 'profiles',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['username', 'created_at', 'updated_at'],
        properties: {
          userId:       { bsonType: 'objectId' },
          username:     { bsonType: 'string' },
          firstName:    { bsonType: 'string', maxLength: 50 },
          lastName:     { bsonType: 'string', maxLength: 50 },
          displayName:  { bsonType: 'string', maxLength: 100 },
          bio:          { bsonType: 'string', maxLength: 1000 },
          phoneNumber:  { bsonType: 'string' },
          address:      { bsonType: 'string', maxLength: 200 },
          city:         { bsonType: 'string', maxLength: 100 },
          country:      { bsonType: 'string', maxLength: 100 },
          postalCode:   { bsonType: 'string', maxLength: 20 },
          dateOfBirth:  { bsonType: ['date', 'null'] },
          gender:       { enum: ['male', 'female', 'other', 'prefer_not_to_say', null] },
          jobTitle:     { bsonType: 'string', maxLength: 100 },
          company:      { bsonType: 'string', maxLength: 100 },
          education:    { bsonType: 'string', maxLength: 200 },
          skills:       { bsonType: 'array', items: { bsonType: 'string' } },
          avatarUrl:    { bsonType: 'string' },
          coverImageUrl:{ bsonType: 'string' },
          website:      { bsonType: 'string' },
          socialLinks:  { bsonType: 'object' },
          stats:        { bsonType: 'object' },
          settings:     { bsonType: 'object' },
          lastSeen:     { bsonType: ['date', 'null'] },
          created_at:   { bsonType: 'date' },
          updated_at:   { bsonType: 'date' },
        },
      },
    },
    validationLevel: 'moderate',
    validationAction: 'error',
  });
  console.log('✅ profiles validator updated!');

  await c.close();
}).catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
