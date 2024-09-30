import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import * as TWEEN from "@tweenjs/tween.js";
import { useEffect, useRef, useContext, useState } from "react";
import * as OBC from "@thatopen/components"; // Componentes OBC
import { AnimationMixer } from "three";
import { useAnimations } from "../../../../context/AnimationContext";
import { SceneConfigContext } from "../../../../context/SceneConfigContext";
import { Water } from 'three/examples/jsm/objects/Water';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';



export default function SetupScene({ setCamera, modelUrl, setComponents, setWorld }) {
  
  const { animations, mixer, playAnimation, stopAllAnimations } = useAnimations();

  //const { sceneConfig } = useContext(SceneConfigContext);
  const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext);

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
    bloomEnabled = sceneConfig.bloomEffect.enabled,
    bloomStrength = sceneConfig.bloomEffect.strength,
    bloomRadius = sceneConfig.bloomEffect.radius,
    bloomThreshold = sceneConfig.bloomEffect.threshold,
    bloomStatus = sceneConfig.bloomEffect.status,
  } = sceneConfig;

  const minimalSetup = false;
  const cameraRef = useRef(null);
  const worldRef = useRef(null);
  const containerRef = useRef(null);
  const originalMaterials = useRef(new Map());
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());

  // Bloom e EffectComposer references
  const bloomComposerRef = useRef(null);
  const bloomPassRef = useRef(null);
  const finalComposerRef = useRef(null);
  const mixPassRef = useRef(null);
  const fxaaPassRef = useRef(null);
  const smaaPassRef = useRef(null);

  //const [bloomStatus, setBloomStatus] = useState({});



    // Definir shaders diretamente como strings
    const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;
    void main() {
      gl_FragColor = (texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv));
    }
  `;

  /////GLOBAL DEFINITIONS/////
  const BLOOM_SCENE = 1;
  const bloomLayer = new THREE.Layers();
  bloomLayer.set(BLOOM_SCENE);

  const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const materials = {};

  function nonBloomed(obj) {
    if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
      materials[obj.uuid] = obj.material;
      obj.material = darkMaterial;
    }
  }

  function restoreMaterial(obj) {
    if (materials[obj.uuid]) {
      obj.material = materials[obj.uuid];
      delete materials[obj.uuid];
    }
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  /*function onPointerDown(event) {
    if (!worldRef.current) return;

    const { scene, camera } = worldRef.current;

    // Calculate normalized mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the mouse position and camera
    raycaster.setFromCamera(mouse, camera);

    // Intersect objects in the scene
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const object = intersects[0].object;
      object.layers.toggle(BLOOM_SCENE);
    }
  }*/
  //////////////////////////

  const setupCamera = () => {
    let cameraNeedsUpdate = false;
  
    // Verifica se a câmera precisa ser recriada
    if (
      !cameraRef.current ||
      (cameraType === "perspective" && !(cameraRef.current instanceof THREE.PerspectiveCamera)) ||
      (cameraType === "orthographic" && !(cameraRef.current instanceof THREE.OrthographicCamera))
    ) {
      cameraNeedsUpdate = true;
    }
  
    if (cameraNeedsUpdate) {
      // Recria a câmera se necessário
      let camera;
      if (cameraType === "perspective") {
        camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
      } else {
        camera = new THREE.OrthographicCamera(-50, 50, 50, -50, 1, 1000);
      }
      cameraRef.current = camera;
      setCamera(camera);      
    }
    // Atualiza a posição e direção da câmera
    cameraRef.current.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    cameraRef.current.lookAt(cameraDirection.x, cameraDirection.y, cameraDirection.z);
    // Atualiza o objeto da câmera nos controles, se existirem
    if (worldRef.current && worldRef.current.controls) {
      worldRef.current.controls.object = cameraRef.current;
      worldRef.current.controls.update();
    }
  };

  const setupControls = () => {
    if (!worldRef.current) return;
  
    const { renderer } = worldRef.current;
  
    if (!worldRef.current.controls) {
      // Criar controles se ainda não existirem
      const controls = new OrbitControls(cameraRef.current, renderer.domElement);
      worldRef.current.controls = controls;
    }
  
    const controls = worldRef.current.controls;
  
    // Atualizar as configurações dos controles
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = autoRotateSpeed;
    controls.enableZoom = zoomEnabled;
  
    // Atualizar limites de movimento, se aplicável
    if (movementLimits && !minimalSetup) {
      controls.minPolarAngle = movementLimits.y[0];
      controls.maxPolarAngle = movementLimits.y[1];
    }
    controls.target.set(cameraDirection.x, cameraDirection.y, cameraDirection.z);
    controls.update();
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

    // Função para configurar transparência e material
    const setupTransparency = (scene) => {
      scene.traverse((object) => {
        if (object.isMesh) {
          object.material.transparent = transparencyEnabled;
          object.material.opacity = materialOpacity;
        }
      });
    };
  
    // Função para configurar LOD (Level of Detail)
    const setupLOD = (scene) => {
      if (scene && scene.children.length > 0) {
        const lod = new THREE.LOD();
        scene.add(lod);
        scene.traverse((object) => {
          if (object.isMesh) {
            lod.addLevel(object, lodDistance);
          }
        });
      } else {
        console.warn("A cena ou seus objetos não estão definidos para LOD.");
      }
    };
    
  
    // Função para configurar Ambient Occlusion
    const setupAmbientOcclusion = (scene) => {
      if (ambientOcclusionEnabled) {
        const aoMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
        scene.traverse((object) => {
          if (object.isMesh) {
            object.material = aoMaterial;
          }
        });
      }
    };
  
    const setupFog = (scene) => {
      const { enabled, color, density } = sceneConfig.fogSettings;
      if (enabled) {
        scene.fog = new THREE.FogExp2(color, density);
      } else {
        scene.fog = null;
      }
    };
  
    const setupParticles = (scene, effectType, particlesEnabled, particleCount, particleSize) => {
      // Remove partículas antigas
      const oldParticles = scene.children.filter((child) => child.isPoints);
      oldParticles.forEach((particle) => scene.remove(particle));
    
      // Verifica se as partículas estão habilitadas
      if (!particlesEnabled) return; // Se não estiver habilitado, retorna sem adicionar partículas
    
      // Escolhe o efeito de acordo com o tipo
      switch (effectType) {
        case "dust":
          createDustEffect(scene, particleCount, particleSize);
          break;
        case "snow":
          createSnowEffect(scene, particleCount, particleSize);
          break;
        case "rain":
          createRainEffect(scene, particleCount, particleSize);
          break;
        case "explosion":
          createExplosionEffect(scene, particleCount, particleSize);
          break;
        default:
          // Caso padrão: sistema genérico de partículas
          const particleGeometry = new THREE.BufferGeometry();
          const positions = new Float32Array(particleCount * 3);
    
          for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 100; // Distribui partículas aleatoriamente
          }
    
          particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          const particleMaterial = new THREE.PointsMaterial({
            size: particleSize,
            color: 0xffffff, // Branco por padrão
          });
          const particles = new THREE.Points(particleGeometry, particleMaterial);
          scene.add(particles);
          break;
      }
    };  
  
    const createDustEffect = (scene, particleCount, particleSize) => {
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
    
      for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 200; // Partículas espalhadas aleatoriamente
      }
    
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        size: particleSize,
        color: 0xcccccc, // Cor clara para poeira
        transparent: true,
        opacity: 0.5,
      });
    
      const dustParticles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(dustParticles);
    
      const animateDust = () => {
        requestAnimationFrame(animateDust);
        dustParticles.rotation.y += 0.001; // Suave rotação para simular poeira flutuando
      };
      animateDust();
    };
  
    const createSnowEffect = (scene, particleCount, particleSize) => {
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
    
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200; // Largura da área
        positions[i + 1] = Math.random() * 200; // Altura inicial
        positions[i + 2] = (Math.random() - 0.5) * 200; // Profundidade
      }
    
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        size: particleSize,
        color: 0xffffff, // Branco para a neve
        transparent: true,
        opacity: 0.8,
      });
    
      const snowParticles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(snowParticles);
    
      const animateSnow = () => {
        requestAnimationFrame(animateSnow);
    
        // Atualiza a posição das partículas para simular a queda de neve
        const positions = snowParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] -= 0.5; // Faz as partículas caírem
          if (positions[i + 1] < 0) {
            positions[i + 1] = 200; // Reposiciona no topo quando chega no chão
          }
        }
        snowParticles.geometry.attributes.position.needsUpdate = true;
      };
      animateSnow();
    };
  
    const createRainEffect = (scene, particleCount, particleSize) => {
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
    
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 100; // Largura da área
        positions[i + 1] = Math.random() * 200; // Altura inicial
        positions[i + 2] = (Math.random() - 0.5) * 100; // Profundidade
      }
    
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        size: particleSize,
        color: 0x00aaff, // Azul para gotículas de chuva
        transparent: true,
        opacity: 0.8,
      });
    
      const rainParticles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(rainParticles);
    
      const animateRain = () => {
        requestAnimationFrame(animateRain);
    
        // Atualiza a posição das partículas para simular a queda de chuva
        const positions = rainParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] -= 2.0; // Faz as partículas caírem rapidamente
          if (positions[i + 1] < 0) {
            positions[i + 1] = 200; // Reposiciona no topo quando chega no chão
          }
        }
        rainParticles.geometry.attributes.position.needsUpdate = true;
      };
      animateRain();
    };
  
    const createExplosionEffect = (scene, particleCount, particleSize) => {
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
    
      for (let i = 0; i < particleCount * 3; i += 3) {
        const theta = 2 * Math.PI * Math.random(); // Ângulo aleatório
        const phi = Math.acos(2 * Math.random() - 1); // Ângulo aleatório
        const radius = Math.random() * 50; // Raio da explosão
    
        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = radius * Math.cos(phi);
      }
    
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        size: particleSize,
        color: 0xffaa00, // Cor de explosão (laranja/amarela)
        transparent: true,
        opacity: 1.0,
      });
    
      const explosionParticles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(explosionParticles);
    
      const animateExplosion = () => {
        requestAnimationFrame(animateExplosion);
    
        // Expande as partículas e diminui a opacidade para simular explosão
        const positions = explosionParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] *= 1.05; // Expande as partículas
          positions[i + 1] *= 1.05;
          positions[i + 2] *= 1.05;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;
    
        // Diminui a opacidade para simular o desaparecimento
        explosionParticles.material.opacity *= 0.95;
        if (explosionParticles.material.opacity < 0.05) {
          scene.remove(explosionParticles); // Remove partículas quando desaparecem
        }
      };
      animateExplosion();
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.needsUpdate = true; // Força a atualização do renderizador
  };

  // Função para atualizar os materiais com o environment map, metalness e roughness
  const updateMaterialsForEnvironmentMap = (scene, texture) => {
    scene.traverse((object) => {
      if (object.isMesh) {
        console.log("Oi, tudo bem?");
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

  
  const setupBloomEffect = (enabled) => {
    if (!worldRef.current) return;
  
    const { renderer, scene, camera } = worldRef.current;
  
    if (enabled) {
      // If bloomComposer hasn't been created yet, create it
      if (!bloomComposerRef.current) {

        const smaaPass = new SMAAPass();


        // Adicionar o FXAA Pass
        const fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = renderer.getPixelRatio();
        fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
        fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);

        // Create render passes and composers
        const renderScene = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          bloomStrength,
          bloomRadius,
          bloomThreshold
        );
  
        const bloomComposer = new EffectComposer(renderer);
        bloomComposer.renderToScreen = false;
        bloomComposer.addPass(renderScene);
        bloomComposer.addPass(bloomPass);
        //bloomComposer.addPass(fxaaPass);

        bloomComposer.renderToScreen = false;
  
        // Create the final composer
        const finalComposer = new EffectComposer(renderer);
        finalComposer.addPass(renderScene);
  
        // Create mixPass to combine bloom and base textures
        const mixPass = new ShaderPass(
          new THREE.ShaderMaterial({
            uniforms: {
              baseTexture: { value: null },
              bloomTexture: { value: bloomComposer.renderTarget2.texture },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
          }),
          'baseTexture'
        );
        //mixPass.needsSwap = true;
        finalComposer.addPass(mixPass);

        finalComposer.addPass(smaaPass);

        
        
        //finalComposer.addPass(fxaaPass);
        const outputPass = new OutputPass();
        finalComposer.addPass(outputPass);
        
  
        // Store references
        bloomComposerRef.current = bloomComposer;
        bloomPassRef.current = bloomPass;
        finalComposerRef.current = finalComposer;
        mixPassRef.current = mixPass;
        //fxaaPassRef.current = fxaaPass;
       
        smaaPassRef.current = smaaPass;
      } else {
        // Update the parameters of the existing bloomPass
        bloomPassRef.current.strength = bloomStrength;
        bloomPassRef.current.radius = bloomRadius;
        bloomPassRef.current.threshold = bloomThreshold;
      }
    } else {
      // If bloom is disabled, clear references
      bloomComposerRef.current = null;
      bloomPassRef.current = null;
      finalComposerRef.current = null;
      mixPassRef.current = null;
      fxaaPassRef.current = null;
      smaaPassRef.current = null;
    }
  };
  
  useEffect(() => {
       
    // Configurações do renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Configurações da cena
    const scene = new THREE.Scene();

    // Configuração da câmera
    setupCamera();    
    const camera = cameraRef.current;

    // Configuração dos controles da câmera
    worldRef.current = { scene, renderer, camera };
    setupControls();

    
    // Agora que controls foi criado, atualizamos o estado do mundo
    setWorld({
      scene: worldRef.current.scene,
      renderer: worldRef.current.renderer,
      camera: worldRef.current.camera,
      controls: worldRef.current.controls,
    });

    // Funções auxiliares de configuração de luz, materiais, etc.
    setupLights(scene);
    
    
    scene.background = new THREE.Color(sceneConfig.backgroundColor);

    // Configuração dos componentes
    const components = new OBC.Components();
    setComponents(components);

    window.addEventListener('pointerdown', onPointerDown);
    
    // Função de animação principal que inclui TWEEN, controles e o mixer de animação
    const animate = () => {
      requestAnimationFrame(animate);
  
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);
  
      // Atualizações de controles e outros
      TWEEN.update(); // Se estiver usando TWEEN
      if (worldRef.current.controls) worldRef.current.controls.update();
  
      const { scene, renderer, camera } = worldRef.current;
      const background = scene.background;
  
      // Renderização com Bloom ou renderização padrão
      if (bloomComposerRef.current && finalComposerRef.current) {
        scene.background = null;
        scene.traverse(nonBloomed);
        bloomComposerRef.current.render();
        scene.traverse(restoreMaterial);
        scene.background = background;
        finalComposerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();
    

    // Responsividade ao redimensionar a tela
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (bloomComposerRef.current) {
        bloomComposerRef.current.setSize(window.innerWidth, window.innerHeight);
      }
      if (finalComposerRef.current) {
        finalComposerRef.current.setSize(window.innerWidth, window.innerHeight);
      }
      if (fxaaPassRef.current) {
        const pixelRatio = renderer.getPixelRatio();
        fxaaPassRef.current.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
        fxaaPassRef.current.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
      }
      if (smaaPassRef.current) {
        smaaPassRef.current.setSize(window.innerWidth, window.innerHeight);
      }      
    };
    window.addEventListener('resize', handleResize);

    // Limpeza ao desmontar
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', handleResize);
      containerRef.current.removeChild(renderer.domElement);
      if (mixer) mixer.stopAllAction();
    };
  }, []);


  useEffect(() => {
    setupBloomEffect(bloomEnabled);
  }, [bloomEnabled, bloomStrength, bloomRadius, bloomThreshold]);

  

  useEffect(() => {
    updateBloomLayers();
    console.log('bloomStatus:',bloomStatus );
  }, [bloomStatus]);

  const updateBloomLayers = () => {
    if (!worldRef.current) return;
  
    const { scene } = worldRef.current;
    scene.traverse((object) => {
      if (object.isMesh) {
        if (bloomStatus[object.uuid] && bloomStatus[object.uuid].status) {
          if (bloomStatus[object.uuid].name === "Cabeça-Robo"){
            object.material.roughness = 0.5;
            object.material.metalness = 0;         

            object.material.emissive = new THREE.Color(0x00bfff);
            object.material.emissiveIntensity = 2;
            
          }
          
          object.layers.enable(BLOOM_SCENE);
        } else {
          object.layers.disable(BLOOM_SCENE);
        }
      }
    });
  };


function onPointerDown(event) {
  if (!worldRef.current) return;

  const { scene, camera } = worldRef.current;

  // Calcula as coordenadas normalizadas do mouse
  const mouse = {
    x: (event.clientX / window.innerWidth) * 2 - 1,
    y: -(event.clientY / window.innerHeight) * 2 + 1,
  };

  // Atualiza o raycaster com a posição do mouse e da câmera
  raycaster.setFromCamera(mouse, camera);

  // Intersecta os objetos na cena
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    const uuid = object.uuid;

    // Atualiza o bloomStatus no contexto
    setSceneConfig((prevConfig) => ({
      ...prevConfig,
      bloomEffect: {
        ...prevConfig.bloomEffect,
        status: {
          ...prevConfig.bloomEffect.status,
          [uuid]: {
            ...prevConfig.bloomEffect.status[uuid], // Mantém o nome existente
            status: !prevConfig.bloomEffect.status[uuid].status, // Alterna o status
          },
        },
      },
    }));
  }
}

  
  /*function onPointerDown(event) {
    if (!worldRef.current) return;
  
    const { scene, camera } = worldRef.current;
  
    // Calcula as coordenadas normalizadas do mouse
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    // Atualiza o raycaster com a posição do mouse e da câmera
    raycaster.setFromCamera(mouse, camera);
  
    // Intersecta os objetos na cena
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const object = intersects[0].object;
      const uuid = object.uuid;
      setBloomStatus((prevStatus) => ({
        ...prevStatus,
        [uuid]: !prevStatus[uuid],
      }));
    }
  }*/
  
  

  /*useEffect(() => {
       
    // Configurações do renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Configurações da cena
    const scene = new THREE.Scene();

    // Configuração da câmera
    setupCamera();    
    const camera = cameraRef.current;

    // Configuração dos controles da câmera
    worldRef.current = { scene, renderer, camera };
    setupControls();

    
    // Agora que controls foi criado, atualizamos o estado do mundo
    setWorld({
      scene: worldRef.current.scene,
      renderer: worldRef.current.renderer,
      camera: worldRef.current.camera,
      controls: worldRef.current.controls,
    });

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      2,
      0.1,
      0.1,
    );
    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);

    bloomComposer.renderToScreen = false;

    const mixPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
      }),
      'baseTexture'
    );


    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScene);
    finalComposer.addPass(mixPass);

    const outputPass = new OutputPass();
    finalComposer.addPass(outputPass);


    const BLOOM_SCENE = 1;
    const bloomLayer = new THREE.Layers();
    bloomLayer.set(BLOOM_SCENE);

    const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const materials = {};

    function nonBloomed(obj) {
      if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
        materials[obj.uuid] = obj.material;
        obj.material = darkMaterial;
      }
    }

    function restoreMaterial(obj) {
      if (materials[obj.uuid]) {
        obj.material = materials[obj.uuid];
        delete materials[obj.uuid];
      }
    }

    // Funções auxiliares de configuração de luz, materiais, etc.
    setupLights(scene);
    
    scene.background = new THREE.Color(sceneConfig.backgroundColor);

    // Configuração dos componentes
    const components = new OBC.Components();
    setComponents(components);

    const rayCaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onPointerDown(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      rayCaster.setFromCamera(mouse, camera);
      const intersects = rayCaster.intersectObjects(scene.children);
      if (intersects.length > 0) {
        const object = intersects[0].object;
        object.layers.toggle(BLOOM_SCENE);
      }
    }

    window.addEventListener('pointerdown', onPointerDown);
    
    // Função de animação principal que inclui TWEEN, controles e o mixer de animação
    const animate = () => {
      requestAnimationFrame(animate);

      // Atualizar animações do mixer se ele existir
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);

      TWEEN.update();
      if (worldRef.current.controls) worldRef.current.controls.update();
      //renderer.render(scene, cameraRef.current);
      const background = scene.background;
      scene.background = null;
      scene.traverse(nonBloomed);
      bloomComposer.render();
      scene.traverse(restoreMaterial);
      scene.background = background;
      finalComposer.render();
    };
    animate();

    // Responsividade ao redimensionar a tela
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      bloomComposer.setSize(window.innerWidth, window.innerHeight);
      finalComposer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Limpeza ao desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current.removeChild(renderer.domElement);
      if (mixerRef.current) mixerRef.current.stopAllAction();
    };
  }, []);*/

  
  // Atualiza configurações de câmera sem recriar a cena
  useEffect(() => {
    if (worldRef.current) {
      // Atualiza a câmera
      setupCamera();
    }
  }, [
    cameraType,
    cameraPosition,
    cameraDirection,
  ]);  

  // Atualiza configurações de câmera sem recriar a cena
  useEffect(() => {
    if (worldRef.current) {
      // Atualiza a câmera
      setupControls();
    }
  }, [
    cameraDirection,
  ]);

  useEffect(() => {
    if (worldRef.current) {
      // Atualiza os controles
      setupControls();
    }
  }, [
    autoRotate,
    autoRotateSpeed,
    zoomEnabled,
    movementLimits,
  ]); 

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
  }, [
    lightType, 
    lightIntensity, 
    lightPosition, 
    lightQuantity, 
    shadowsEnabled, 
    shadowIntensity
  ]);


  // Atualiza a transparência e opacidade do material dinamicamente
  useEffect(() => {
    if (worldRef.current) {
      console.log('Atualizando transparência e opacidade:', { transparencyEnabled, materialOpacity });
      setupTransparency(worldRef.current.scene);
    }
  }, [transparencyEnabled, materialOpacity]);

  // Atualiza as configurações de LOD dinamicamente
  useEffect(() => {
    if (worldRef.current) {
      console.log('Atualizando LOD:', { lodEnabled, lodDistance });
      setupLOD(worldRef.current.scene);
    }
  }, [lodEnabled, lodDistance]);

  // Atualiza as configurações de Ambient Occlusion dinamicamente
  useEffect(() => {
    if (worldRef.current) {
      console.log('Atualizando Ambient Occlusion:', ambientOcclusionEnabled);
      setupAmbientOcclusion(worldRef.current.scene);
    }
  }, [ambientOcclusionEnabled]);

  // Atualiza o autoRotate nos controles da câmera
  useEffect(() => {
    // Inspecionar as opções recebidas do contexto para SetupScene
    if (worldRef.current && worldRef.current.controls) {
      console.log('Atualizando autoRotate e autoRotateSpeed:', { autoRotate, autoRotateSpeed });
      worldRef.current.controls.autoRotate = autoRotate;
      worldRef.current.controls.autoRotateSpeed = autoRotateSpeed;
    }
  }, [autoRotate, autoRotateSpeed]);

  /*useEffect(() => {
    if (worldRef.current && antiAliasingEnabled !== worldRef.current.antiAliasingEnabled) {
      console.log('Recriando o renderer para atualizar o anti-aliasing:', { antiAliasingEnabled });
      
      // Salva a cena e a câmera atuais
      const { scene, camera, controls } = worldRef.current;
  
      // Cria um novo renderizador com o anti-aliasing atualizado
      const newRenderer = new THREE.WebGLRenderer({
        antialias: antiAliasingEnabled,
      });
      newRenderer.setSize(window.innerWidth, window.innerHeight);
      newRenderer.setPixelRatio(pixelRatio); // Aplica o pixel ratio atual
  
      // Substitui o renderizador anterior no DOM
      containerRef.current.removeChild(worldRef.current.renderer.domElement);
      containerRef.current.appendChild(newRenderer.domElement);
  
      // Reatribui o renderizador
      worldRef.current.renderer = newRenderer;
      worldRef.current.antiAliasingEnabled = antiAliasingEnabled;
  
      // Reconfigura controles e animações com o novo renderizador
      controls.object = camera;
      controls.update();
  
      // Função de animação para usar o novo renderizador
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        newRenderer.render(scene, camera); // Renderiza com o novo renderer
      };
      animate();
    }
  }, [antiAliasingEnabled, pixelRatio]);*/
  
  
  // Atualiza o sistema de partículas quando o estado do contexto muda
  useEffect(() => {
    if (worldRef.current) {
      setupParticles(worldRef.current.scene);
    }
  }, [particlesEnabled, particleCount, particleSize]);

  // Configuração de efeito de partículas no contexto
    useEffect(() => {
      if (worldRef.current) {
        setupParticles(
          worldRef.current.scene,
          sceneConfig.renderSettings.particleEffectType, // Tipo de efeito
          sceneConfig.renderSettings.particlesEnabled, // Verifica se partículas estão habilitadas
          sceneConfig.renderSettings.particleCount, // Quantidade de partículas
          sceneConfig.renderSettings.particleSize // Tamanho das partículas
        );
      }
    }, [particlesEnabled, particleCount, particleSize, particleEffectType]);

    // Atualiza a névoa dinamicamente
    useEffect(() => {
      if (worldRef.current) {
        setupFog(worldRef.current.scene);
      }
    }, [fogSettings]);
  
    useEffect(() => {
      if (worldRef.current) {
        if (waterEnabled) {
          console.log('Ativando a simulação de água');
          setupWater(worldRef.current.scene);
        } else {
          console.log('Desativando a simulação de água');
          const grassObject = worldRef.current.scene.getObjectByName('Grama_-_Cidade_Administrativa_1');
          if (grassObject) {
            const water = grassObject.children.find(child => child instanceof Water);
            if (water) {
              grassObject.remove(water); // Remove a água se estiver presente
            }
          }
        }
      }
    }, [waterEnabled, waterColor, waterScale]);


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


  /*useEffect(() => {
    if (animations.length > 0 && worldRef.current.scene && mixer) {
      // Inicializar as ações de animação
      animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.play();
      });
      console.log("Animações iniciadas");
    }
  }, [animations, mixer]);*/


  // Atualizar animação com base no índice selecionado
  /*useEffect(() => {
    if (sceneConfig.animationIndex !== undefined && mixer && animations.length > 0) {
      mixer.stopAllAction(); // Parar todas as animações anteriores
      const selectedClip = animations[sceneConfig.animationIndex];
      if (selectedClip) {
        const action = mixer.clipAction(selectedClip);
        action.play(); // Reproduzir animação selecionada
        action.timeScale = sceneConfig.animationSpeed || 1; // Define a velocidade da animação
        console.log(`Animação selecionada: ${selectedClip.name}`);
      }
    }
  }, [sceneConfig.animationIndex, sceneConfig.animationSpeed, mixer, animations]);*/

  

  // Atualizar animação com base no índice selecionado usando playAnimation do contexto
  useEffect(() => {
    if (sceneConfig.animationIndex !== undefined && animations.length > 0) {
      const selectedClip = animations[sceneConfig.animationIndex];
      if (selectedClip) {
        playAnimation(selectedClip.name);
        // Ajuste a velocidade da animação
        if (mixer) {
          const action = mixer.clipAction(selectedClip);
          action.timeScale = sceneConfig.animationSpeed || 1;
          console.log(`Animação selecionada: ${selectedClip.name}`);
        }
      }
    }
  }, [sceneConfig.animationIndex, sceneConfig.animationSpeed, animations, playAnimation, mixer]);

  // Atualiza a referência sempre que o mixer no contexto mudar
  useEffect(() => {
    mixerRef.current = mixer;
  }, [mixer]);


  return <div ref={containerRef} className="scene-container"></div>;
}
