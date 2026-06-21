import { abs, attribute, cameraPosition, cos, cross, deltaTime, dot, emissive, float, floor, Fn, fract, fwidth, hash, hue, If, instancedArray, instanceIndex, mat3, max, min, mix, mod, mx_noise_float, mx_noise_vec3, normalLocal, normalView, normalWorld, PI2, positionLocal, positionViewDirection, positionWorld, pow, select, sin, smoothstep, step, texture, time, transformedNormalView, uniform, uv, varying, vec2, vec3, vec4 } from "three/tsl"
import * as THREE from "three/webgpu"

import {camera, renderer, scene} from '@/world/scene'
import { emitter } from "@/utils/emitter";
import { DRACOLoader, FontLoader, GLTFLoader, TextGeometry } from "three/examples/jsm/Addons.js";
import { gui } from "@/utils/guiPane";

async function loadFont(){
  const fontPath = import.meta.env.BASE_URL + 'font/DigitalRegular.ttf';
  const font = new FontFace('digitalFont', `url('${fontPath}')`);
  
  try{
    const loadFont = await font.load()
    // @ts-ignore
    document.fonts.add(loadFont)
    return loadFont
  }catch(e) {
    console.error('字体加载失败', e)
  }
}

async function getCanvasTex(){
  await loadFont()

  const canvas = document.createElement('canvas')
  canvas.width = 512*2
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制文字
  ctx.fillStyle = '#ffffff';
  ctx.font = 'Bold 512px digitalFont';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('0', canvas.width / 4, canvas.height/2);
  ctx.fillText('1', canvas.width / 4 * 3, canvas.height/2);
  const tex = new THREE.CanvasTexture(canvas)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter

  return tex
}


async function getModelGeo(){
  const loader = new GLTFLoader()
  const decoderLoader = new DRACOLoader()
  decoderLoader.setDecoderPath( import.meta.env.BASE_URL + 'draco/' )
  loader.setDRACOLoader(decoderLoader)
  const gltf = await loader.loadAsync(import.meta.env.BASE_URL + 'model/nemetona.glb')
  let geo: THREE.BufferGeometry
  gltf.scene.traverse(obj => {
    // @ts-ignore
    if(obj.isMesh){
      console.log(obj);
      const mesh = obj as THREE.Mesh
      geo = mesh.geometry
      geo.scale(.5,.5,.5)
    }
  })
  return geo
}


const COL = uniform(new THREE.Color(0,1,0))


async function baseModel(geo: THREE.BufferGeometry, tex: THREE.CanvasTexture<HTMLCanvasElement>){

  const modelUVScale = uniform(160)
  const modelUVOffsetSpeed = uniform(1.)

  // const geo = new THREE.BoxGeometry(5,5,5)
  const mat = new THREE.MeshBasicNodeMaterial()
  mat.transparent = true
  mat.side = THREE.DoubleSide
  // mat.depthWrite = false
  mat.blending = THREE.AdditiveBlending

  const stateSize = 100
  const stateBuffer = instancedArray(stateSize, 'float')

  const updateState = Fn(() => {
    const idx = float(instanceIndex)
    const v = hash(idx.mul(11.34).add(time.mul(10)))
    stateBuffer.element(idx).assign(step(.5, v))
  })().compute(stateSize)
  emitter.on('animate', () => {
    renderer.compute(updateState)
  })


  const getTex = Fn(([uv, uvScale]: [ THREE.Node<"vec2">, THREE.Node<'float'>]) => {
    let uv2 = (uv.mul(uvScale))
    const id = floor(uv2)
    uv2 = fract(uv2)
    uv2.x.mulAssign(.5)
    
    const idx = mod(floor(dot(id, vec2(11.3, 23.2))), stateSize)
    const state = stateBuffer.element(idx)

    uv2.x.addAssign(step(.5, state).mul(.5))
    const d = texture(tex, uv2).r
    return d
  })

  const vColStr = varying(float(0))
  mat.positionNode = Fn(() => {
    const n = mx_noise_float(positionWorld.mul(2.1).add(time))
    vColStr.assign(smoothstep(0, 1, n).mul(10).add(.1))
    return positionLocal
  })()

  mat.colorNode = Fn(() => {
    const uv2 = uv().toVar()
    // const uv2 = positionWorld.xy.toVar()
    const xId = floor(uv2.x)
    const yOffset = hash(xId.mul(2.12)).mul(time.mul(modelUVOffsetSpeed)).mul(-1).add(-.2)
    uv2.assign(fract(uv2.add(vec2(0, yOffset))))
    const d = getTex(uv2, (modelUVScale))


    // const viewDir = cameraPosition.sub(positionWorld).normalize()
    const viewDir = positionViewDirection
    const fresnel = pow(max(0, dot(normalWorld, viewDir)).oneMinus(), 2)
    const col = vec4(COL.mul(.1), 1).mul(fresnel)
    return mix(col, hue(COL, 1.2).mul(2.1).mul(vColStr), d)
  })()
  const mesh = new THREE.Mesh(geo, mat)
  scene.add(mesh)


  gui.add(modelUVScale, 'value', 20, 400, 1).name('modelUVScale')
  gui.add(modelUVOffsetSpeed, 'value', 0, 4, .1).name('modelUVOffsetSpeed')
}


