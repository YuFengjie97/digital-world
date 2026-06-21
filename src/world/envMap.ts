import { HDRLoader } from 'three/examples/jsm/Addons.js';
import * as THREE from 'three/webgpu'
import {scene} from '@/world/scene'


function getEnvHdr(){
  const loader = new HDRLoader();
  const hdr = import.meta.env.BASE_URL + 'img/hdr/potsdamer_platz_1k.hdr'
  const envMap = loader.load( hdr );
  envMap.mapping = THREE.EquirectangularReflectionMapping;

  return envMap
}


function getEnvCube(){
  console.log(import.meta.env.BASE_URL);
  const path = import.meta.env.BASE_URL + 'img/skybox/sky_12_cubemap_2k/'
  const loader = new THREE.CubeTextureLoader().setPath( path );
  const cubeTexture = loader.load( [
    'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'
  ] );
  return cubeTexture
}

export function setEnv(){
  const envMap = getEnvCube()
  // scene.environment = envMap
  scene.background = envMap
  scene.backgroundBlurriness = 0.4;
  scene.backgroundIntensity = .4;
  // scene.environmentIntensity = 0.4;
}