/**
 * Seed script: creates 20 published assets via the REST API under the Admin account.
 *
 * KEY DIFFERENCE vs seed-15-assets.ts: this script calls POST /assets (HTTP API)
 * instead of writing directly to MongoDB, so every asset goes through the full
 * AssetsService.create() pipeline — which fires indexAsset() → Qdrant indexing.
 *
 * Usage (from /backend):
 *   npm run seed:20-assets
 *
 * Prerequisites:
 *   1. Backend running on http://localhost:3000
 *   2. Admin account exists (npm run seed:admin)
 *   3. At least one Category exists (npm run seed:categories)
 *   4. AI service running on http://localhost:8000  (for Qdrant indexing)
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@gamesmith.com';
const ADMIN_PASSWORD = 'Admin@123';

// ---------------------------------------------------------------------------
// Image helpers — Picsum Photos (deterministic, always available)
// ---------------------------------------------------------------------------
const thumb = (seed: string) =>
  `https://picsum.photos/seed/${seed}/600/400`;

const preview = (seed: string, n: number) =>
  `https://picsum.photos/seed/${seed}-${n}/1200/800`;

const previews = (seed: string) => [
  preview(seed, 1),
  preview(seed, 2),
  preview(seed, 3),
];

// ---------------------------------------------------------------------------
// 20 asset definitions
// ---------------------------------------------------------------------------
const ASSETS = [
  // ── 1 ─ 3D Environment ───────────────────────────────────────────────────
  {
    title: 'Medieval Castle Mega Pack',
    slug: 'medieval-castle-mega-pack-v2',
    short_description: 'Modular medieval castle with full interior and exterior',
    description:
      'A comprehensive modular castle kit with towers, walls, gates, drawbridge, and ' +
      'interior props. All meshes use PBR materials with 4K texture atlases. ' +
      'Optimised LODs (LOD0–LOD3) and collision meshes included. ' +
      'Compatible with Unity URP/HDRP and Unreal Engine 5.',
    price: 89000,
    discount_percentage: 10,
    is_free: false,
    featured: true,
    status: 'published',
    tags: ['3D', 'Medieval', 'Castle', 'Modular', 'PBR', 'Environment'],
    file_format: ['FBX', 'OBJ', 'BLEND'],
    file_size: '512.0 MB',
    game_engine_support: ['Unity', 'Unreal Engine', 'Godot'],
    license_type: 'commercial',
    polygon_count: 280000,
    texture_resolution: '4K',
    animated: false,
    rigged: false,
    thumbnail_url: thumb('castle-gs1'),
    preview_images: previews('castle-gs1'),
  },

  // ── 2 ─ Character ─────────────────────────────────────────────────────────
  {
    title: 'Stylized Hero Character Bundle',
    slug: 'stylized-hero-character-bundle-v2',
    short_description: '5 fully rigged stylized heroes with idle/run/attack animations',
    description:
      'Five unique stylized hero characters — warrior, mage, archer, rogue, and paladin. ' +
      'Each model includes a full animation set: idle, walk, run, 3× attack, jump, death. ' +
      'Compatible with Mixamo retargeting and Unity Mecanim. ' +
      'Comes with separate weapon props and facial blend shapes.',
    price: 149000,
    discount_percentage: 0,
    is_free: false,
    featured: true,
    status: 'published',
    tags: ['Character', 'Rigged', 'Animated', 'Stylized', 'RPG', 'Hero'],
    file_format: ['FBX', 'BLEND'],
    file_size: '320.5 MB',
    game_engine_support: ['Unity', 'Unreal Engine'],
    license_type: 'commercial',
    polygon_count: 15000,
    texture_resolution: '2K',
    animated: true,
    rigged: true,
    thumbnail_url: thumb('hero-gs2'),
    preview_images: previews('hero-gs2'),
  },

  // ── 3 ─ Environment ───────────────────────────────────────────────────────
  {
    title: 'Cyberpunk Night City Environment',
    slug: 'cyberpunk-night-city-env-v2',
    short_description: 'Large-scale futuristic city block with neon signs and vehicles',
    description:
      'A fully modular cyberpunk city district. Includes 60+ building modules, ' +
      'neon billboard prefabs, street props, hover-vehicles, and an HDR night sky. ' +
      'Baked ambient occlusion and runtime neon lighting setups included. ' +
      '5 pre-assembled city block scenes ready to use.',
    price: 199000,
    discount_percentage: 15,
    is_free: false,
    featured: true,
    status: 'published',
    tags: ['Environment', 'Cyberpunk', 'City', 'Sci-Fi', 'Neon', 'Modular'],
    file_format: ['FBX', 'OBJ'],
    file_size: '780.2 MB',
    game_engine_support: ['Unreal Engine', 'Unity'],
    license_type: 'commercial',
    polygon_count: 500000,
    texture_resolution: '4K',
    animated: false,
    rigged: false,
    thumbnail_url: thumb('cyberpunk-gs3'),
    preview_images: previews('cyberpunk-gs3'),
  },

  // ── 4 ─ Weapons ───────────────────────────────────────────────────────────
  {
    title: 'Fantasy Weapon Arsenal – 40 Models',
    slug: 'fantasy-weapon-arsenal-40-v2',
    short_description: '40 hand-crafted fantasy weapons with PBR textures and LODs',
    description:
      'Swords, axes, maces, staves, bows and daggers — 40 unique fantasy weapons. ' +
      'PBR-ready textures with metallic/roughness workflow. Correct pivot points ' +
      'for hand attachment. LOD0 and LOD1 meshes provided for each weapon.',
    price: 79000,
    discount_percentage: 20,
    is_free: false,
    featured: true,
    status: 'published',
    tags: ['Weapon', 'Fantasy', 'Sword', 'Axe', 'PBR', 'LOD'],
    file_format: ['FBX', 'OBJ', 'USDZ'],
    file_size: '145.8 MB',
    game_engine_support: ['Unity', 'Unreal Engine', 'Godot'],
    license_type: 'commercial',
    polygon_count: 8000,
    texture_resolution: '2K',
    animated: false,
    rigged: false,
    thumbnail_url: thumb('weapon-gs4'),
    preview_images: previews('weapon-gs4'),
  },

  // ── 5 ─ Creature ──────────────────────────────────────────────────────────
  {
    title: 'Animated Dragon – Full Rig',
    slug: 'animated-dragon-full-rig-v2',
    short_description: 'AAA-quality dragon with 20+ animations and morph targets',
    description:
      'A cinematic dragon with highly detailed scales, feathered flight wings, and ' +
      '20+ animations (fly, land, roar, fire breath, idle, death). ' +
      'Full morph-target facial expressions. Includes a Unity demo scene ' +
      'with fire breath particle effect setup.',
    price: 249000,
    discount_percentage: 0,
    is_free: false,
    featured: true,
    status: 'published',
    tags: ['Dragon', 'Animated', 'Rigged', 'Fantasy', 'AAA', 'Creature'],
    file_format: ['FBX', 'BLEND'],
    file_size: '640.0 MB',
    game_engine_support: ['Unity', 'Unreal Engine'],
    license_type: 'commercial',
    polygon_count: 95000,
    texture_resolution: '4K',
    animated: true,
    rigged: true,
    thumbnail_url: thumb('dragon-gs5'),
    preview_images: previews('dragon-gs5'),
  },

  // ── 6 ─ 2D / Sprite ───────────────────────────────────────────────────────
  {
    title: 'Space Shooter Sprite Sheet Pack',
    slug: 'space-shooter-sprite-pack-v2',
    short_description: '200+ animated sprites for 2D space shooter games',
    description:
      'Complete sprite sheet collection for a top-down space shooter game. ' +
      'Ships (20 designs), asteroids, explosions, bullets, power-ups, and UI icons — ' +
      'all in 2× resolution (512px base). Exported as individual PNGs and ' +
      'packed TexturePacker atlases with JSON metadata.',
    price: 35000,
    discount_percentage: 0,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['2D', 'Sprite', 'Space', 'Shooter', 'Atlas', 'Top-Down'],
    file_format: ['PNG', 'JSON'],
    file_size: '22.5 MB',
    game_engine_support: ['Unity', 'Godot', 'Phaser'],
    license_type: 'personal',
    polygon_count: null,
    texture_resolution: '2K',
    animated: true,
    rigged: false,
    thumbnail_url: thumb('space-gs6'),
    preview_images: previews('space-gs6'),
  },

  // ── 7 ─ Horror Environment ────────────────────────────────────────────────
  {
    title: 'Horror Mansion Interior Pack',
    slug: 'horror-mansion-interior-pack',
    short_description: 'Atmospheric horror mansion props with creep gore details',
    description:
      'Over 150 horror-themed interior props: cracked walls, bloody furniture, ' +
      'cobweb-covered chandeliers, broken mirror shards, decayed curtains, ' +
      'and dismembered mannequins. All assets use a shared 2K atlas for draw-call ' +
      'efficiency. Includes a ready-made Unity demo room.',
    price: 65000,
    discount_percentage: 0,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['Horror', 'Interior', 'Props', 'Atmospheric', 'Gothic'],
    file_format: ['FBX', 'OBJ'],
    file_size: '210.4 MB',
    game_engine_support: ['Unity', 'Unreal Engine'],
    license_type: 'commercial',
    polygon_count: 50000,
    texture_resolution: '2K',
    animated: false,
    rigged: false,
    thumbnail_url: thumb('horror-gs7'),
    preview_images: previews('horror-gs7'),
  },

  // ── 8 ─ Tropical Environment ──────────────────────────────────────────────
  {
    title: 'Tropical Island Environment',
    slug: 'tropical-island-environment',
    short_description: 'Lush tropical island biome with ocean, palms and ruins',
    description:
      'A complete tropical paradise environment: 40 palm/fern/flower models, ' +
      'modular cliff/rock formations, ancient stone ruins, and ' +
      'a tiling ocean shader with wave displacement and foam. ' +
      'Performance-optimised for open-world streaming. Includes a 10km² demo island.',
    price: 129000,
    discount_percentage: 10,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['Environment', 'Tropical', 'Island', 'Ocean', 'Nature', 'Open World'],
    file_format: ['FBX', 'OBJ'],
    file_size: '850.0 MB',
    game_engine_support: ['Unreal Engine', 'Unity'],
    license_type: 'commercial',
    polygon_count: 180000,
    texture_resolution: '4K',
    animated: false,
    rigged: false,
    thumbnail_url: thumb('tropical-gs8'),
    preview_images: previews('tropical-gs8'),
  },

  // ── 9 ─ Mech Character ────────────────────────────────────────────────────
  {
    title: 'Mech Warrior Robot – Full Rig',
    slug: 'mech-warrior-robot-full-rig',
    short_description: 'AAA mech robot with dual-arm weapon rigs and combat animations',
    description:
      'High-detail mech warrior robot with 40k triangles, physically-based metal materials, ' +
      'and hydraulic bone rig. Animation set: idle, walk, run, attack (gun + melee), ' +
      'take-damage, death, boosting. Modular weapon sockets allow easy weapon swaps.',
    price: 185000,
    discount_percentage: 5,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['Mech', 'Robot', 'Sci-Fi', 'Rigged', 'Animated', 'Character'],
    file_format: ['FBX', 'BLEND'],
    file_size: '290.7 MB',
    game_engine_support: ['Unity', 'Unreal Engine'],
    license_type: 'commercial',
    polygon_count: 40000,
    texture_resolution: '4K',
    animated: true,
    rigged: true,
    thumbnail_url: thumb('mech-gs9'),
    preview_images: previews('mech-gs9'),
  },

  // ── 10 ─ Anime Character ──────────────────────────────────────────────────
  {
    title: 'Anime School Character Pack',
    slug: 'anime-school-character-pack',
    short_description: '4 stylized anime characters with school uniforms and facial rigs',
    description:
      'Four anime-style characters (2 female, 2 male) in school uniforms ' +
      'with toon-shaded PBR textures and full facial rig for lipsync. ' +
      'Includes idle, walk, run, jump animations and 10 emote animations each. ' +
      'Ready for VRChat, Unity VRM export, and Unreal Metahuman pipeline.',
    price: 95000,
    discount_percentage: 0,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['Anime', 'Character', 'Stylized', 'Toon', 'School', 'VRM'],
    file_format: ['FBX', 'VRM', 'BLEND'],
    file_size: '175.3 MB',
    game_engine_support: ['Unity', 'Unreal Engine'],
    license_type: 'commercial',
    polygon_count: 20000,
    texture_resolution: '2K',
    animated: true,
    rigged: true,
    thumbnail_url: thumb('anime-gs10'),
    preview_images: previews('anime-gs10'),
  },

  // ── 11 ─ Shader Pack ──────────────────────────────────────────────────────
  {
    title: 'Toon Shader Kit – Unity URP',
    slug: 'toon-shader-kit-unity-urp',
    short_description: 'Complete cel-shading kit with outline, hatching and rim light',
    description:
      'A production-ready toon shader library for Unity URP. ' +
      'Includes: multi-level cel shading, ink outline (screen-space + geometry), ' +
      'cross-hatching pass, specular highlight control, and rim light. ' +
      '12 preset character and environment materials included.',
    price: 45000,
    discount_percentage: 0,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['Shader', 'Toon', 'URP', 'Cel-Shading', 'Outline', 'Stylized'],
    file_format: ['UNITYPACKAGE'],
    file_size: '18.2 MB',
    game_engine_support: ['Unity'],
    license_type: 'commercial',
    polygon_count: null,
    texture_resolution: '2K',
    animated: false,
    rigged: false,
    thumbnail_url: thumb('toon-gs11'),
    preview_images: previews('toon-gs11'),
  },

  // ── 12 ─ PBR Texture Library ──────────────────────────────────────────────
  {
    title: 'PBR Texture Mega Library – 100 Materials',
    slug: 'pbr-texture-mega-library-100',
    short_description: '100 tileable PBR materials: rock, wood, metal, concrete, fabric',
    description:
      '100 high-quality tileable PBR materials organised into 5 categories: ' +
      'rock & stone (25), wood (20), metal (20), concrete & plaster (20), fabric (15). ' +
      'All materials include: albedo, normal, roughness, metallic, AO and height maps. ' +
      'Delivered in 2K and 4K resolutions.',
    price: 59000,
    discount_percentage: 25,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['Texture', 'PBR', 'Material', 'Tileable', 'Rock', 'Metal', 'Wood'],
    file_format: ['PNG', 'EXR'],
    file_size: '3400.0 MB',
    game_engine_support: ['Unity', 'Unreal Engine', 'Godot', 'Blender'],
    license_type: 'commercial',
    polygon_count: null,
    texture_resolution: '4K',
    animated: false,
    rigged: false,
    thumbnail_url: thumb('texture-gs12'),
    preview_images: previews('texture-gs12'),
  },

  // ── 13 ─ Free Pixel Art ───────────────────────────────────────────────────
  {
    title: 'Pixel Art Town Tileset – Free Edition',
    slug: 'pixel-art-town-tileset-free',
    short_description: 'Free 16×16 pixel art town tiles: ground, buildings, NPCs',
    description:
      '120 unique 16×16 pixel art tiles covering a full RPG town: ' +
      'grass, dirt, stone paths, house facades, rooftops, fences, trees. ' +
      'Bonus: 8 NPC character sprites with 4-direction walk cycles. ' +
      'Perfect for GameBoy-style or classic RPG Maker games.',
    price: 0,
    discount_percentage: 0,
    is_free: true,
    featured: false,
    status: 'published',
    tags: ['Pixel Art', '2D', 'Tileset', 'RPG', 'Town', 'Free'],
    file_format: ['PNG', 'JSON'],
    file_size: '3.8 MB',
    game_engine_support: ['Godot', 'Unity', 'RPG Maker', 'Phaser'],
    license_type: 'free',
    polygon_count: null,
    texture_resolution: 'N/A',
    animated: true,
    rigged: false,
    thumbnail_url: thumb('pixel-gs13'),
    preview_images: previews('pixel-gs13'),
  },

  // ── 14 ─ Audio ────────────────────────────────────────────────────────────
  {
    title: 'Synthwave Music Pack – 30 Tracks',
    slug: 'synthwave-music-pack-30-tracks',
    short_description: '30 royalty-free synthwave loops for retro sci-fi games',
    description:
      'Thirty seamlessly looping synthwave tracks ranging from chill retrowave ' +
      'to high-energy combat sequences. Includes full-length versions (2–4 min) ' +
      'and short loop variants (30–60s). Delivered in lossless WAV and OGG.',
    price: 49000,
    discount_percentage: 0,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['Audio', 'Music', 'Synthwave', 'Retro', 'Loop', 'Sci-Fi'],
    file_format: ['WAV', 'OGG'],
    file_size: '620.0 MB',
    game_engine_support: ['Unity', 'Unreal Engine', 'Godot'],
    license_type: 'commercial',
    polygon_count: null,
    texture_resolution: 'N/A',
    animated: false,
    rigged: false,
    thumbnail_url: thumb('synth-gs14'),
    preview_images: previews('synth-gs14'),
  },

  // ── 15 ─ VFX ──────────────────────────────────────────────────────────────
  {
    title: 'Magic Spell VFX Bundle – 50 Effects',
    slug: 'magic-spell-vfx-bundle-50',
    short_description: '50 magic particle effects: fire, ice, lightning, healing, dark',
    description:
      '50 ready-to-use magic VFX effects organised by element: ' +
      'Fire (10), Ice (10), Lightning (10), Nature/Healing (10), Dark/Shadow (10). ' +
      'Works with Unity Particle System (Shuriken) and Unreal Niagara. ' +
      'Screen-space and world-space variants included.',
    price: 75000,
    discount_percentage: 0,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['VFX', 'Magic', 'Particles', 'Fire', 'Ice', 'Lightning', 'Spell'],
    file_format: ['UNITYPACKAGE', 'UASSET'],
    file_size: '115.6 MB',
    game_engine_support: ['Unity', 'Unreal Engine'],
    license_type: 'commercial',
    polygon_count: null,
    texture_resolution: '1K',
    animated: true,
    rigged: false,
    thumbnail_url: thumb('vfx-gs15'),
    preview_images: previews('vfx-gs15'),
  },

  // ── 16 ─ Dungeon Builder ──────────────────────────────────────────────────
  {
    title: 'Isometric Dungeon Builder Kit',
    slug: 'isometric-dungeon-builder-kit',
    short_description: 'Grid-snapping isometric dungeon tiles and props for strategy RPGs',
    description:
      'A comprehensive isometric dungeon tileset with 200+ modular pieces: ' +
      'floor tiles (stone, wood, lava, ice), walls, pillars, doors, traps, ' +
      'chest/crates, torches, and enemy spawnpoint markers. ' +
      'Designed for grid-based strategy RPGs and roguelikes.',
    price: 55000,
    discount_percentage: 10,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['Isometric', 'Dungeon', 'Tileset', 'Modular', 'Strategy', 'Roguelike'],
    file_format: ['FBX', 'OBJ', 'PNG'],
    file_size: '85.4 MB',
    game_engine_support: ['Unity', 'Godot'],
    license_type: 'personal',
    polygon_count: 5000,
    texture_resolution: '1K',
    animated: false,
    rigged: false,
    thumbnail_url: thumb('dungeon-gs16'),
    preview_images: previews('dungeon-gs16'),
  },

  // ── 17 ─ Desert Landscape ─────────────────────────────────────────────────
  {
    title: 'Photorealistic Desert Landscape',
    slug: 'photorealistic-desert-landscape',
    short_description: 'Photoscan-based desert landscape with dunes, rock formations and ruins',
    description:
      'A vast (4 km²) photorealistic desert environment built from drone photoscans. ' +
      'Includes 60 unique rock/dune meshes, sandstorm particle system, ' +
      'ancient stone ruins, desert foliage (cactus, dry bushes), and ' +
      'a procedural sand shader with wind-driven ripple animations.',
    price: 159000,
    discount_percentage: 0,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['Environment', 'Desert', 'Photorealistic', 'Landscape', 'Ruins', 'Open World'],
    file_format: ['FBX', 'OBJ'],
    file_size: '1200.0 MB',
    game_engine_support: ['Unreal Engine', 'Unity'],
    license_type: 'commercial',
    polygon_count: 600000,
    texture_resolution: '8K',
    animated: false,
    rigged: false,
    thumbnail_url: thumb('desert-gs17'),
    preview_images: previews('desert-gs17'),
  },

  // ── 18 ─ UI/HUD ───────────────────────────────────────────────────────────
  {
    title: 'Futuristic HUD & UI Elements Pack',
    slug: 'futuristic-hud-ui-elements-pack',
    short_description: '400+ sci-fi HUD elements, icons, and animated panels',
    description:
      '400+ futuristic HUD/UI assets in a sleek sci-fi style with blue/cyan glow theme. ' +
      'Includes: health/stamina bars, radar/minimap frames, ammo counters, ' +
      'target reticles, notification panels, inventory grids, skill trees, ' +
      'and 150 icon sprites. Layered PSD + Unity UI prefabs included.',
    price: 55000,
    discount_percentage: 20,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['UI', 'HUD', 'Sci-Fi', 'Futuristic', 'Icons', 'Interface'],
    file_format: ['PNG', 'PSD', 'UNITYPACKAGE'],
    file_size: '72.1 MB',
    game_engine_support: ['Unity'],
    license_type: 'commercial',
    polygon_count: null,
    texture_resolution: '2K',
    animated: true,
    rigged: false,
    thumbnail_url: thumb('hud-gs18'),
    preview_images: previews('hud-gs18'),
  },

  // ── 19 ─ Zombie Pack ──────────────────────────────────────────────────────
  {
    title: 'Zombie Crowd Pack – 8 Variants',
    slug: 'zombie-crowd-pack-8-variants',
    short_description: '8 zombie character variants with GPU instancing for large crowds',
    description:
      'Eight unique zombie characters (civilian, soldier, nurse, construction worker, ' +
      'school kid, police officer, office worker, chef) with GPU-instanced crowd simulation. ' +
      'Animation set: shamble walk, sprint, attack, death (×3 variants), getting-up. ' +
      'Includes decal blood splatter system and procedural ragdoll setup.',
    price: 109000,
    discount_percentage: 0,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['Zombie', 'Character', 'Crowd', 'Animated', 'Horror', 'GPU Instancing'],
    file_format: ['FBX', 'BLEND'],
    file_size: '380.0 MB',
    game_engine_support: ['Unity', 'Unreal Engine'],
    license_type: 'commercial',
    polygon_count: 12000,
    texture_resolution: '2K',
    animated: true,
    rigged: true,
    thumbnail_url: thumb('zombie-gs19'),
    preview_images: previews('zombie-gs19'),
  },

  // ── 20 ─ HDRI Sky ─────────────────────────────────────────────────────────
  {
    title: 'Sky & Cloud HDRI Pack – 40 Skies',
    slug: 'sky-cloud-hdri-pack-40',
    short_description: '40 real-captured HDRI sky maps: dawn, noon, dusk, night, storm',
    description:
      '40 high-dynamic-range sky captures (16K EXR + 8K JPEG fallback) taken at real locations. ' +
      'Categories: golden hour (8), midday (8), overcast (8), stormy (8), night/starry (8). ' +
      'Each HDRI includes a matching light rig preset for Unity HDRP, URP, and Unreal Engine.',
    price: 39000,
    discount_percentage: 0,
    is_free: false,
    featured: false,
    status: 'published',
    tags: ['HDRI', 'Sky', 'Skybox', 'Lighting', 'Cloud', 'Environment'],
    file_format: ['EXR', 'HDR', 'JPEG'],
    file_size: '4800.0 MB',
    game_engine_support: ['Unity', 'Unreal Engine', 'Blender'],
    license_type: 'commercial',
    polygon_count: null,
    texture_resolution: '8K',
    animated: false,
    rigged: false,
    thumbnail_url: thumb('sky-gs20'),
    preview_images: previews('sky-gs20'),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function post<T>(url: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${url} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(url: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${url} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function seed() {
  console.log('🚀 Starting seed-20-assets via REST API…\n');

  // ── 1. Login as Admin ────────────────────────────────────────────────────
  console.log('🔑 Logging in as Admin…');
  let token: string;
  let adminId: string;
  try {
    const loginRes = await post<{ token: string; _id: string }>(
      `${API_BASE}/users/login`,
      { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    );
    token = loginRes.token;
    adminId = loginRes._id;
    console.log(`   ✅ Logged in — adminId: ${adminId}\n`);
  } catch (err: any) {
    console.error('❌ Login failed:', err.message);
    console.error('   Make sure the backend is running and Admin account exists (npm run seed:admin)');
    process.exit(1);
  }

  // ── 2. Fetch categories ──────────────────────────────────────────────────
  console.log('📂 Fetching categories…');
  let categories: Array<{ _id: string; name: string }>;
  try {
    categories = await get<Array<{ _id: string; name: string }>>(
      `${API_BASE}/categories`,
      token,
    );
    if (!categories.length) throw new Error('No categories found');
    console.log(`   ✅ Found ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}: ${categories.map(c => c.name).join(', ')}\n`);
  } catch (err: any) {
    console.error('❌ Failed to fetch categories:', err.message);
    console.error('   Run seed:categories first.');
    process.exit(1);
  }

  // ── 3. Create each asset via API ─────────────────────────────────────────
  console.log('📦 Creating 20 assets…\n');
  let created = 0;
  let skipped = 0;
  let failed  = 0;

  for (let i = 0; i < ASSETS.length; i++) {
    const def = ASSETS[i];
    // Cycle through categories
    const cat = categories[i % categories.length];

    const payload = {
      ...def,
      categoryId: cat._id,
      creatorId: adminId,
    };

    try {
      const asset = await post<{ _id: string; title: string }>(
        `${API_BASE}/assets`,
        payload,
        token,
      );
      const featuredMark = (def as any).featured ? ' ⭐' : '';
      console.log(`   ✅ [${String(i + 1).padStart(2, '0')}] ${def.title}${featuredMark}`);
      console.log(`         id: ${asset._id}  category: ${cat.name}`);
      created++;
    } catch (err: any) {
      // Duplicate slug → skip gracefully
      if (err.message.includes('409') || err.message.toLowerCase().includes('duplicate') || err.message.toLowerCase().includes('slug')) {
        console.log(`   ⏭  [${String(i + 1).padStart(2, '0')}] SKIP (already exists): ${def.title}`);
        skipped++;
      } else {
        console.error(`   ❌ [${String(i + 1).padStart(2, '0')}] FAILED: ${def.title}`);
        console.error(`         ${err.message}`);
        failed++;
      }
    }

    // Small delay to avoid hammering the server / Qdrant
    await new Promise(r => setTimeout(r, 200));
  }

  // ── 4. Summary ───────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🎉 Done!`);
  console.log(`   Created : ${created}`);
  console.log(`   Skipped : ${skipped}`);
  console.log(`   Failed  : ${failed}`);
  if (created > 0) {
    console.log('\n💡 Each created asset was automatically indexed in Qdrant via indexAsset().');
    console.log('   Text search and image search should work immediately.');
  }
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
