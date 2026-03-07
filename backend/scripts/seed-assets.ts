import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = 'mongodb://localhost:27017/gamesmith_db';
const API_BASE = 'http://localhost:3000';

interface Asset {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPercent: number;
  isFree: boolean;
  categoryId: ObjectId;
  creatorId: ObjectId;
  thumbnailUrl: string;
  previewImages: string[];
  status: 'draft' | 'pending' | 'published' | 'hidden' | 'archived';
  featured: boolean;
  tags: string[];
  fileFormat: string[];
  fileSize: string;
  gameEngineSupport: string[];
  licenseType: string;
  polygonCount: number | null;
  textureResolution: string;
  animated: boolean;
  rigged: boolean;
  isTrending: boolean;
  version?: string;
}

const sampleAssets: Partial<Asset>[] = [
  {
    title: 'Modern 3D Cube Model',
    slug: 'modern-3d-cube-model',
    description: 'High-quality 3D cube model with PBR textures. Perfect for game development and 3D visualization.',
    shortDescription: 'Professional 3D cube model with PBR textures',
    price: 29.99,
    discountPercent: 10,
    isFree: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1618938381563-430f63602d4b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1611080626919-d2dffb0b97e7?w=800&h=600&fit=crop',
    ],
    status: 'published',
    featured: true,
    tags: ['3D Model', 'Game Asset', 'PBR', 'Cube'],
    fileFormat: ['FBX', 'OBJ', 'USDZ'],
    fileSize: '45.5 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine', 'Godot'],
    licenseType: 'commercial',
    polygonCount: 1024,
    textureResolution: '4K',
    animated: false,
    rigged: false,
    isTrending: true,
    version: '1.0.0',
  },
  {
    title: 'Realistic Character Rig',
    slug: 'realistic-character-rig',
    description: 'Fully rigged human character for animation and game development. Includes bones and skin weights.',
    shortDescription: 'Professional character rig with full bone structure',
    price: 79.99,
    discountPercent: 20,
    isFree: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1577720643272-265ff32a6e5b?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1577720643272-265ff32a6e5b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1559390305-cd4628902df4?w=800&h=600&fit=crop',
    ],
    status: 'published',
    featured: true,
    tags: ['Character', 'Rigged', 'Animation', 'Human'],
    fileFormat: ['FBX', 'BLEND'],
    fileSize: '125.8 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine'],
    licenseType: 'commercial',
    polygonCount: 50000,
    textureResolution: '4K',
    animated: true,
    rigged: true,
    isTrending: true,
    version: '2.1.0',
  },
  {
    title: 'Fantasy Environment Pack',
    slug: 'fantasy-environment-pack',
    description: 'Complete fantasy environment with trees, rocks, and structures. Ready for game integration.',
    shortDescription: 'Fantasy game environment with multiple elements',
    price: 49.99,
    discountPercent: 0,
    isFree: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    ],
    status: 'published',
    featured: true,
    tags: ['Environment', 'Fantasy', 'Pack', 'Game Ready'],
    fileFormat: ['FBX', 'OBJ'],
    fileSize: '234.2 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine', 'Godot'],
    licenseType: 'commercial',
    polygonCount: 150000,
    textureResolution: '2K',
    animated: false,
    rigged: false,
    isTrending: false,
    version: '1.2.0',
  },
  {
    title: 'Sci-Fi Weapon Collection',
    slug: 'sci-fi-weapon-collection',
    description: 'High-quality sci-fi weapons pack. Includes 10 different weapon models with animations.',
    shortDescription: 'Professional sci-fi weapon assets',
    price: 39.99,
    discountPercent: 15,
    isFree: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1535016120754-fd45c442d69b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1486737314967-3449bfa7df5c?w=800&h=600&fit=crop',
    ],
    status: 'published',
    featured: false,
    tags: ['Weapon', 'Sci-Fi', 'Collection', 'Animated'],
    fileFormat: ['FBX', 'BLEND'],
    fileSize: '89.4 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine'],
    licenseType: 'commercial',
    polygonCount: 35000,
    textureResolution: '2K',
    animated: true,
    rigged: false,
    isTrending: true,
    version: '3.0.1',
  },
  {
    title: 'Stylized Tree Pack',
    slug: 'stylized-tree-pack',
    description: 'Collection of 15 low-poly stylized trees. Perfect for casual and indie games.',
    shortDescription: 'Low-poly stylized tree assets',
    price: 19.99,
    discountPercent: 0,
    isFree: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518531933037-91b2f8ebbffd?w=800&h=600&fit=crop',
    ],
    status: 'published',
    featured: false,
    tags: ['Tree', 'Nature', 'Low-Poly', 'Pack'],
    fileFormat: ['FBX', 'OBJ'],
    fileSize: '32.1 MB',
    gameEngineSupport: ['Unity', 'Godot', 'Unreal Engine'],
    licenseType: 'personal',
    polygonCount: 5000,
    textureResolution: '1K',
    animated: false,
    rigged: false,
    isTrending: false,
    version: '1.5.0',
  },
  {
    title: 'Neon UI Kit',
    slug: 'neon-ui-kit',
    description: 'Complete neon-style UI kit for games. Includes buttons, panels, and effects.',
    shortDescription: 'Neon-style game UI elements',
    price: 24.99,
    discountPercent: 25,
    isFree: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1559289255-a83ed961cf92?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1559289255-a83ed961cf92?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1526374965328-7f5ae4e8b08f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1550258987-920a92eae356?w=800&h=600&fit=crop',
    ],
    status: 'published',
    featured: false,
    tags: ['UI', 'Neon', 'Kit', 'Game UI'],
    fileFormat: ['PNG', 'PSD'],
    fileSize: '15.3 MB',
    gameEngineSupport: ['Unity'],
    licenseType: 'personal',
    polygonCount: null,
    textureResolution: 'N/A',
    animated: false,
    rigged: false,
    isTrending: false,
    version: '1.0.0',
  },
];

