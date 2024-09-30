import * as OBC from "@thatopen/components";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as TWEEN from "@tweenjs/tween.js";

export default function SetupScene(containerRef, setCamera, modelUrl) {
  let components = new OBC.Components();
  let worlds = components.get(OBC.Worlds);
  let world = worlds.create();

  // Setup da cena
  world.scene = new OBC.SimpleScene(components);
  world.scene.three.background = new THREE.Color(0xeeeeee); // Fundo cinza claro
  console.log("Background da cena configurado para cinza claro");

  // Determina se o modelo é IFC ou GLB
  const isIfc = modelUrl.endsWith(".ifc");
  console.log(`Tipo de modelo detectado: ${isIfc ? "IFC" : "GLB"}`);

  if (isIfc) {
    const renderer = new OBC.SimpleRenderer(components, containerRef.current);
    world.renderer = renderer;
    console.log("Renderer IFC configurado");

    const camera = new OBC.OrthoPerspectiveCamera(components);
    world.camera = camera;

    if (world.camera.controls) {
      world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
      console.log("Câmera IFC posicionada");
    }

    const controls = new OrbitControls(world.camera.controls.camera, renderer.domElement);
    configureControls(controls);
    console.log("Controles Orbit configurados para IFC");

    const animate = () => {
      requestAnimationFrame(animate);
      TWEEN.update();
      controls.update();
      renderer.render(world.scene.three, world.camera);
    };
    requestAnimationFrame(animate);

    // Responsividade para IFC
    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      world.camera.controls.updateProjectionMatrix();
      console.log("Redimensionamento IFC aplicado");
    });

    setCamera(world.camera);

  } else {
    // Configuração para modelos GLB
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio * 1.5); // Aumenta a resolução
    containerRef.current.appendChild(renderer.domElement);
    console.log("Renderer GLB configurado");

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 20, 50);
    console.log("Câmera GLB posicionada");

    const controls = new OrbitControls(camera, renderer.domElement);
    configureControls(controls);
    console.log("Controles Orbit configurados para GLB");

    // Reutiliza a cena global de 'world' para garantir que a iluminação seja aplicada corretamente
    const scene = world.scene.three;

    // Chama a função para adicionar luzes comuns à cena
    addCommonLights(scene);
    console.log("Luzes comuns adicionadas à cena GLB");

    // Chama a função para aplicar transparência aos materiais do modelo
    applyMaterialSettings(scene);
    console.log("Transparência aplicada aos materiais da cena GLB");

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      TWEEN.update();
      controls.update();
      renderer.render(scene, camera);
    };
    requestAnimationFrame(animate);

    // Responsividade para GLB
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      console.log("Redimensionamento GLB aplicado");
    });

    setCamera(camera);
  }

  components.init();
  console.log("Componentes inicializados");

  return { components, world };
}

// Função para configurar os controles Orbit
function configureControls(controls) {
  controls.enableZoom = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.5;
  console.log("Controles Orbit configurados");
}


// Função para aplicar transparência aos materiais
export function applyMaterialSettings(scene) {
  scene.traverse((object) => {
    console.log(`Objeto encontrado: ${object.name} (${object.type})`);
    if (object.isMesh) {
      object.material.transparent = true;
      object.material.opacity = 0.5;
      console.log(`Transparência aplicada ao objeto: ${object.name}`);
    }
  });
}



// Função para adicionar luzes comuns
function addCommonLights(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  console.log("Luz ambiente adicionada");

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 20, 10);
  scene.add(light);
  console.log("Luz direcional adicionada");
}
