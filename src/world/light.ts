import * as THREE from 'three/webgpu'
import { scene } from './scene'

export function setLight(){
  const amb = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(amb)


}