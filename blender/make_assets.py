"""
Blender (bpy 5.3) asset build for the portfolio.
Outputs (into the project's src/assets/):
  env-pieces.glb   4 architectural slab variants (bevelled, chipped, stepped, split) — unit size
  core-shard.glb   one crystalline shard for the story core
  surface.jpg      2048² seamless packed surface map: R = height, G = roughness, B = tone
Run:  python3 make_assets.py <out_dir>
"""
import bpy, bmesh, math, random, sys, os
import numpy as np
from mathutils import Vector, Matrix

OUT = sys.argv[-1] if len(sys.argv) > 1 else '.'
os.makedirs(OUT, exist_ok=True)
random.seed(7)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

# ------------------------------------------------------------------
# 1) Seamless surface texture, baked in Cycles
# ------------------------------------------------------------------
def build_texture(res=2048):
    reset()
    scn = bpy.context.scene
    scn.render.engine = 'CYCLES'
    scn.cycles.device = 'CPU'
    scn.cycles.samples = 1
    bpy.ops.mesh.primitive_plane_add(size=2)
    plane = bpy.context.active_object
    mat = bpy.data.materials.new('surface')
    plane.data.materials.append(mat)
    nt = mat.node_tree
    nt.nodes.clear()
    N, L = nt.nodes, nt.links
    out = N.new('ShaderNodeOutputMaterial')
    emit = N.new('ShaderNodeEmission')
    L.new(emit.outputs[0], out.inputs['Surface'])

    # torus mapping of UV -> 4D so every noise tiles seamlessly
    tc = N.new('ShaderNodeTexCoord')
    sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['UV'], sep.inputs[0])
    def trig(src, fn, R):
        m1 = N.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'; m1.inputs[1].default_value = 2 * math.pi
        L.new(src, m1.inputs[0])
        m2 = N.new('ShaderNodeMath'); m2.operation = fn; L.new(m1.outputs[0], m2.inputs[0])
        m3 = N.new('ShaderNodeMath'); m3.operation = 'MULTIPLY'; m3.inputs[1].default_value = R
        L.new(m2.outputs[0], m3.inputs[0])
        return m3.outputs[0]
    def torus(R):
        cu, su = trig(sep.outputs['X'], 'COSINE', R), trig(sep.outputs['X'], 'SINE', R)
        cv, sv = trig(sep.outputs['Y'], 'COSINE', R), trig(sep.outputs['Y'], 'SINE', R)
        cmb = N.new('ShaderNodeCombineXYZ')
        L.new(cu, cmb.inputs[0]); L.new(su, cmb.inputs[1]); L.new(cv, cmb.inputs[2])
        return cmb.outputs[0], sv
    def noise(R, scale, detail, rough=0.55, distortion=0.0):
        v, w = torus(R)
        n = N.new('ShaderNodeTexNoise'); n.noise_dimensions = '4D'
        n.inputs['Scale'].default_value = scale
        n.inputs['Detail'].default_value = detail
        n.inputs['Roughness'].default_value = rough
        n.inputs['Distortion'].default_value = distortion
        L.new(v, n.inputs['Vector']); L.new(w, n.inputs['W'])
        return n.outputs['Fac']
    def voronoi_edge(R, scale):
        v, w = torus(R)
        n = N.new('ShaderNodeTexVoronoi'); n.voronoi_dimensions = '4D'; n.feature = 'DISTANCE_TO_EDGE'
        n.inputs['Scale'].default_value = scale
        L.new(v, n.inputs['Vector']); L.new(w, n.inputs['W'])
        return n.outputs['Distance']
    def math_op(op, a, b=None, val=None):
        m = N.new('ShaderNodeMath'); m.operation = op
        L.new(a, m.inputs[0]) if not isinstance(a, float) else m.inputs[0].__setattr__('default_value', a)
        if b is not None: L.new(b, m.inputs[1])
        elif val is not None: m.inputs[1].default_value = val
        return m.outputs[0]

    big = noise(0.35, 2.0, 3)
    grain = noise(1.2, 9.0, 10, 0.62)
    streak = noise(0.8, 4.0, 6, 0.5, distortion=1.4)
    edges = voronoi_edge(0.5, 2.6)
    # thin fracture seams from voronoi cell edges
    seam_r = N.new('ShaderNodeMapRange'); seam_r.inputs['From Min'].default_value = 0.0
    seam_r.inputs['From Max'].default_value = 0.035; seam_r.inputs['To Min'].default_value = 1.0
    seam_r.inputs['To Max'].default_value = 0.0; seam_r.clamp = True
    L.new(edges, seam_r.inputs['Value']); seam = seam_r.outputs['Result']

    height = math_op('ADD', math_op('MULTIPLY', big, val=0.5), math_op('MULTIPLY', grain, val=0.35))
    height = math_op('ADD', height, math_op('MULTIPLY', streak, val=0.15))
    height = math_op('SUBTRACT', height, math_op('MULTIPLY', seam, val=0.45))
    rough = math_op('ADD', math_op('MULTIPLY', grain, val=0.45), math_op('MULTIPLY', seam, val=0.35))
    rough = math_op('ADD', rough, math_op('MULTIPLY', big, val=0.2))
    tone = math_op('ADD', math_op('MULTIPLY', big, val=0.6), math_op('MULTIPLY', streak, val=0.4))
    tone = math_op('SUBTRACT', tone, math_op('MULTIPLY', seam, val=0.5))

    channels = {}
    for name, sock in (('height', height), ('rough', rough), ('tone', tone)):
        for l in list(emit.inputs['Color'].links): nt.links.remove(l)
        cmb = N.new('ShaderNodeCombineColor')
        for i in range(3): L.new(sock, cmb.inputs[i])
        L.new(cmb.outputs[0], emit.inputs['Color'])
        img = bpy.data.images.new(name, res, res, float_buffer=True, is_data=True)
        tnode = N.new('ShaderNodeTexImage'); tnode.image = img
        N.active = tnode; tnode.select = True
        bpy.context.view_layer.objects.active = plane; plane.select_set(True)
        bpy.ops.object.bake(type='EMIT')
        px = np.empty(res * res * 4, dtype=np.float32); img.pixels.foreach_get(px)
        channels[name] = px.reshape(res, res, 4)[::-1, :, 0]
        N.remove(tnode)
        print('baked', name)

    def norm(a, lo=1, hi=99):
        a0, a1 = np.percentile(a, lo), np.percentile(a, hi)
        return np.clip((a - a0) / (a1 - a0 + 1e-6), 0, 1)
    rgb = np.stack([norm(channels['height']), norm(channels['rough']), norm(channels['tone'])], -1)
    from PIL import Image
    Image.fromarray((rgb * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, 'surface.jpg'), quality=90, optimize=True)
    print('surface.jpg written')

