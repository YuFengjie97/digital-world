import {renderer, scene, camera} from '@/world/scene'
import * as THREE from 'three/webgpu'
import {pass, uniform} from 'three/tsl'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { gui } from '@/utils/guiPane';

export function getRenderPipeline() {

  const strength = uniform(.3)
  const radius = uniform(.2)
  const threshold = uniform(.8) 

  const renderPipeline = new THREE.RenderPipeline(renderer);
  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode("output");
  const bloomPass = bloom(scenePassColor, strength.value, radius.value, threshold.value);
  renderPipeline.outputNode = scenePassColor.add(bloomPass);

  bloomPass.strength = strength
  bloomPass.radius = radius
  bloomPass.threshold = threshold



  const f = gui.addFolder('Bloom')
  f.add(strength, 'value', 0., 1, .01).name('strength')
  f.add(radius, 'value', 0., 1, .01).name('radius')
  f.add(threshold, 'value', 0., 1, .01).name('threshold')  

  return {renderPipeline}
}