/**
 * Seed script: creates the initial Admin account if it doesn't exist.
 *
 * Usage:
 *   npm run seed:admin
 *
 * Credentials:
 *   username: Admin
 *   email:    admin@gamesmith.com
 *   password: Admin@123
 *   role:     admin
 */

import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.DATABASE_URI ||
  'mongodb://localhost:27017/gamesmith';

const UserSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    password_hash: String,
    role: { type: String, default: 'user' },
    status: { type: String, default: 'active' },
    wallet_balance: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null },
    avatar_url: { type: String, default: '' },
    purchased_assets: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    refresh_token_hash: { type: String, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

async function seedAdmin() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  const UserModel = mongoose.model('User', UserSchema);

  const existing = await UserModel.findOne({ username: 'Admin' });
  if (existing) {
    console.log(
      `Admin account already exists (id: ${existing._id}). Skipping.`,
    );
    await mongoose.disconnect();
    return;
  }

  const password_hash = await bcrypt.hash('Admin@123', 10);

  const admin = await UserModel.create({
    username: 'Admin',
    email: 'admin@gamesmith.com',
    password_hash,
    role: 'admin',
    status: 'active',
  });

  console.log(`✅ Admin account created successfully!`);
  console.log(`   ID:       ${admin._id}`);
  console.log(`   Username: Admin`);
  console.log(`   Email:    admin@gamesmith.com`);
  console.log(`   Password: Admin@123`);
  console.log(`   Role:     admin`);

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
