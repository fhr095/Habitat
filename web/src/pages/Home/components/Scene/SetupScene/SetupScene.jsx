// src/components/Scene/SetupScene/SetupScene.jsx
import * as OBC from "@thatopen/components";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

export default function SetupScene(containerRef, setCamera, setComposer) {
  // Cria os componentes e o mundo via ThatOpen
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);
  const world = worlds.create();

  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBC.SimpleRenderer(components, containerRef.current);

  // Obtenha a instância "real" do renderer.
  const rendererInstance =
    (world.renderer && world.renderer.renderer)
      ? world.renderer.renderer
      : world.renderer;

  // Se o método getPixelRatio não existir, definimos um dummy.
  if (rendererInstance && typeof rendererInstance.getPixelRatio !== "function") {
    console.warn("Renderer instance does not have getPixelRatio. Defining a dummy getPixelRatio function.");
    rendererInstance.getPixelRatio = () => window.devicePixelRatio;
  }

  if (rendererInstance) {
    rendererInstance.physicallyCorrectLights = true;
    rendererInstance.toneMapping = THREE.ACESFilmicToneMapping;
    rendererInstance.toneMappingExposure = 1.2; // Ajuste conforme necessário
  } else {
    console.error("Renderer instance not found in SetupScene.");
  }

  // Cria a câmera utilizando o componente do OBC
  world.camera = new OBC.OrthoPerspectiveCamera(components);
  world.scene.setup();

  // Adiciona luz ambiente e direcional
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  world.scene.three.add(ambientLight);
  // Adicione ou substitua a criação da luz direcional existente por este código:
const directionalLight = new THREE.DirectionalLight(0xffffff, 10.0); // Intensidade aumentada
directionalLight.position.set(50, 50, 50); // Ajuste a posição conforme necessário

// Ativa sombras para a luz direcional (importante para dar realismo)
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.0001;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

// Ajuste a área onde as sombras serão projetadas (câmera da sombra)
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;

// Adiciona a luz à cena
  world.scene.three.add(directionalLight);

  // Carrega o HDR utilizando um renderer temporário nativo do THREE.WebGLRenderer
  const tempRenderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  tempRenderer.setSize(1, 1);
  tempRenderer.setPixelRatio(window.devicePixelRatio);
  const pmremGenerator = new THREE.PMREMGenerator(tempRenderer);
  if (typeof pmremGenerator.compileEquirectangularShader === "function") {
    pmremGenerator.compileEquirectangularShader();
  }
  new RGBELoader()
    .load(
      '/surround/1.hdr', // Verifique se o arquivo HDR está em public/surround/1.hdr
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        world.scene.three.environment = envMap;
        world.scene.three.background = envMap;
        texture.dispose();
        pmremGenerator.dispose();
        tempRenderer.dispose();
      },
      undefined,
      (error) => {
        console.error("Erro ao carregar a HDR:", error);
      }
    );

  // Configura os controles da câmera (via OBC)
  const controls = world.camera.controls;
  controls.setLookAt(10, 10, 10, 0, 0, 0);



  // Inicializa o loop de renderização do OBC
  components.init();
  if (!world.camera.position) {
    world.camera.position = new THREE.Vector3(10, 10, 10);
  }
  setCamera(world.camera);

  

  // Configura o EffectComposer para pós-processamento
  const composer = new EffectComposer(rendererInstance);
  // RenderPass: renderiza a cena normalmente
  const renderPass = new RenderPass(world.scene.three, world.camera.projection.camera);
  composer.addPass(renderPass);
  // UnrealBloomPass: adiciona efeito de brilho (ajuste os parâmetros conforme necessário)
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.8, 0.4, 0.85);
  bloomPass.threshold = 0.1;
  bloomPass.strength = 2.0;
  bloomPass.radius = 0.55;
  composer.addPass(bloomPass);
  // FXAA Pass: anti-aliasing final
  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.material.uniforms.resolution.value.set(1 / window.innerWidth, 1 / window.innerHeight);
  composer.addPass(fxaaPass);
  
  // Chama setComposer somente se for fornecido
  if (typeof setComposer === "function") {
    setComposer(composer);
  }

  return { components, world, controls };
}