async function seedAssets() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db('gamesmith_db');
    const categoriesCollection = db.collection('categories');
    const usersCollection = db.collection('users');
    const assetsCollection = db.collection('assets');

    const category = await categoriesCollection.findOne({});
    const user = await usersCollection.findOne({});

    if (!category || !user) {
      console.error('❌ No category or user found. Please create them first.');
      return;
    }

    const categoryId = category._id;
    const creatorId = user._id;

    console.log(`📦 Seeding ${sampleAssets.length} assets...`);
    console.log(`Using Category: ${category.name} (${categoryId})`);
    console.log(`Using Creator: ${user.email || user.username} (${creatorId})\n`);

    const now = new Date();

    for (let i = 0; i < sampleAssets.length; i++) {
      const asset = sampleAssets[i];
      const fullAsset = {
        ...asset,
        categoryId,
        creatorId,
        createdAt: now,
        updatedAt: now,
        stats: {
          downloadCount: Math.floor(Math.random() * 1000),
          viewCount: Math.floor(Math.random() * 5000),
          likeCount: Math.floor(Math.random() * 500),
          reviewCount: Math.floor(Math.random() * 50),
        },
        ratings: {
          average: Math.random() * 5,
          count: Math.floor(Math.random() * 100),
        },
      };

      try {
        const result = await assetsCollection.insertOne(fullAsset as any);
        console.log(`✅ Added: ${asset.title} (ID: ${result.insertedId})`);
      } catch (error: any) {
        console.error(`❌ Error adding ${asset.title}:`, error.message);
        if (error.errInfo?.details?.schemaRulesNotSatisfied) {
          console.error('Schema violations:', error.errInfo.details.schemaRulesNotSatisfied);
        }
      }
    }

    console.log(`\n✨ Seeding complete! ${sampleAssets.length} assets added.`);
  } catch (error) {
    console.error('❌ Error seeding assets:', error);
  } finally {
    await client.close();
  }
}

seedAssets();
