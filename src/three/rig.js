import * as THREE from 'three'
/** Targets that each world writes when active; the camera & light rigs damp toward them. */
export const rig = {
  cam: { pos: new THREE.Vector3(0, 0, 12), look: new THREE.Vector3(0, 0, 0), lambda: 3.2 },
  fog: { near: 14, far: 48 },
  light: {
    ambient: 0.16,
    key: 0.6,
    keyColor: new THREE.Color('#dde4f2'),
    rimColor: new THREE.Color('#7f9cff'),
    keyPos: new THREE.Vector3(-6, 8, 6),
    rim: 1.0,
    rimPos: new THREE.Vector3(0, 3, -12),
    spot: 40,
    spotPos: new THREE.Vector3(0, 5, 5),
    spotTarget: new THREE.Vector3(0, 0, 0),
    spotColor: new THREE.Color('#cdd8ff'),
    point: 6,
    pointPos: new THREE.Vector3(0, 0, 0),
  },
}
