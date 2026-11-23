import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../lib/store'
import { live } from '../lib/live'
import { rig } from './rig'
import { clamp, ease, k } from './util'

export const WS_ORIGIN = new THREE.Vector3(500, 0, 0)
const PANELS = 26

/* ================================================================
 * COMPANY ANALYTICAL WORKSPACE — 3D backdrop.
 * A segmented instrument arc around the visitor, a faint floor grid,
 * and the company's own revenue history standing as light columns.
 * Mostly static: rendering stops when the entry flight is over.
 * ================================================================ */
export default function WorkspaceWorld() {
  const route = useStore((s) => s.route)
  const bars = useStore((s) => s.wsBars)
  const visible = route === 'workspace'
  const panelRef = useRef(), edgeRef = useRef(), barGroup = useRef()

  const res = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1)
    const panel = new THREE.MeshStandardMaterial({ color: '#101115', roughness: 0.5, metalness: 0.6, envMapIntensity: 0.4 })
    const edge = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.22, 0.42), toneMapped: false })
    const bar = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.6, 1.4), transparent: true, opacity: 0.22, toneMapped: false, depthWrite: false })
    const barCap = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.5, 2.2), toneMapped: false })
    const grid = new THREE.GridHelper(80, 80, '#2a2c33', '#15161a')
    grid.material.transparent = true
    grid.material.opacity = 0.55
    return { box, panel, edge, bar, barCap, grid }
  }, [])
  useEffect(() => () => {
    res.box.dispose(); res.panel.dispose(); res.edge.dispose(); res.bar.dispose(); res.barCap.dispose()
    res.grid.geometry.dispose(); res.grid.material.dispose()
  }, [res])

  // static instrument arc — matrices written once
  useEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), e = new THREE.Euler()
    for (let i = 0; i < PANELS; i++) {
      const a = -1.25 + (i / (PANELS - 1)) * 2.5
      const R = 15
      p.set(Math.sin(a) * R, 1.6 + (i % 3) * 0.15, 6 - Math.cos(a) * R)
      q.setFromEuler(e.set(0, -a, 0))
      s.set(1.75, 3.6 - (i % 4) * 0.4, 0.06)
      m.compose(p, q, s)
      panelRef.current.setMatrixAt(i, m)
      p.y += s.y / 2 + 0.03
      s.set(1.55, 0.025, 0.07)
      m.compose(p, q, s)
      edgeRef.current.setMatrixAt(i, m)
    }
    panelRef.current.instanceMatrix.needsUpdate = true
    edgeRef.current.instanceMatrix.needsUpdate = true
  }, [])

  const barMax = Math.max(1, ...bars.map((b) => b.value))

  useFrame((st, dtRaw) => {
    if (!visible) return
    const dt = Math.min(dtRaw, 0.1)
    const P = live.pointer
    const O = WS_ORIGIN
    const e = ease(clamp((performance.now() - live.workspace.enterStart) / 1700))
    rig.cam.pos.set(O.x + P.x * 0.4 * e, 1.6 + (1 - e) * 3 + P.y * 0.2 * e, O.z + 9 + (1 - e) * 18)
    rig.cam.look.set(O.x, 1.5, O.z - 2)
    rig.cam.lambda = 3.5
    rig.fog.near = 12; rig.fog.far = 42
    const L = rig.light
    L.keyColor.set('#9fb4ff'); L.rimColor.set('#6f8cff')
    L.ambient = 0.22; L.key = 0.5; L.keyPos.set(O.x - 6, 10, 8)
    L.rim = 1.0; L.rimPos.set(O.x, 5, O.z - 14)
    L.spot = 60; L.spotColor.set('#cfdcff'); L.spotPos.set(O.x, 9, O.z + 4); L.spotTarget.set(O.x, 0, O.z - 3)
    L.point = 0; L.pointPos.set(O.x, -50, O.z)
    // bars rise in with the entry flight
    if (barGroup.current) {
      barGroup.current.children.forEach((g, i) => {
        const target = clamp(e * 1.4 - i * 0.08)
        g.scale.y += (Math.max(0.001, target) - g.scale.y) * k(6, dt)
      })
    }
  })

  return (
    <group position={WS_ORIGIN} visible={visible}>
      <primitive object={res.grid} position={[0, 0, 0]} />
      <instancedMesh ref={panelRef} args={[res.box, res.panel, PANELS]} frustumCulled={false} />
      <instancedMesh ref={edgeRef} args={[res.box, res.edge, PANELS]} frustumCulled={false} />
      <group ref={barGroup} position={[0, 0, -7]}>
        {bars.map((b, i) => {
          const h = 0.3 + (b.value / barMax) * 6
          const x = (i - (bars.length - 1) / 2) * 1.5
          return (
            <group key={b.label} position={[x, 0, 0]} scale={[1, 0.001, 1]}>
              <mesh geometry={res.box} material={res.bar} position={[0, h / 2, 0]} scale={[0.7, h, 0.7]} />
              <mesh geometry={res.box} material={res.barCap} position={[0, h, 0]} scale={[0.72, 0.03, 0.72]} />
            </group>
          )
        })}
      </group>
    </group>
  )
}