# ------------------------------------------------------------------
# 2) Architectural pieces
# ------------------------------------------------------------------
def cube(name):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object; o.name = name
    return o

def boolean_cut(target, cutter):
    m = target.modifiers.new('cut', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = cutter; m.solver = 'EXACT'
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

def finish(o, bevel=0.035, segments=4):
    bv = o.modifiers.new('bevel', 'BEVEL'); bv.width = bevel; bv.segments = segments; bv.profile = 0.7
    bv.limit_method = 'ANGLE'; bv.harden_normals = True
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=bv.name)
    wn = o.modifiers.new('wn', 'WEIGHTED_NORMAL'); wn.keep_sharp = True
    bpy.ops.object.modifier_apply(modifier=wn.name)
    bpy.ops.object.shade_smooth()
    # normalise to a unit bounding box centred on the origin
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
    mx = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    size, ctr = mx - mn, (mx + mn) / 2
    o.data.transform(Matrix.Translation(-ctr))
    o.data.transform(Matrix.Diagonal((1 / size.x, 1 / size.y, 1 / size.z, 1)))
    o.data.update()

def build_pieces():
    reset()
    a = cube('slab_bevel'); finish(a)

    b = cube('slab_chipped')
    for corner in ((0.5, 0.5, 0.5), (-0.5, -0.5, 0.5), (0.5, -0.5, -0.5)):
        c = cube('chip'); c.scale = (0.32, 0.32, 0.32)
        c.location = corner; c.rotation_euler = (random.random() * 2, random.random() * 2, random.random() * 2)
        boolean_cut(b, c)
    finish(b, 0.03)

    s = cube('slab_stepped')
    c = cube('step'); c.scale = (1.2, 0.42, 0.42); c.location = (0, 0.42, 0.42); boolean_cut(s, c)
    c = cube('groove'); c.scale = (1.2, 0.05, 0.05); c.location = (0, -0.5, -0.1); boolean_cut(s, c)
    finish(s, 0.03)

    d = cube('slab_split')
    c = cube('slice'); c.scale = (1.5, 1.5, 1.5); c.rotation_euler = (0.5, 0.0, 0.7); c.location = (0.95, 0.0, 0.85); boolean_cut(d, c)
    finish(d, 0.03)

    for o in bpy.data.objects: o.select_set(o.name.startswith('slab_'))
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'env-pieces.glb'), use_selection=True,
                              export_format='GLB', export_apply=True, export_normals=True,
                              export_texcoords=False, export_materials='NONE', export_yup=True)
    print('env-pieces.glb written', [o.name for o in bpy.data.objects])

def build_shard():
    reset()
    pts = []
    for i in range(14):
        th, ph = random.random() * math.tau, math.acos(2 * random.random() - 1)
        r = 0.75 + random.random() * 0.25
        pts.append(Vector((math.sin(ph) * math.cos(th) * r * 1.0, math.cos(ph) * r * 0.45, math.sin(ph) * math.sin(th) * r * 0.8)))
    me = bpy.data.meshes.new('shard'); bm = bmesh.new()
    for p in pts: bm.verts.new(p)
    bmesh.ops.convex_hull(bm, input=bm.verts); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('core_shard', me); bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bv = o.modifiers.new('bevel', 'BEVEL'); bv.width = 0.03; bv.segments = 2; bv.limit_method = 'ANGLE'; bv.harden_normals = True
    bpy.ops.object.modifier_apply(modifier=bv.name)
    # fit into [-1, 1]
    bb = [Vector(c) for c in o.bound_box]
    mx = max(max(abs(v.x), abs(v.y), abs(v.z)) for v in bb)
    o.data.transform(Matrix.Scale(1 / mx, 4))
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'core-shard.glb'), use_selection=True,
                              export_format='GLB', export_apply=True, export_normals=True,
                              export_texcoords=False, export_materials='NONE')
    print('core-shard.glb written')

build_pieces()
build_shard()
build_texture(2048)
