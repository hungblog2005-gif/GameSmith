/**
 * seed-categories.ts
 * Replaces all categories in MongoDB with the Asset Type tags
 * from tag_vocabulary.json (the canonical game-asset taxonomy).
 *
 * Run:
 *   npx ts-node seed-categories.ts
 */

import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gamesmith_db'

interface CategorySeed {
  name: string
  slug: string
  icon: string
  description: string
  order: number
  parentId: ObjectId | null
  isActive: boolean
}

// ── Derived from tag_vocabulary.json → "asset_type" group ──────────────────
// "Skybox" and "Skybox / HDRI" are merged into one entry.
const CATEGORIES: Omit<CategorySeed, 'parentId' | 'isActive'>[] = [
  {
    name: 'Character',
    slug: 'character',
    icon: '🧍',
    description: '3D game characters — humans, heroes, villains, and player avatars.',
    order: 1,
  },
  {
    name: 'Creature',
    slug: 'creature',
    icon: '🐉',
    description: 'Monsters, aliens, beasts, and mythical creatures for games.',
    order: 2,
  },
  {
    name: 'Robot',
    slug: 'robot',
    icon: '🤖',
    description: 'Mechanical robots, mechs, and automated humanoid models.',
    order: 3,
  },
  {
    name: 'NPC',
    slug: 'npc',
    icon: '🧑‍🤝‍🧑',
    description: 'Non-player characters — townspeople, guards, merchants, and allies.',
    order: 4,
  },
  {
    name: 'Environment',
    slug: 'environment',
    icon: '🌍',
    description: 'Full game environments, scenes, and level backgrounds.',
    order: 5,
  },
  {
    name: 'Architecture',
    slug: 'architecture',
    icon: '🏰',
    description: 'Buildings, structures, castles, ruins, and architectural assets.',
    order: 6,
  },
  {
    name: 'Vegetation',
    slug: 'vegetation',
    icon: '🌲',
    description: 'Trees, plants, grass, foliage, and natural environment pieces.',
    order: 7,
  },
  {
    name: 'Terrain',
    slug: 'terrain',
    icon: '🏔️',
    description: 'Game terrain, landscapes, ground meshes, and heightmaps.',
    order: 8,
  },
  {
    name: 'Skybox / HDRI',
    slug: 'skybox-hdri',
    icon: '🌅',
    description: 'Panoramic skyboxes, HDRI environment maps, and sky domes.',
    order: 9,
  },
  {
    name: 'Weapon',
    slug: 'weapon',
    icon: '⚔️',
    description: 'Swords, guns, axes, bows, and all combat weaponry.',
    order: 10,
  },
  {
    name: 'Armor',
    slug: 'armor',
    icon: '🛡️',
    description: 'Protective gear, helmets, shields, and full armor sets.',
    order: 11,
  },
  {
    name: 'Vehicle',
    slug: 'vehicle',
    icon: '🚗',
    description: 'Cars, trucks, spaceships, aircraft, and transport models.',
    order: 12,
  },
  {
    name: 'Props',
    slug: 'props',
    icon: '🪑',
    description: 'Furniture, barrels, crates, and interactive world objects.',
    order: 13,
  },
  {
    name: 'VFX',
    slug: 'vfx',
    icon: '✨',
    description: 'Visual effects — explosions, fire, smoke, magic, and impacts.',
    order: 14,
  },
  {
    name: 'Particle System',
    slug: 'particle-system',
    icon: '💫',
    description: 'Particle emitter assets for dust, sparks, rain, and ambient effects.',
    order: 15,
  },
  {
    name: 'UI / HUD',
    slug: 'ui-hud',
    icon: '🖥️',
    description: 'Game user interface panels, HUD elements, buttons, and menus.',
    order: 16,
  },
  {
    name: 'Icon',
    slug: 'icon',
    icon: '🎮',
    description: 'Flat 2D icons, inventory symbols, skill badges, and sprite icons.',
    order: 17,
  },
  {
    name: 'Material',
    slug: 'material',
    icon: '🎨',
    description: 'PBR materials, shaders, and surface texture sets.',
    order: 18,
  },
  {
    name: 'Texture Pack',
    slug: 'texture-pack',
    icon: '🖼️',
    description: 'Texture atlases, sprite sheets, and tileable texture collections.',
    order: 19,
  },
  {
    name: 'Font',
    slug: 'font',
    icon: '🔤',
    description: 'Game fonts, display typefaces, and pixel/fantasy lettering.',
    order: 20,
  },
]

async function main() {
  const client = new MongoClient(MONGO_URI)
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB:', MONGO_URI)

    const db = client.db()
    const col = db.collection<CategorySeed>('categories')

    // ── 1. Count existing categories ──────────────────────────────────────
    const existingCount = await col.countDocuments()
    console.log(`\n📂 Existing categories: ${existingCount}`)

    // ── 2. Drop existing categories ───────────────────────────────────────
    if (existingCount > 0) {
      await col.deleteMany({})
      console.log(`🗑️  Deleted ${existingCount} old categories`)
    }

    // ── 3. Insert new categories ──────────────────────────────────────────
    const now = new Date()
    const docs = CATEGORIES.map(c => ({
      ...c,
      parentId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }))

    const result = await col.insertMany(docs)
    console.log(`\n✅ Inserted ${result.insertedCount} categories:\n`)
    CATEGORIES.forEach((c, i) => {
      console.log(`  ${String(i + 1).padStart(2, '0')}. ${c.icon}  ${c.name.padEnd(20)} /${c.slug}`)
    })

    // ── 4. Summary ─────────────────────────────────────────────────────────
    console.log('\n🎉 Done! Run your backend and the new categories will appear.')
    console.log('   Note: Existing assets still reference old category ObjectIds.')
    console.log('   Use reassign-assets.ts (or the admin UI) to re-link them.\n')

  } finally {
    await client.close()
  }
}

main().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
