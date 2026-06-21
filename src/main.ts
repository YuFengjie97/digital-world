import './style.css'
import { initScene, scene, camera, control } from './world/scene'
import * as THREE from 'three'
import {setEnv} from './world/envMap'
import GlowCrystal from './world/glowCrystal'
import { setLight } from './world/light'
import DigitalWorld from './world/DigitalWorld'



(async() => {
  await initScene()
  camera.position.set(0,10,15)
  control.target.set(0,5,0)

  // const axesHelper = new THREE.AxesHelper(10)
  // scene.add(axesHelper)

  setLight()
  setEnv()

  // GlowCrystal()
  DigitalWorld()
})()