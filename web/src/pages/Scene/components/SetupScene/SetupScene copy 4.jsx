import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import * as TWEEN from "@tweenjs/tween.js";
import { useEffect, useRef, useContext } from "react";
import * as OBC from "@thatopen/components"; // Componentes OBC
import { SceneConfigContext } from "../../../../context/SceneConfigContext";
import { Water } from 'three/examples/jsm/objects/Water';

export default function SetupScene({ setCamera, modelUrl, setComponents, setWorld }) {
  
  const { sceneConfig } = useContext(SceneConfigContext);

  const {
    backgroundColor = sceneConfig.backgroundColor,
    cameraType = sceneConfig.camera.type,
    cameraPosition = sceneConfig.camera.position,
    cameraDirection = sceneConfig.camera.direction,
    autoRotate = sceneConfig.camera.autoRotate,
    autoRotateSpeed = sceneConfig.camera.autoRotateSpeed,
    zoomEnabled = sceneConfig.camera.zoomEnabled,
    movementLimits = sceneConfig.camera.movementLimits,
    lightType = sceneConfig.light.type,
    lightIntensity = sceneConfig.light.intensity,
    lightPosition = sceneConfig.light.position,
    lightQuantity = sceneConfig.light.quantity,
    transparencyEnabled = sceneConfig.materialSettings.transparencyEnabled,
    materialOpacity = sceneConfig.materialSettings.materialOpacity,
    shadowsEnabled = sceneConfig.light.shadowsEnabled,
    shadowIntensity = sceneConfig.light.shadowIntensity,
    lodEnabled = sceneConfig.renderSettings.lodEnabled,
    lodDistance = sceneConfig.renderSettings.lodDistance,
    ambientOcclusionEnabled = sceneConfig.renderSettings.ambientOcclusionEnabled,
    antiAliasingEnabled = sceneConfig.renderSettings.antiAliasingEnabled,
    pixelRatio = sceneConfig.renderSettings.pixelRatio,
    particlesEnabled = sceneConfig.renderSettings.particlesEnabled,
    particleCount = sceneConfig.renderSettings.particleCount,
    particleSize = sceneConfig.renderSettings.particleSize,
    particleEffectType = sceneConfig.renderSettings.particleEffectType,
    fogSettings = sceneConfig.fogSettings,
    waterEnabled = sceneConfig.water.enabled,
    waterColor = sceneConfig.water.color, 
    waterScale = sceneConfig.water.scale,
    skyboxEnvironmentMapEnabled = sceneConfig.skyboxSettings.environmentMapEnabled, 
    skyboxTexturePath = sceneConfig.skyboxSettings.texturePath,
    skyboxEnabled = sceneConfig.skyboxSettings.enabled,
    metalness = sceneConfig.materialSettings.metalness,
    roughness = sceneConfig.materialSettings.roughness,
    toneMappingEnabled = sceneConfig.renderSettings.toneMappingEnabled,
    envMapIntensity = sceneConfig.renderSettings.envMapIntensity,
  } = sceneConfig;

  const minimalSetup = false;


  const cameraRef = useRef(null);
  const worldRef = useRef(null);
  const containerRef = useRef(null);
  const originalMaterials = useRef(new Map());

  // Função para inicializar ou atualizar a câmera
const setupCamera = () => {
  let camera;
  if (cameraType === "perspective") {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  } else {
    camera = new THREE.OrthographicCamera(-50, 50, 50, -50, 1, 1000);
  }
  camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
  camera.lookAt(cameraDirection.x, cameraDirection.y, cameraDirection.z);
  setCamera(camera);
  cameraRef.current = camera;

  // Atualize os controles para garantir que a câmera está correta
  if (worldRef.current && worldRef.current.controls) {
    worldRef.current.controls.object = camera; // Certifica-se de que os controles estão vinculados à câmera correta
    worldRef.current.controls.update(); // Atualize os controles
  }
};


  // Função para configurar as luzes
  const setupLights = (scene) => {
    // Remove todas as luzes antigas
    const oldLights = scene.children.filter(child => child.isLight);
    oldLights.forEach(light => scene.remove(light));

    for (let i = 0; i < lightQuantity; i++) {
      let light;
      if (lightType === "ambient") {
        light = new THREE.AmbientLight(0xffffff, lightIntensity);
      } else if (lightType === "directional") {
        light = new THREE.DirectionalLight(0xffffff, lightIntensity);
        light.position.set(lightPosition.x, lightPosition.y, lightPosition.z);
        if (shadowsEnabled) {
          light.castShadow = true;
          light.shadow.intensity = shadowIntensity;
        }
      }
      scene.add(light);
    }
  };

  
// Função para configurar o HDRI como Skybox, Environment Map e atualizar propriedades dos materiais e tone mapping
const setupHDRI = (scene, renderer) => {
  if (skyboxEnabled || skyboxEnvironmentMapEnabled) {
    const hdriLoader = new RGBELoader();
    hdriLoader.load(skyboxTexturePath, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      if (skyboxEnabled) {
        scene.background = texture; // Aplica o HDRI como background
      }

      if (skyboxEnvironmentMapEnabled) {
        scene.environment = texture; // Aplica o HDRI como Environment Map
        updateMaterialsForEnvironmentMap(scene, texture); // Atualiza os materiais da cena
      }
    });
  } else {
    scene.background = new THREE.Color(backgroundColor); // Caso o Skybox esteja desativado
    scene.environment = null; // Remove o environment map
    restoreOriginalMaterials(scene); // Restaura os materiais originais, se necessário
  }

  // Aplica o tone mapping no renderizador
  renderer.toneMapping = toneMappingEnabled ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0; // Ajusta a exposição do tone mapping
  renderer.needsUpdate = true; // Força a atualização do renderizador
};

