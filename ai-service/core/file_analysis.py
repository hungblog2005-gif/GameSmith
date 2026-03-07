"""
Rule-based file structure analyzer.

Maps filenames / extensions from an uploaded asset package to tag confidence
boosts that are added on top of the CLIP visual/text scores.

Usage:
    from core.file_analysis import analyze_file_structure
    boosts = analyze_file_structure(["Character_LOD0.fbx", "_NRM.png", "walk.anim"])
    # → {"LOD": 0.35, "PBR": 0.35, "Animated": 0.30}
"""

import re
from pathlib import PurePosixPath


def analyze_file_structure(file_names: list[str]) -> dict[str, float]:
    """
    Returns {tag_name: boost_score (0.0–1.0)} inferred from the file list.
    Boosts are capped at 1.0 and additive with CLIP cosine scores.
    """
    if not file_names:
        return {}

    boosts: dict[str, float] = {}
    names_lower = [n.lower().replace("\\", "/") for n in file_names]
    exts: set[str] = {PurePosixPath(n).suffix for n in names_lower}
    all_text = " ".join(names_lower)

    # ── helpers ──────────────────────────────────────────────────────────────

    def has_ext(*ext_list: str) -> bool:
        return bool(exts & set(ext_list))

    def has(*patterns: str) -> bool:
        return any(re.search(p, all_text) for p in patterns)

    def boost(tag: str, amount: float) -> None:
        boosts[tag] = min(boosts.get(tag, 0.0) + amount, 1.0)

    # ── Features ─────────────────────────────────────────────────────────────

    # PBR — presence of standard PBR map suffixes
    if has(r'_nrm\b', r'_normal\b', r'_roughness', r'_rgh\b', r'_metalness',
           r'_metal\b', r'_mtl\b', r'_orm\b', r'\bpbr\b', r'_basecolor',
           r'_albedo', r'_ao\b', r'_ambientocclusion'):
        boost("PBR", 0.35)

    # LOD — level-of-detail mesh variants
    if has(r'_lod\d', r'lod0', r'lod1', r'lod2', r'lod3', r'\blod\b'):
        boost("LOD", 0.35)

    # Animated — animation clip files or names
    if has(r'_anim', r'\.anim$', r'/anim/', r'animations/', r'\bwalk\b',
           r'\brun\b', r'\bidle\b', r'\battack\b', r'\bdeath\b', r'\bjump\b',
           r'\bsprint\b', r'\bclimb\b') or has_ext('.anim', '.bvh', '.fbx'):
        # .fbx alone is ambiguous; require animation keyword when only .fbx present
        if has(r'_anim', r'\.anim$', r'/anim/', r'\bwalk\b', r'\brun\b',
               r'\bidle\b', r'\battack\b'):
            boost("Animated", 0.30)
        elif has_ext('.bvh'):
            boost("Animated", 0.35)

    # Rigged — skeleton / rig files
    if has(r'skeleton', r'_bones\b', r'_rig\b', r'\barmature\b', r'_skin\b',
           r'_skinned', r'_weights\b', r'skin_mesh', r'rig_export'):
        boost("Rigged", 0.35)

    # Modular — kit / snap-together pieces
    if has(r'\bmodular\b', r'\bkit\b', r'_part\d', r'_piece\d', r'\btileset\b',
           r'_snap\b', r'_module\b', r'_segment\b'):
        boost("Modular", 0.30)

    # Tileable — seamless / tiling textures
    if has(r'\btileable\b', r'\bseamless\b', r'_tile\b', r'\btiling\b',
           r'\brepeating\b', r'_seamless'):
        boost("Tileable", 0.35)

    # Blueprint — Unreal blueprint assets
    if has_ext('.uasset') and has(r'/blueprints?/', r'\bbp_', r'_bp\.', r'_blueprint'):
        boost("Blueprint", 0.40)
    elif has(r'/blueprints?/', r'\bbp_[a-z]', r'^bp_'):
        boost("Blueprint", 0.35)

    # IK Ready
    if has(r'\bik\b', r'_ik_', r'^ik_', r'_ik\.', r'ik_rig', r'inverse_kinemat',
           r'ik_control', r'_ikchain'):
        boost("IK Ready", 0.35)

    # Morph Targets / Blend Shapes
    if has(r'\bmorph\b', r'blendshape', r'shape_key', r'_bs_', r'_shapekey',
           r'facial_\w+_bs', r'_morph_'):
        boost("Morph Targets", 0.35)

    # Physics
    if has(r'\bphysics\b', r'\bragdoll\b', r'\bcloth\b', r'_phys\b',
           r'rigid_body', r'\bfluid\b', r'physx', r'_collision\b'):
        boost("Physics", 0.30)

    # Transparent / alpha
    if has(r'_alpha\b', r'_transparent', r'\bglass\b', r'_opacity\b',
           r'_mask\b', r'_cutout\b'):
        boost("Transparent", 0.25)

    # Emissive / glow
    if has(r'\bemissive\b', r'_glow\b', r'\bneon\b', r'_emit\b',
           r'_light_source', r'_emis\b'):
        boost("Emissive", 0.25)

    # Subsurface Scattering
    if has(r'\bsubsurface\b', r'\bsss\b', r'_sss_', r'translucen',
           r'skin_sss', r'_subsurface'):
        boost("Subsurface", 0.30)

    # 4K Textures
    if has(r'4096', r'_4k\b', r'\b4k_', r'\b4k\b', r'4k\.'):
        boost("4K Textures", 0.40)

    # ── Technical ────────────────────────────────────────────────────────────

    # Unreal Engine 5
    if has_ext('.uasset', '.umap', '.uplugin', '.uproject') or \
       has(r'\bunreal\b', r'\bue5\b', r'\bue4\b', r'/content/', r'unrealengine'):
        boost("Unreal Engine 5", 0.40)

    # Nanite
    if has(r'\bnanite\b'):
        boost("Nanite", 0.45)

    # Lumen
    if has(r'\blumen\b'):
        boost("Lumen", 0.45)

    # Unity URP
    if has_ext('.unitypackage', '.meta') or has(r'\burp\b', r'unity.*urp',
                                                 r'_urp\b', r'universalrp'):
        boost("Unity URP", 0.35)

    # Unity HDRP
    if has(r'\bhdrp\b', r'unity.*hdrp', r'_hdrp\b', r'highdefinitionrp'):
        boost("Unity HDRP", 0.35)

    # Godot
    if has_ext('.tscn', '.tres', '.gd', '.gdshader', '.import') or \
       has(r'\bgodot\b'):
        boost("Godot", 0.40)

    # WebGL
    if has_ext('.gltf', '.glb') or has(r'\bwebgl\b', r'threejs', r'babylonjs',
                                        r'three\.js'):
        boost("WebGL", 0.35)

    # Mobile Ready
    if has(r'\bmobile\b', r'_mobile\b', r'mobile_ready', r'lowpoly_mobile',
           r'_lowcost\b'):
        boost("Mobile Ready", 0.30)

    # VR Ready
    if has_ext('.vrm') or has(r'\bvr\b', r'_vr_', r'\bvrready\b', r'\boculus\b',
                               r'\bopenxr\b', r'\bxr_', r'_vr\.', r'vr_ready'):
        boost("VR Ready", 0.35)

    # AR Ready
    if has_ext('.reality', '.usdz') or has(r'\barkit\b', r'\barcore\b',
                                            r'augmented_reality', r'_ar_model'):
        boost("AR Ready", 0.35)

    # Procedural
    if has(r'\bprocedural\b', r'\bhoudini\b', r'nodetree', r'_proc_',
           r'\.hip$', r'\.hda$'):
        boost("Procedural", 0.35)

    return boosts
