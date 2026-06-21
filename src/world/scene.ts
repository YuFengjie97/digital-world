import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import {emitter} from '../utils/emitter'
import { getRenderPipeline } from './webGpuEffect'


export let scene: THREE.Scene
export let renderer: THREE.WebGPURenderer
export let camera: THREE.PerspectiveCamera
export let timer: THREE.Timer
export let control: OrbitControls

export async function initScene() {
  const container = document.querySelector('#app')
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1000)

  if(!container) return


  renderer = new THREE.WebGPURenderer({ antialias: true })
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio))
  renderer.setPixelRatio(dpr)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  // renderer.toneMapping=THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1
  renderer.outputColorSpace = THREE.SRGBColorSpace;


  container.appendChild(renderer.domElement)
  // await renderer.init()

  control = new OrbitControls(camera)
  control.enableDamping=true
  control.dampingFactor = 0.05;
  control.connect(renderer.domElement)


  timer = new THREE.Timer()

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  const {renderPipeline} = getRenderPipeline()


  function animate() {
    timer.update()
    control.update()

    emitter.emit('animate', {
      delta: timer.getDelta(),
      elapsed: timer.getElapsed()
    })

    // renderer.render(scene, camera)
    renderPipeline.render()
  }

  // 使用setAnimationLoop会自动在第一帧init webgpuRender,如果是window.requestAnimationFrame() 要手动init
  renderer.setAnimationLoop(animate)
}




