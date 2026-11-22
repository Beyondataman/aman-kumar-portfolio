import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import piecesUrl from '../assets/env-pieces.glb?url'
import shardUrl from '../assets/core-shard.glb?url'
import surfaceUrl from '../assets/surface.jpg'
import { kick } from '../lib/live'

/* Blender-made assets (see /blender/make_assets.py). Loaded once, shared by every world. */

const loader = new GLTFLoader()
const cache = {}

function meshesByName(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => {
      const out = {}
      gltf.scene.traverse((o) => { if (o.isMesh) out[o.name] = o.geometry })
      resolve(out)
    }, undefined, reject)
  })
}

/** { slab_bevel, slab_chipped, slab_stepped, slab_split } — unit-size bevelled architectural pieces */
export const loadPieces = () => (cache.pieces ??= meshesByName(piecesUrl))
/** crystalline shard (fits in [-1, 1]) */
export const loadShard = () => (cache.shard ??= meshesByName(shardUrl).then((m) => Object.values(m)[0]))

let surfaceTex = null
/** 2048² seamless packed map baked in Blender: R height, G roughness, B tone */
export function surfaceTexture() {
  if (!surfaceTex) {
    surfaceTex = new THREE.TextureLoader().load(surfaceUrl, () => kick(400))
    surfaceTex.wrapS = surfaceTex.wrapT = THREE.RepeatWrapping
    surfaceTex.colorSpace = THREE.NoColorSpace
    surfaceTex.anisotropy = 8
  }
  return surfaceTex
}

/**
 * Patch a MeshStandard/Physical material with triplanar sampling of the baked surface map:
 * height → bump detail, G → roughness variation, B → tone variation.
 * Coordinates use the object's real (scaled) size, so detail never stretches on
 * non-uniformly scaled instances.
 */
export function applySurface(material, { scale = 0.8, bump = 0.03, roughMin = 0.3, roughMax = 0.7, tone = 0.35, bias = 1.5, key = 'a' } = {}) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSurf = { value: surfaceTexture() }
    shader.uniforms.uSurfScale = { value: scale }
    shader.uniforms.uSurfBump = { value: bump }
    shader.uniforms.uRough = { value: new THREE.Vector2(roughMin, roughMax) }
    shader.uniforms.uTone = { value: tone }
    shader.uniforms.uBias = { value: bias }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSurfPos;\nvarying vec3 vSurfNrm;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 sp = position * vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
        #ifdef USE_INSTANCING
          sp *= vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        #endif
        vSurfPos = sp;
        vSurfNrm = normal;`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uSurf; uniform float uSurfScale; uniform float uSurfBump; uniform vec2 uRough; uniform float uTone; uniform float uBias;
        varying vec3 vSurfPos; varying vec3 vSurfNrm;
        vec3 surfTri(vec3 p, vec3 n) {
          vec3 w = pow(abs(n), vec3(6.0)); w /= (w.x + w.y + w.z + 1e-5);
          p *= uSurfScale;
          // LOD bias keeps the macro structure (seams, large tone) and drops sub-pixel grain that would sparkle
          return texture2D(uSurf, p.yz, uBias).rgb * w.x + texture2D(uSurf, p.zx + 0.37, uBias).rgb * w.y + texture2D(uSurf, p.xy + 0.71, uBias).rgb * w.z;
        }
        vec3 surfPerturb(vec3 sp, vec3 sn, vec2 dH, float fd) {
          vec3 sx = dFdx(sp), sy = dFdy(sp);
          vec3 r1 = cross(sy, sn), r2 = cross(sn, sx);
          float det = dot(sx, r1) * fd;
          vec3 g = sign(det) * (dH.x * r1 + dH.y * r2);
          return normalize(abs(det) * sn - g);
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 surf = surfTri(vSurfPos, normalize(vSurfNrm));
        diffuseColor.rgb *= mix(1.0 - uTone, 1.0 + uTone * 0.6, surf.b);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(mix(uRough.x, uRough.y, surf.g), 0.04, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec2 dH = vec2(dFdx(surf.r), dFdy(surf.r)) * uSurfBump;
        normal = surfPerturb(-vViewPosition, normal, dH, faceDirection);`)
  }
  material.customProgramCacheKey = () => `surface-${key}`
  material.needsUpdate = true
  return material
}
