import * as THREE from 'three/webgpu'
import { scene } from './scene'

export function setLight(){
  const amb = new THREE.AmbientLight(0xffffff, .2)
  scene.add(amb)

  const l = new THREE.DirectionalLight(0xffffff, 3)
  l.position.set(-3,5,10)
  l.lookAt(new THREE.Vector3(0,5,0))
  scene.add(l)
}