async function codeRain(){
  const loader = new FontLoader();
  const url = import.meta.env.BASE_URL + 'font/Digital_Regular.json'
  const font = await loader.loadAsync( url );
  const fontSize = .5
  const fontDepth = .04
  const geo0 = new TextGeometry( '0', {
    font: font,
    size: fontSize,
    depth: fontDepth,
    curveSegments: 12
  } );
  const geo1 = new TextGeometry( '1', {
    font: font,
    size: fontSize,
    depth: fontDepth,
    curveSegments: 12
  } );
  const geos = [geo0, geo1]

  const threadSpeed = uniform(5)
  const threadLifeSpeed = uniform(3.)

  const threadCount = 100
  const threadLen = 20
  const COUNT = threadCount * threadLen
  const threadStateArr = new Float32Array(threadCount*4)
  for(let i=0;i<threadCount;i++){
    threadStateArr[i*3+0] = (Math.random()*2-1)*10
    threadStateArr[i*3+1] = (Math.random()*2-1)*10
    threadStateArr[i*3+2] = (Math.random()*2-1)*10
    threadStateArr[i*3+3] = Math.random()
  }
  const threadStateBuffer = instancedArray(threadStateArr, 'vec4') // pos + life
  const stateBuffer = instancedArray(COUNT, 'float')
  const updateThread = Fn(() => {
    const idx = float(instanceIndex)
    const state = threadStateBuffer.element(idx).toVar()
    const pos = state.xyz
    const life = state.w

    const speed = sin(idx.mul(1.23)).mul(.5).add(.5).mul(2)
    pos.addAssign(vec3(0,1,0).mul(deltaTime.mul(threadSpeed).mul(speed)))
    life.addAssign(deltaTime.mul(threadLifeSpeed))
    If(life.greaterThan(1), () => {
      // const p = mx_noise_vec3(vec2(11.23, 34.56).add(idx)).add(vec3(0,.5,0)).mul(vec3(40,40,40))
      const ang = hash(idx.mul(11.23)).mul(PI2)
      const r = hash(idx.mul(23.45)).mul(10).add(20)
      const x = cos(ang).mul(r)
      const z = sin(ang).mul(r)
      const y = hash(idx.mul(34.21)).mul(20)
      pos.assign(vec3(x,y,z))
      life.assign(fract(life))
    })



    threadStateBuffer.element(idx).assign(vec4(pos, life))
  })().compute(threadCount)

  const updateState = Fn(() => {
    const idx = float(instanceIndex)
    const n = hash(idx.mul(12.34).add(time.mul(10)))
    stateBuffer.element(idx).assign(n)
  })().compute(COUNT)


  emitter.on('animate', () => {
    renderer.compute(updateThread)
    renderer.compute(updateState)
  })

  geos.map((geo, i) => {
    const mat = new THREE.MeshBasicNodeMaterial()
    const vState = varying(float(0))
    mat.positionNode = Fn(() => {
      const idx = float(instanceIndex)
      const threadId = floor(idx.div(threadLen))
      const threadState = threadStateBuffer.element(threadId).toVar()
      const threadPos = threadState.xyz
      const threadLife = threadState.w
      const fade = smoothstep(0,.1,threadLife).mul(smoothstep(1, .9, threadLife))

      const cellId = mod(idx, threadLen)
      const gap = .6

      const pos = threadPos.add(vec3(0,-1,0).mul(gap).mul(cellId))

      const state = stateBuffer.element(idx)
      vState.assign(state.oneMinus())

      const isZero = step(0.5, state).oneMinus()
      const show = select(isZero.equal(i), 1, 0)

      const up = vec3(0,1,0)
      const dir = vec3(0,pos.y,0).sub(pos).normalize()
      const right = cross(dir, up).normalize()
      const rot = mat3(right, up, dir)

      return rot.mul(positionLocal).mul(show).mul(fade).add(pos)
    })()
    mat.colorNode = Fn(() => {
      return mix(vec3(0), COL.mul(6), vState)
    })()

    const ins = new THREE.InstancedMesh(geo, mat, COUNT)
    ins.frustumCulled = false
    scene.add(ins)
  })

  gui.add(threadSpeed, 'value', 0, 15, .01).name('threadSpeed')
  gui.add(threadLifeSpeed, 'value', 0, 5.1, .01).name('threadLifeSpeed')
}

export default async function DigitalWorld(){
  const tex = await getCanvasTex()
  const geo = await getModelGeo()

  await baseModel(geo, tex)

  await codeRain()

  gui.addColor(COL, 'value').name('COL').onChange(v => {
    console.log(v.toArray());
  })
}