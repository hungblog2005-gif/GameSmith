/**
 * Seed script: inserts 15 published assets owned by the Admin account.
 * 5 assets are marked featured: true.
 *
 * Usage (from /backend):
 *   npx ts-node -r tsconfig-paths/register scripts/seed-15-assets.ts
 *
 * Prerequisites: Admin account and at least one Category must exist.
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.DATABASE_URI ||
  'mongodb://localhost:27017/gamesmith';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const thumb = (seed: string) =>
  `https://picsum.photos/seed/${seed}/400/300`;

const preview = (seed: string, n: number) =>
  `https://picsum.photos/seed/${seed}-${n}/800/600`;

const previews = (seed: string) => [
  preview(seed, 1),
  preview(seed, 2),
  preview(seed, 3),
];

// ---------------------------------------------------------------------------
// Asset definitions  (index 0-4 → featured)
// ---------------------------------------------------------------------------
const ASSETS = [
  // ── FEATURED ─────────────────────────────────────────────────────────────
  {
    title: 'Medieval Castle Mega Pack',
    slug: 'medieval-castle-mega-pack',
    shortDescription: 'Modular medieval castle with full interior and exterior',
    description:
      'A comprehensive modular castle kit with towers, walls, gates, and interior props. ' +
      'All meshes use PBR materials with 4K texture atlases. Optimised LODs included.',
    price: 89000,
    discountPercent: 10,
    isFree: false,
    featured: true,
    isTrending: true,
    status: 'published',
    tags: ['3D', 'Medieval', 'Castle', 'Modular', 'PBR'],
    fileFormat: ['FBX', 'OBJ', 'BLEND'],
    fileSize: '512.0 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine', 'Godot'],
    licenseType: 'commercial',
    polygonCount: 280000,
    textureResolution: '4K',
    animated: false,
    rigged: false,
    version: '2.0.0',
    thumbnailUrl: thumb('castle1'),
    previewImages: previews('castle1'),
  },
  {
    title: 'Stylized Hero Character Bundle',
    slug: 'stylized-hero-character-bundle',
    shortDescription: '5 fully rigged stylized hero characters with idle/run/attack animations',
    description:
      'Five unique stylized hero characters (warrior, mage, archer, rogue, paladin). ' +
      'Each model includes a full animation set: idle, walk, run, attack (×3), ' +
      'jump, death. Compatible with Mixamo and Mecanim.',
    price: 149000,
    discountPercent: 0,
    isFree: false,
    featured: true,
    isTrending: true,
    status: 'published',
    tags: ['Character', 'Rigged', 'Animated', 'Stylized', 'RPG'],
    fileFormat: ['FBX', 'BLEND'],
    fileSize: '320.5 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine'],
    licenseType: 'commercial',
    polygonCount: 15000,
    textureResolution: '2K',
    animated: true,
    rigged: true,
    version: '1.3.0',
    thumbnailUrl: thumb('hero1'),
    previewImages: previews('hero1'),
  },
  {
    title: 'Cyberpunk Night City Environment',
    slug: 'cyberpunk-night-city-environment',
    shortDescription: 'Large-scale futuristic city block with neon signs and vehicles',
    description:
      'A fully modular cyberpunk city district. Includes 60+ building pieces, ' +
      'neon billboard prefabs, street props, hover-vehicles, and an HDR night sky. ' +
      'Baked ambient occlusion + runtime lighting examples included.',
    price: 199000,
    discountPercent: 15,
    isFree: false,
    featured: true,
    isTrending: false,
    status: 'published',
    tags: ['Environment', 'Cyberpunk', 'City', 'Sci-Fi', 'Neon'],
    fileFormat: ['FBX', 'OBJ'],
    fileSize: '780.2 MB',
    gameEngineSupport: ['Unreal Engine', 'Unity'],
    licenseType: 'commercial',
    polygonCount: 500000,
    textureResolution: '4K',
    animated: false,
    rigged: false,
    version: '1.0.0',
    thumbnailUrl: thumb('cyberpunk1'),
    previewImages: previews('cyberpunk1'),
  },
  {
    title: 'Fantasy Weapon Arsenal – 40 Models',
    slug: 'fantasy-weapon-arsenal-40-models',
    shortDescription: '40 hand-crafted fantasy weapons with PBR textures',
    description:
      'Swords, axes, maces, staves, bows and daggers — 40 unique fantasy weapons ' +
      'with PBR-ready textures and correct pivot points. Each weapon comes in ' +
      'idle and drawn poses. LOD0 and LOD1 meshes provided.',
    price: 79000,
    discountPercent: 20,
    isFree: false,
    featured: true,
    isTrending: true,
    status: 'published',
    tags: ['Weapon', 'Fantasy', 'Sword', 'Axe', 'PBR'],
    fileFormat: ['FBX', 'OBJ', 'USDZ'],
    fileSize: '145.8 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine', 'Godot'],
    licenseType: 'commercial',
    polygonCount: 8000,
    textureResolution: '2K',
    animated: false,
    rigged: false,
    version: '3.1.0',
    thumbnailUrl: thumb('weapon1'),
    previewImages: previews('weapon1'),
  },
  {
    title: 'Animated Dragon – Full Rig',
    slug: 'animated-dragon-full-rig',
    shortDescription: 'AAA-quality dragon with 20+ animations and morph targets',
    description:
      'A cinematic dragon model with detailed scales, feathered flight wings, ' +
      '20+ animations (fly, land, roar, fire breath, idle, death), and full ' +
      'morph-target facial expressions. Includes a Unity demo scene.',
    price: 249000,
    discountPercent: 0,
    isFree: false,
    featured: true,
    isTrending: true,
    status: 'published',
    tags: ['Dragon', 'Animated', 'Rigged', 'Fantasy', 'AAA'],
    fileFormat: ['FBX', 'BLEND'],
    fileSize: '640.0 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine'],
    licenseType: 'commercial',
    polygonCount: 95000,
    textureResolution: '4K',
    animated: true,
    rigged: true,
    version: '1.1.0',
    thumbnailUrl: thumb('dragon1'),
    previewImages: previews('dragon1'),
  },

  // ── NOT FEATURED ─────────────────────────────────────────────────────────
  {
    title: 'Space Shooter Sprite Sheet Pack',
    slug: 'space-shooter-sprite-sheet-pack',
    shortDescription: '200+ animated sprites for 2D space shooter games',
    description:
      'Complete sprite sheet collection for a top-down space shooter. ' +
      'Ships, asteroids, explosions, bullets, UI icons — all in 2× resolution ' +
      '(512px base). Exported as individual PNGs and as packed atlases (TexturePacker).',
    price: 35000,
    discountPercent: 0,
    isFree: false,
    featured: false,
    isTrending: false,
    status: 'published',
    tags: ['2D', 'Sprite', 'Space', 'Shooter', 'Atlas'],
    fileFormat: ['PNG', 'JSON'],
    fileSize: '22.5 MB',
    gameEngineSupport: ['Unity', 'Godot', 'Phaser'],
    licenseType: 'personal',
    polygonCount: null,
    textureResolution: '2K',
    animated: true,
    rigged: false,
    version: '1.0.0',
    thumbnailUrl: thumb('space1'),
    previewImages: previews('space1'),
  },
  {
    title: 'RPG Fantasy Audio Pack – 120 Tracks',
    slug: 'rpg-fantasy-audio-pack-120-tracks',
    shortDescription: '120 royalty-free SFX and music loops for RPG games',
    description:
      'From ambient forest loops to epic boss-battle orchestral scores, this 120-file ' +
      'audio pack covers every RPG scenario. All tracks loop seamlessly. ' +
      'Includes WAV (uncompressed) and OGG (web-ready) formats.',
    price: 59000,
    discountPercent: 10,
    isFree: false,
    featured: false,
    isTrending: false,
    status: 'published',
    tags: ['Audio', 'Music', 'SFX', 'RPG', 'Loop'],
    fileFormat: ['WAV', 'OGG'],
    fileSize: '890.0 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine', 'Godot'],
    licenseType: 'commercial',
    polygonCount: null,
    textureResolution: 'N/A',
    animated: false,
    rigged: false,
    version: '2.0.0',
    thumbnailUrl: thumb('audio1'),
    previewImages: previews('audio1'),
  },
  {
    title: 'VFX Particle Effects Bundle',
    slug: 'vfx-particle-effects-bundle',
    shortDescription: '80 ready-to-use particle effects: fire, magic, explosion, water',
    description:
      'Drag-and-drop VFX prefabs for Unity (Shuriken / VFX Graph) and Unreal (Niagara). ' +
      'Effects include: fire torches, magic spells (10 colours), explosions (small/large), ' +
      'rain, waterfall, smoke, and screen-space blood splatter.',
    price: 65000,
    discountPercent: 5,
    isFree: false,
    featured: false,
    isTrending: true,
    status: 'published',
    tags: ['VFX', 'Particles', 'Fire', 'Magic', 'Explosion'],
    fileFormat: ['UNITYPACKAGE', 'UASSET'],
    fileSize: '95.3 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine'],
    licenseType: 'commercial',
    polygonCount: null,
    textureResolution: '1K',
    animated: true,
    rigged: false,
    version: '1.4.0',
    thumbnailUrl: thumb('vfx1'),
    previewImages: previews('vfx1'),
  },
  {
    title: 'Low-Poly Dungeon Tileset',
    slug: 'low-poly-dungeon-tileset',
    shortDescription: 'Modular low-poly dungeon tiles and props — 90 pieces',
    description:
      'A complete grid-aligned dungeon tileset in a hand-painted low-poly style. ' +
      'Includes floor, wall, ceiling, door, chest, pillar, and trap pieces. ' +
      'One shared 512×512 atlas texture keeps draw calls minimal.',
    price: 29000,
    discountPercent: 0,
    isFree: false,
    featured: false,
    isTrending: false,
    status: 'published',
    tags: ['Dungeon', 'Low-Poly', 'Tileset', 'Modular', 'RPG'],
    fileFormat: ['FBX', 'OBJ'],
    fileSize: '18.7 MB',
    gameEngineSupport: ['Unity', 'Godot'],
    licenseType: 'personal',
    polygonCount: 3000,
    textureResolution: '512',
    animated: false,
    rigged: false,
    version: '1.0.0',
    thumbnailUrl: thumb('dungeon1'),
    previewImages: previews('dungeon1'),
  },
  {
    title: 'Mobile UI Kit – Casual Gold Theme',
    slug: 'mobile-ui-kit-casual-gold-theme',
    shortDescription: 'Complete mobile game UI in a shiny gold cartoon style',
    description:
      'Over 300 layered UI assets in a polished casual-game gold theme. ' +
      'Includes main menu, HUD, shop, settings, popup dialogs, progress bars, ' +
      'buttons and icon set. Provided as layered PSD + exported transparent PNGs.',
    price: 45000,
    discountPercent: 30,
    isFree: false,
    featured: false,
    isTrending: false,
    status: 'published',
    tags: ['UI', 'Mobile', 'Casual', 'HUD', 'Gold'],
    fileFormat: ['PNG', 'PSD'],
    fileSize: '38.2 MB',
    gameEngineSupport: ['Unity'],
    licenseType: 'personal',
    polygonCount: null,
    textureResolution: '2K',
    animated: false,
    rigged: false,
    version: '1.2.0',
    thumbnailUrl: thumb('uikit1'),
    previewImages: previews('uikit1'),
  },
  {
    title: 'Pixel Art RPG Character Set',
    slug: 'pixel-art-rpg-character-set',
    shortDescription: '12 pixel-art RPG characters with 8-directional walk cycles',
    description:
      '16×16 and 32×32 pixel-art characters (warrior, mage, archer, villain, villager×4, ' +
      'monsters×4). Each includes full 8-direction walk and attack cycles. ' +
      'Packaged as individual frames + TexturePacker JSON atlases.',
    price: 0,
    discountPercent: 0,
    isFree: true,
    featured: false,
    isTrending: false,
    status: 'published',
    tags: ['Pixel Art', '2D', 'Character', 'RPG', 'Free'],
    fileFormat: ['PNG', 'JSON'],
    fileSize: '4.1 MB',
    gameEngineSupport: ['Unity', 'Godot', 'Phaser', 'RPG Maker'],
    licenseType: 'free',
    polygonCount: null,
    textureResolution: 'N/A',
    animated: true,
    rigged: false,
    version: '1.0.0',
    thumbnailUrl: thumb('pixel1'),
    previewImages: previews('pixel1'),
  },
  {
    title: 'Realistic Water Shader – URP & HDRP',
    slug: 'realistic-water-shader-urp-hdrp',
    shortDescription: 'Physically-based water shader with foam, caustics, and reflection',
    description:
      'A production-ready water shader for Unity URP and HDRP. Features ' +
      'Gerstner-wave displacement, real-time foam mask, caustic projector, ' +
      'underwater post-process, and an interactive ripple system. Includes ' +
      'ocean, lake, and river presets.',
    price: 55000,
    discountPercent: 0,
    isFree: false,
    featured: false,
    isTrending: true,
    status: 'published',
    tags: ['Shader', 'Water', 'URP', 'HDRP', 'PBR'],
    fileFormat: ['UNITYPACKAGE'],
    fileSize: '28.9 MB',
    gameEngineSupport: ['Unity'],
    licenseType: 'commercial',
    polygonCount: null,
    textureResolution: '2K',
    animated: false,
    rigged: false,
    version: '3.0.0',
    thumbnailUrl: thumb('water1'),
    previewImages: previews('water1'),
  },
  {
    title: 'Realistic Forest Biome Pack',
    slug: 'realistic-forest-biome-pack',
    shortDescription: '50 tree, bush and ground-cover models with wind shader',
    description:
      'A complete realistic forest biome for AAA-style open-world games. ' +
      '50 unique vegetation models (pines, oaks, maples, ferns, mushrooms, rocks) ' +
      'with a GPU Instancer-compatible wind shader. Billboard LODs and SpeedTree ' +
      'import presets included.',
    price: 119000,
    discountPercent: 10,
    isFree: false,
    featured: false,
    isTrending: false,
    status: 'published',
    tags: ['Environment', 'Forest', 'Tree', 'Nature', 'Open World'],
    fileFormat: ['FBX', 'OBJ'],
    fileSize: '925.6 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine'],
    licenseType: 'commercial',
    polygonCount: 12000,
    textureResolution: '4K',
    animated: false,
    rigged: false,
    version: '2.2.0',
    thumbnailUrl: thumb('forest1'),
    previewImages: previews('forest1'),
  },
  {
    title: 'Racing Car Collection – 8 Vehicles',
    slug: 'racing-car-collection-8-vehicles',
    shortDescription: '8 sport racing cars with interior, LODs and livery textures',
    description:
      'Eight high-detail racing cars (Formula 1, GT, rally, drift, buggy, SUV, ' +
      'muscle, electric) with full interiors, working steering wheels, and ' +
      'separate wheel/caliper meshes. LOD0–LOD3 and customisable livery UV maps provided.',
    price: 175000,
    discountPercent: 5,
    isFree: false,
    featured: false,
    isTrending: false,
    status: 'published',
    tags: ['Vehicle', 'Car', 'Racing', 'Sport', 'LOD'],
    fileFormat: ['FBX', 'OBJ'],
    fileSize: '430.0 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine'],
    licenseType: 'commercial',
    polygonCount: 60000,
    textureResolution: '4K',
    animated: false,
    rigged: false,
    version: '1.0.0',
    thumbnailUrl: thumb('car1'),
    previewImages: previews('car1'),
  },
  {
    title: 'Post-Processing & Cinematic LUT Pack',
    slug: 'post-processing-cinematic-lut-pack',
    shortDescription: '60 cinematic LUT profiles + Unity/URP post-process presets',
    description:
      'Sixty hand-crafted LUT (Look-Up Table) profiles (horror, anime, noir, ' +
      'warm sunset, cold winter, neon night, and more) packaged as .cube files. ' +
      'Comes with ready-made Unity URP Volume profiles and an Unreal ' +
      'post-process Material for each style.',
    price: 25000,
    discountPercent: 0,
    isFree: false,
    featured: false,
    isTrending: false,
    status: 'published',
    tags: ['Post-Processing', 'LUT', 'Cinematic', 'Shader', 'VFX'],
    fileFormat: ['CUBE', 'UNITYPACKAGE', 'UASSET'],
    fileSize: '12.4 MB',
    gameEngineSupport: ['Unity', 'Unreal Engine'],
    licenseType: 'commercial',
    polygonCount: null,
    textureResolution: 'N/A',
    animated: false,
    rigged: false,
    version: '1.0.0',
    thumbnailUrl: thumb('lut1'),
    previewImages: previews('lut1'),
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();          // uses DB from URI
    const users      = db.collection('users');
    const categories = db.collection('categories');
    const assets     = db.collection('assets');

    // Find admin user
    const admin = await users.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ Admin user not found. Run seed-admin first.');
      return;
    }
    console.log(`👤 Admin: ${admin.username ?? admin.email} (${admin._id})`);

    // Collect category IDs (cycle through all available)
    const cats = await categories.find({}).toArray();
    if (cats.length === 0) {
      console.error('❌ No categories found. Run seed-categories first.');
      return;
    }
    console.log(`📂 Found ${cats.length} categor${cats.length === 1 ? 'y' : 'ies'}`);

    const now = new Date();
    let inserted = 0;
    let skipped  = 0;

    for (let i = 0; i < ASSETS.length; i++) {
      const def = ASSETS[i];
      const cat = cats[i % cats.length];          // cycle through categories

      // Skip if slug already exists
      const existing = await assets.findOne({ slug: def.slug });
      if (existing) {
        console.log(`⏭  Skip (exists): ${def.title}`);
        skipped++;
        continue;
      }

      const doc = {
        ...def,
        creatorId: admin._id as ObjectId,
        categoryId: cat._id as ObjectId,
        createdAt: now,
        updatedAt: now,
        stats: {
          downloadCount: Math.floor(Math.random() * 2000),
          viewCount:     Math.floor(Math.random() * 10000),
          likeCount:     Math.floor(Math.random() * 800),
          reviewCount:   Math.floor(Math.random() * 120),
        },
        ratings: {
          average: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
          count:   Math.floor(Math.random() * 200),
        },
      };

      const result = await assets.insertOne(doc as any);
      const featuredLabel = def.featured ? ' ⭐ featured' : '';
      console.log(`✅ ${def.title}${featuredLabel}  (${result.insertedId})`);
      inserted++;
    }

    console.log(`\n🎉 Done!  inserted=${inserted}  skipped=${skipped}`);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

seed();
