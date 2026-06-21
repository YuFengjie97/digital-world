import { abs, attribute, dot, float, Fn, fwidth, max, min, mix, mx_noise_float, normalLocal, normalView, positionLocal, pow, sin, smoothstep, step, time, transformedNormalView, uniform, uv, varying, vec3, vec4 } from "three/tsl"
import * as THREE from "three/webgpu"

import {scene} from '@/world/scene'


export default function GlowCrystal(){

  const edgeGlowCol = uniform(new THREE.Color(.0,.4,1))
  // @range: { min: 0, max: .1, step: 0.01 }
  const edgeGlowSize = uniform(.04)
  // @range: { min: 0, max: 5, step: 0.1 }
  const edgeGlowStr = uniform(3)
  // @range: { min: 0, max: 4, step: 0.1 }
  const edgeGlowPower = uniform(1.9)


  // @range: { min: 0, max: 5, step: 0.1 }
  const offsetNoiseScale = uniform(1)
  // @range: { min: 0, max: 5, step: 0.1 }
  const offsetNoiseAmp = uniform(5)
  // @range: { min: 0, max: 5, step: 0.1 }
  const offsetNoiseSpeed = uniform(.4)


  // @range: { min: 0, max: 5, step: 0.1 }
  const colorScale = uniform(2)


  const geo = new THREE.IcosahedronGeometry(4, 4)
  const posCount = geo.attributes.position.count
  const barycentrics = new Float32Array(posCount * 3)
  for(let i=0;i<posCount;i+=3){
    barycentrics[i * 3 + 0] = 1; barycentrics[i * 3 + 1] = 0; barycentrics[i * 3 + 2] = 0;
    barycentrics[(i + 1) * 3 + 0] = 0; barycentrics[(i + 1) * 3 + 1] = 1; barycentrics[(i + 1) * 3 + 2] = 0;
    barycentrics[(i + 2) * 3 + 0] = 0; barycentrics[(i + 2) * 3 + 1] = 0; barycentrics[(i + 2) * 3 + 2] = 1;
  }
  geo.setAttribute('barycentric', new THREE.BufferAttribute(barycentrics, 3));


  const mat = new THREE.MeshPhysicalNodeMaterial()
  mat.flatShading = true
  mat.side = THREE.DoubleSide
  mat.metalness = 0
  mat.roughness = .05
  mat.opacity = 1
  mat.thickness = 1.5
  mat.ior = 1.5
  mat.transmission = 1
  

  const bary = attribute<'vec3'>('barycentric', 'vec3');

  mat.positionNode = Fn(() => {
    const nor = normalLocal
    const offsetStr = mx_noise_float((positionLocal).mul(offsetNoiseScale).sub(time.mul(offsetNoiseSpeed)))
    // offsetStr.assign(smoothstep(0, 1, offsetStr))
    const offset = nor.mul(offsetStr.mul(offsetNoiseAmp))

    return positionLocal.add(offset)
  })()

  mat.colorNode = Fn(() => {
    const faceNormal = normalView
    const col = sin(vec3(3,2,1)
                    .add(dot(faceNormal, vec3(colorScale)))
                ).mul(.5).add(.5)


    const edge = max(.01, min(bary.x, min(bary.y, bary.z)))
    const glow = pow(edgeGlowSize.div(edge), edgeGlowPower)

    return vec4(mix(col, edgeGlowCol.mul(edgeGlowStr), glow), 1);
  })()


  scene.add(new THREE.Mesh(geo, mat))
}