// Função para atualizar os materiais com o environment map, metalness e roughness
const updateMaterialsForEnvironmentMap = (scene, texture) => {
  scene.traverse((object) => {
    if (object.isMesh) {
      // Armazena o material original caso ainda não tenha sido armazenado
      if (!originalMaterials.current.has(object)) {
        originalMaterials.current.set(object, object.material);
      }
      // Configura o material para usar o environment map, metalness e roughness
      object.material = new THREE.MeshStandardMaterial({
        ...object.material, // Mantém as propriedades originais
        envMap: texture,    // Aplica o environment map
        metalness: metalness, // Usa o valor atual de metalness
        roughness: roughness, // Usa o valor atual de roughness
      });
      object.material.envMapIntensity = envMapIntensity; // Define a intensidade do environment map
      object.material.needsUpdate = true; // Força a atualização do material
      console.log(`Material atualizado para objeto: ${object.name || 'sem nome'}`);
    }
  });
};

// Função para restaurar os materiais originais
const restoreOriginalMaterials = (scene) => {
  scene.traverse((object) => {
    if (object.isMesh && originalMaterials.current.has(object)) {
      object.material = originalMaterials.current.get(object); // Restaura o material original
      object.material.needsUpdate = true;
      console.log(`Material restaurado para objeto: ${object.name || 'sem nome'}`);
    }
  });
};
 

  
  // Inicializa a cena e os elementos dependentes
  useEffect(() => {
    console.log('Inicializando a cena com backgroundColor:', backgroundColor);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    const renderer = new THREE.WebGLRenderer({
      antialias: minimalSetup ? false : antiAliasingEnabled,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(minimalSetup ? 1 : pixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    
    setupCamera();
    const controls = new OrbitControls(cameraRef.current, renderer.domElement);
    controls.autoRotate = minimalSetup ? false : autoRotate;
    controls.autoRotateSpeed = minimalSetup ? 0 : autoRotateSpeed;
    controls.enableZoom = minimalSetup ? true : zoomEnabled;

    setupHDRI(scene, renderer);
    // Configura a animação
    const animate = () => {
      requestAnimationFrame(animate);
      TWEEN.update();
      controls.update();
      renderer.render(scene, cameraRef.current);
    };

    // Chama a animação
    animate();

    // Responsividade
    const handleResize = () => {
      console.log('Redimensionando a janela');
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Inicializa componentes OBC e atualiza referências de cena
    const components = new OBC.Components();
    setComponents(components);
    setWorld({ scene, renderer, camera: cameraRef.current, controls });
    worldRef.current = { scene, renderer, camera: cameraRef.current, controls };

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  // Atualiza apenas o background sem recriar a cena
  useEffect(() => {
    // Inspecionar as opções recebidas do contexto para SetupScenenull, 2));
    if (worldRef.current) {
      console.log('Atualizando o background para:', backgroundColor);
      worldRef.current.scene.background = new THREE.Color(backgroundColor);
    }
  }, [backgroundColor]);

  // Atualiza as luzes dinamicamente sem recriar a cena
  useEffect(() => {
    if (worldRef.current) {
      console.log('Atualizando luzes:', { lightType, lightIntensity, lightPosition, lightQuantity, shadowsEnabled, shadowIntensity });
      setupLights(worldRef.current.scene);
    }
  }, [lightType, lightIntensity, lightPosition, lightQuantity, shadowsEnabled, shadowIntensity]);

  
  // Atualiza configurações de câmera sem recriar a cena
  useEffect(() => {
    if (worldRef.current) {
      console.log('Atualizando tipo, posição e direção da câmera:', { cameraType, cameraPosition, cameraDirection });
      
      // Verifica se o tipo da câmera mudou e recria a câmera, se necessário
      if (
        (cameraType === "perspective" && !(cameraRef.current instanceof THREE.PerspectiveCamera)) ||
        (cameraType === "orthographic" && !(cameraRef.current instanceof THREE.OrthographicCamera))
      ) {
        setupCamera(); // Recria a câmera conforme o tipo
        worldRef.current.controls.object = cameraRef.current; // Atualiza os controles para usar a nova câmera
      }
  
      // Atualiza a posição e direção da câmera (independente do tipo)
      cameraRef.current.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      cameraRef.current.lookAt(cameraDirection.x, cameraDirection.y, cameraDirection.z);
    }
  }, [cameraType, cameraPosition, cameraDirection]);
  

  // Atualiza o Skybox, Environment Map e propriedades dos materiais dinamicamente com base no contexto
  useEffect(() => {
    if (worldRef.current) {
      setupHDRI(worldRef.current.scene, worldRef.current.renderer);
    }
  }, [
    skyboxEnabled,
    skyboxEnvironmentMapEnabled,
    skyboxTexturePath,
    metalness,
    roughness,
    envMapIntensity,
    toneMappingEnabled
  ]);


  return <div ref={containerRef} className="scene-container"></div>;
}
