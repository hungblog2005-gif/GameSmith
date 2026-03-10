/**
 * seed-categories.ts
 * Seeds MongoDB with a hierarchical category tree inspired by Epic Games Fab
 * Marketplace — covering the full spectrum of game-development assets.
 *
 * Structure: top-level parent categories → subcategories (parentId set).
 *
 * Run (from backend/):
 *   npx ts-node scripts/seed-categories.ts
 *   MONGO_URI=mongodb://... npx ts-node scripts/seed-categories.ts
 */

import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://gamesmith:changeme_in_production@localhost:27017/gamesmith_db?authSource=admin'

interface CategorySeed {
  _id: ObjectId
  name: string
  slug: string
  icon: string
  description: string
  order: number
  parentId: ObjectId | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type ParentDef = {
  name: string
  slug: string
  icon: string
  description: string
  order: number
  children: ChildDef[]
}

type ChildDef = {
  name: string
  slug: string
  icon: string
  description: string
  order: number
}

// ── Fab-style category tree ────────────────────────────────────────────────
const TREE: ParentDef[] = [
  {
    name: '3D',
    slug: '3d',
    icon: '🧊',
    description: 'All three-dimensional game assets — models, rigs, and scenes.',
    order: 1,
    children: [
      {
        name: 'Characters',
        slug: '3d-characters',
        icon: '🧍',
        description: 'Humanoid heroes, villains, NPCs, and player avatars.',
        order: 1,
      },
      {
        name: 'Creatures & Monsters',
        slug: '3d-creatures',
        icon: '🐉',
        description: 'Beasts, aliens, demons, and mythical creatures.',
        order: 2,
      },
      {
        name: 'Environments',
        slug: '3d-environments',
        icon: '🌍',
        description: 'Full game levels, open-world scenes, and environmental sets.',
        order: 3,
      },
      {
        name: 'Architecture',
        slug: '3d-architecture',
        icon: '🏰',
        description: 'Buildings, dungeons, ruins, interiors, and structures.',
        order: 4,
      },
      {
        name: 'Props & Objects',
        slug: '3d-props',
        icon: '🪑',
        description: 'Furniture, crates, barrels, and interactive scene objects.',
        order: 5,
      },
      {
        name: 'Weapons',
        slug: '3d-weapons',
        icon: '⚔️',
        description: 'Swords, guns, staves, bows, and all combat hardware.',
        order: 6,
      },
      {
        name: 'Armor & Clothing',
        slug: '3d-armor',
        icon: '🛡️',
        description: 'Full armor sets, clothing, helmets, and wearable accessories.',
        order: 7,
      },
      {
        name: 'Vehicles',
        slug: '3d-vehicles',
        icon: '🚗',
        description: 'Cars, aircraft, ships, mechs, and futuristic transports.',
        order: 8,
      },
      {
        name: 'Vegetation & Nature',
        slug: '3d-vegetation',
        icon: '🌲',
        description: 'Trees, bushes, rocks, cliffs, and organic landscape pieces.',
        order: 9,
      },
      {
        name: 'Terrain & Landscapes',
        slug: '3d-terrain',
        icon: '🏔️',
        description: 'Ground meshes, heightmaps, tilesets, and terrain systems.',
        order: 10,
      },
      {
        name: 'Skybox / HDRI',
        slug: '3d-skybox',
        icon: '🌅',
        description: 'Panoramic skyboxes, HDRI maps, and atmospheric sky domes.',
        order: 11,
      },
      {
        name: 'Sci-Fi Assets',
        slug: '3d-scifi',
        icon: '🚀',
        description: 'Futuristic units, machinery, and space-age environments.',
        order: 12,
      },
      {
        name: 'Fantasy Assets',
        slug: '3d-fantasy',
        icon: '🧙',
        description: 'Magical settings, spell props, and high-fantasy world pieces.',
        order: 13,
      },
      {
        name: 'Low Poly',
        slug: '3d-low-poly',
        icon: '🔷',
        description: 'Stylized low-polygon models optimised for mobile and indie games.',
        order: 14,
      },
    ],
  },
  {
    name: '2D',
    slug: '2d',
    icon: '🖼️',
    description: 'Flat art assets — sprites, tilesets, and illustrated game elements.',
    order: 2,
    children: [
      {
        name: '2D Characters',
        slug: '2d-characters',
        icon: '🧑‍🎨',
        description: 'Sidescroller characters, animated sprites, and avatar sheets.',
        order: 1,
      },
      {
        name: 'Backgrounds & Environments',
        slug: '2d-backgrounds',
        icon: '🌄',
        description: 'Parallax backgrounds, scrolling levels, and scene illustrations.',
        order: 2,
      },
      {
        name: 'Tilesets',
        slug: '2d-tilesets',
        icon: '🧩',
        description: 'Modular tile packs for top-down and platform game maps.',
        order: 3,
      },
      {
        name: 'Sprites & Animations',
        slug: '2d-sprites',
        icon: '🎞️',
        description: 'Sprite sheets, frame-by-frame animations, and cutout rigs.',
        order: 4,
      },
      {
        name: 'UI / HUD',
        slug: '2d-ui-hud',
        icon: '🖥️',
        description: 'Interface panels, health bars, minimaps, and HUD elements.',
        order: 5,
      },
      {
        name: 'Icons & Badges',
        slug: '2d-icons',
        icon: '🏅',
        description: 'Inventory icons, skill badges, achievement emblems, and logos.',
        order: 6,
      },
      {
        name: 'Illustrations & Concept Art',
        slug: '2d-illustrations',
        icon: '🎨',
        description: 'Loading screens, key art, card illustrations, and splash images.',
        order: 7,
      },
      {
        name: 'Fonts & Typography',
        slug: '2d-fonts',
        icon: '🔤',
        description: 'Display fonts, pixel typefaces, and fantasy lettering.',
        order: 8,
      },
    ],
  },
  {
    name: 'Audio',
    slug: 'audio',
    icon: '🎵',
    description: 'Music tracks, sound effects, and full audio packages for games.',
    order: 3,
    children: [
      {
        name: 'Music & Soundtracks',
        slug: 'audio-music',
        icon: '🎼',
        description: 'Background scores, battle themes, looping ambient music.',
        order: 1,
      },
      {
        name: 'Sound Effects',
        slug: 'audio-sfx',
        icon: '💥',
        description: 'Foley, impacts, UI clicks, environment sounds, and one-shots.',
        order: 2,
      },
      {
        name: 'Ambient & Atmosphere',
        slug: 'audio-ambient',
        icon: '🌊',
        description: 'Wind, rain, crowds, dungeons, and looping environmental beds.',
        order: 3,
      },
      {
        name: 'Voice & Dialogue',
        slug: 'audio-voice',
        icon: '🎙️',
        description: 'Character voice lines, grunts, and narration packs.',
        order: 4,
      },
      {
        name: 'Audio Packs & Bundles',
        slug: 'audio-packs',
        icon: '📦',
        description: 'Complete themed audio collections covering SFX + music.',
        order: 5,
      },
    ],
  },
  {
    name: 'Visual Effects',
    slug: 'visual-effects',
    icon: '✨',
    description: 'Real-time VFX, particle systems, and post-process shaders.',
    order: 4,
    children: [
      {
        name: 'Particle Systems',
        slug: 'vfx-particles',
        icon: '💫',
        description: 'Fire, smoke, sparks, magic bursts, and ambient emitters.',
        order: 1,
      },
      {
        name: 'Spell & Magic Effects',
        slug: 'vfx-magic',
        icon: '🔮',
        description: 'Elemental spells, portals, auras, and enchanted trails.',
        order: 2,
      },
      {
        name: 'Explosions & Destruction',
        slug: 'vfx-explosions',
        icon: '💣',
        description: 'Bomb blasts, debris, shockwaves, and impact craters.',
        order: 3,
      },
      {
        name: 'Weather & Environment',
        slug: 'vfx-weather',
        icon: '🌧️',
        description: 'Rain, snow, lightning, fog, and volumetric cloud effects.',
        order: 4,
      },
      {
        name: 'Post Processing',
        slug: 'vfx-post-processing',
        icon: '🎬',
        description: 'Bloom, lens flare, color grade, and screen-space effects.',
        order: 5,
      },
    ],
  },
  {
    name: 'Materials & Textures',
    slug: 'materials-textures',
    icon: '🎨',
    description: 'PBR materials, surface shaders, and raw texture packages.',
    order: 5,
    children: [
      {
        name: 'PBR Materials',
        slug: 'mat-pbr',
        icon: '🪨',
        description: 'Physically-based surface sets — albedo, normal, roughness, AO.',
        order: 1,
      },
      {
        name: 'Stylized Materials',
        slug: 'mat-stylized',
        icon: '🖌️',
        description: 'Toon, cel-shaded, and hand-painted stylized surface styles.',
        order: 2,
      },
      {
        name: 'Terrain Materials',
        slug: 'mat-terrain',
        icon: '🌾',
        description: 'Layered landscape textures — dirt, grass, rock, sand, snow.',
        order: 3,
      },
      {
        name: 'Texture Packs',
        slug: 'mat-texture-packs',
        icon: '🖼️',
        description: 'Pre-compiled atlases, sprite sheets, and tileable texture sets.',
        order: 4,
      },
      {
        name: 'Decals',
        slug: 'mat-decals',
        icon: '🔖',
        description: 'Graffiti, damage overlays, blood splatters, and projected decals.',
        order: 5,
      },
    ],
  },
  {
    name: 'Animations',
    slug: 'animations',
    icon: '🏃',
    description: 'Motion capture and hand-keyed animation assets for characters and objects.',
    order: 6,
    children: [
      {
        name: 'Character Animations',
        slug: 'anim-characters',
        icon: '🧍‍♂️',
        description: 'Locomotion, combat, idle, death, and cinematic character clips.',
        order: 1,
      },
      {
        name: 'Creature Animations',
        slug: 'anim-creatures',
        icon: '🐺',
        description: 'Quadruped locomotion, attack, and creature behavior animations.',
        order: 2,
      },
      {
        name: 'Vehicle Animations',
        slug: 'anim-vehicles',
        icon: '🏎️',
        description: 'Wheel rigs, door mechanics, flight cycles, and vehicle clips.',
        order: 3,
      },
      {
        name: 'Facial & Mocap',
        slug: 'anim-mocap',
        icon: '😤',
        description: 'Motion-captured performance and facial blend-shape animations.',
        order: 4,
      },
    ],
  },
  {
    name: 'Tools & Plugins',
    slug: 'tools-plugins',
    icon: '🔧',
    description: 'Editor tools, scripting utilities, and engine plugins to speed up development.',
    order: 7,
    children: [
      {
        name: 'Editor Tools',
        slug: 'tools-editor',
        icon: '🛠️',
        description: 'Worldbuilding, level design, and pipeline automation tools.',
        order: 1,
      },
      {
        name: 'Code Plugins',
        slug: 'tools-code-plugins',
        icon: '🧩',
        description: 'Gameplay systems, AI frameworks, and engine-level C++ plugins.',
        order: 2,
      },
      {
        name: 'Blueprints & Scripts',
        slug: 'tools-blueprints',
        icon: '📋',
        description: 'Visual scripting blueprints and ready-to-use game logic modules.',
        order: 3,
      },
      {
        name: 'Shaders',
        slug: 'tools-shaders',
        icon: '💎',
        description: 'Custom HLSL/GLSL shader programs and material functions.',
        order: 4,
      },
    ],
  },
  {
    name: 'Complete Projects',
    slug: 'complete-projects',
    icon: '📦',
    description: 'Ready-to-use game templates and starter projects.',
    order: 8,
    children: [
      {
        name: 'Game Templates',
        slug: 'proj-templates',
        icon: '🎮',
        description: 'Full genre starter kits — FPS, RPG, platformer, and more.',
        order: 1,
      },
      {
        name: 'Demo Projects',
        slug: 'proj-demos',
        icon: '🎥',
        description: 'Showcase demos, tech demos, and feature demonstration projects.',
        order: 2,
      },
      {
        name: 'Mini Games',
        slug: 'proj-mini-games',
        icon: '🕹️',
        description: 'Small, self-contained, playable mini-game projects.',
        order: 3,
      },
    ],
  },
  {
    name: 'Tutorials & Education',
    slug: 'tutorials',
    icon: '📚',
    description: 'Step-by-step guides, video courses, and learning resources.',
    order: 9,
    children: [
      {
        name: 'Video Courses',
        slug: 'tut-video',
        icon: '🎬',
        description: 'Recorded video tutorial series on modeling, rigging, and engine use.',
        order: 1,
      },
      {
        name: 'Documentation & Guides',
        slug: 'tut-docs',
        icon: '📖',
        description: 'Written guides, reference docs, and workflow documentation.',
        order: 2,
      },
    ],
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

    // ── 3. Build document list (parents first, then children) ────────────
    const now = new Date()
    const docs: CategorySeed[] = []

    for (const parent of TREE) {
      const parentId = new ObjectId()
      docs.push({
        _id: parentId,
        name: parent.name,
        slug: parent.slug,
        icon: parent.icon,
        description: parent.description,
        order: parent.order,
        parentId: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })

      for (const child of parent.children) {
        docs.push({
          _id: new ObjectId(),
          name: child.name,
          slug: child.slug,
          icon: child.icon,
          description: child.description,
          order: child.order,
          parentId: parentId,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    // ── 4. Insert ─────────────────────────────────────────────────────────
    const result = await col.insertMany(docs)
    console.log(`\n✅ Inserted ${result.insertedCount} categories:\n`)

    let currentParentName = ''
    for (const doc of docs) {
      if (doc.parentId === null) {
        currentParentName = doc.name
        console.log(`\n  ${doc.icon}  ${doc.name.toUpperCase()} (/${doc.slug})`)
      } else {
        console.log(`       ├─ ${doc.icon}  ${doc.name.padEnd(28)} /${doc.slug}`)
      }
    }

    // ── 5. Summary ─────────────────────────────────────────────────────────
    const parentCount = TREE.length
    const childCount = docs.length - parentCount
    console.log(`\n📊 Stats: ${parentCount} parent categories, ${childCount} subcategories`)
    console.log('\n🎉 Done! Run your backend and the new categories will appear.')
    console.log('   Note: Existing assets still reference old category ObjectIds.')
    console.log('   Use the admin UI to re-link them to the new category IDs.\n')

  } finally {
    await client.close()
  }
}

main().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
