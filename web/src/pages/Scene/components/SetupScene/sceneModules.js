// sceneModules.js
import * as THREE from 'three';
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { Water } from 'three/examples/jsm/objects/Water';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { materialProxySystem } from './MaterialProxySystem';

// Configuração da câmera
export function setupCamera(cameraConfig, aspect) {
  let camera;
  
  if (cameraConfig.type === "perspective") {
    camera = new THREE.PerspectiveCamera(
      75,
      aspect,
      0.1,
      1000
    );
  } else {
    camera = new THREE.OrthographicCamera(-50, 50, 50, -50, 1, 1000);
  }
  
  // Configurar posição e direção
  if (cameraConfig.position) {
    camera.position.set(
      cameraConfig.position.x, 
      cameraConfig.position.y, 
      cameraConfig.position.z
    );
  }
  
  if (cameraConfig.direction) {
    camera.lookAt(
      cameraConfig.direction.x,
      cameraConfig.direction.y,
      cameraConfig.direction.z
    );
  }
  
  return camera;
}

// Configuração das luzes
export function setupLights(scene, lightConfig) {
  // Remove luzes existentes
  const oldLights = scene.children.filter(child => child.isLight);
  oldLights.forEach(light => scene.remove(light));
  
  // Adiciona novas luzes com base na configuração
  for (let i = 0; i < lightConfig.quantity; i++) {
    let light;
    
    if (lightConfig.type === "ambient") {
      light = new THREE.AmbientLight(0xffffff, lightConfig.intensity);
    } else if (lightConfig.type === "directional") {
      light = new THREE.DirectionalLight(0xffffff, lightConfig.intensity);
      light.position.set(
        lightConfig.position.x,
        lightConfig.position.y,
        lightConfig.position.z
      );
      
      if (lightConfig.shadowsEnabled) {
        light.castShadow = true;
        light.shadow.intensity = lightConfig.shadowIntensity;
      }
    }
    
    scene.add(light);
  }
}

// Configuração do skybox e environment map
export function setupSkybox(scene, renderer, skyboxConfig, materialConfig) {
  // Configuração do environment map
  if (skyboxConfig.enabled || skyboxConfig.environmentMapEnabled) {
    const hdriLoader = new RGBELoader();
    hdriLoader.load(skyboxConfig.texturePath, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      
      // Configura o background se o skybox estiver habilitado
      if (skyboxConfig.enabled) {
        scene.background = texture;
      } else {
        // Define um background de cor sólida
        scene.background = new THREE.Color(scene.background || "#dddddd");
      }
      
      // Configura o environment map se estiver habilitado
      if (skyboxConfig.environmentMapEnabled) {
        scene.environment = texture;
        
        // Registra os materiais originais antes de modificá-los
        materialProxySystem.registerScene(scene);
        
        // Aplica efeito de environment map com o sistema de proxy
        materialProxySystem.applyEffectToScene(scene, 'environment', {
          envMapIntensity: materialConfig.envMapIntensity
        });
      } else {
        // Remove o environment map
        scene.environment = null;
        materialProxySystem.removeEffectsFromScene(scene);
      }
    });
  } else {
    // Se skybox não estiver habilitado, define um background de cor sólida
    scene.background = new THREE.Color(scene.background || "#dddddd");
    scene.environment = null;
  }
  
  // Configura tone mapping
  if (renderer) {
    renderer.toneMapping = materialConfig.toneMappingEnabled 
      ? THREE.ACESFilmicToneMapping 
      : THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.needsUpdate = true;
  }
}

// Configuração de materiais
export function setupMaterials(scene, materialConfig) {
  // Registra os materiais originais antes de modificá-los
  materialProxySystem.registerScene(scene);
  
  // Aplica configurações de material usando o sistema de proxy
  scene.traverse((object) => {
    if (object.isMesh) {
      const isTransparent = materialConfig.transparencyEnabled;
      const opacity = materialConfig.materialOpacity;
      const metalness = materialConfig.metalness;
      const roughness = materialConfig.roughness;
      
      // Verifica se precisamos modificar o material
      if (isTransparent || opacity < 1.0 || 
          metalness !== undefined || roughness !== undefined) {
        
        // Cria ou obtém proxy para o material
        materialProxySystem.applyEffect(object, 'material', {
          transparent: isTransparent,
          opacity: opacity,
          metalness: metalness,
          roughness: roughness
        });
      }
    }
  });
}

// Configuração de névoa (fog)
export function setupFog(scene, fogConfig) {
  if (fogConfig.enabled) {
    scene.fog = new THREE.FogExp2(fogConfig.color, fogConfig.density);
  } else {
    scene.fog = null;
  }
}

// Configuração do efeito de bloom e processamento de pós-renderização
export function setupBloomEffect(world, effectsRef, bloomConfig, vertexShader, fragmentShader) {
  const { scene, renderer, camera } = world;
  
  if (!renderer || !scene || !camera) return;
  
  // Camada para bloom
  const BLOOM_SCENE = 1;
  const bloomLayer = new THREE.Layers();
  bloomLayer.set(BLOOM_SCENE);
  
  if (bloomConfig.enabled) {
    // Se o compositor de bloom não existe, crie-o
    if (!effectsRef.current.bloomComposer) {
      // Criar o SMAA Pass para anti-aliasing
      const smaaPass = new SMAAPass();
      
      // Criar render pass e passagens de bloom
      const renderScene = new RenderPass(scene, camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        bloomConfig.strength,
        bloomConfig.radius,
        bloomConfig.threshold
      );
      
      // Configurar compositores
      const bloomComposer = new EffectComposer(renderer);
      bloomComposer.renderToScreen = false;
      bloomComposer.addPass(renderScene);
      bloomComposer.addPass(bloomPass);
      
      // Compositor final que combina cena regular + bloom
      const finalComposer = new EffectComposer(renderer);
      finalComposer.addPass(renderScene);
      
      // Shader para misturar bloom e cena base
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
      
      finalComposer.addPass(mixPass);
      finalComposer.addPass(smaaPass);
      
      // Adiciona um output pass para finalizar
      const outputPass = new OutputPass();
      finalComposer.addPass(outputPass);
      
      // Armazena referências
      effectsRef.current.bloomComposer = bloomComposer;
      effectsRef.current.bloomPass = bloomPass;
      effectsRef.current.finalComposer = finalComposer;
      effectsRef.current.mixPass = mixPass;
      effectsRef.current.smaaPass = smaaPass;
      effectsRef.current.bloomLayer = bloomLayer;
    } else {
      // Se já existe, apenas atualiza os parâmetros
      effectsRef.current.bloomPass.strength = bloomConfig.strength;
      effectsRef.current.bloomPass.radius = bloomConfig.radius;
      effectsRef.current.bloomPass.threshold = bloomConfig.threshold;
    }
    
    // Aplica configurações de bloom aos objetos usando o sistema de proxy
    // Registra materiais originais primeiro
    materialProxySystem.registerScene(scene);
    
    // Configura objetos para bloom
    updateBloomProxies(scene, bloomConfig.status, BLOOM_SCENE);
  } else {
    // Se desativado, limpa as referências
    effectsRef.current.bloomComposer = null;
    effectsRef.current.bloomPass = null;
    effectsRef.current.finalComposer = null;
    effectsRef.current.mixPass = null;
    effectsRef.current.smaaPass = null;
    effectsRef.current.bloomLayer = null;
    
    // Remove o efeito de bloom de todos os objetos
    scene.traverse(object => {
      if (object.isMesh) {
        // Restaura materiais originais
        materialProxySystem.removeEffect(object);
        // Desabilita a camada de bloom
        object.layers.disable(BLOOM_SCENE);
      }
    });
  }
}

// Atualiza as configurações de bloom para cada objeto usando o sistema de proxy
export function updateBloomProxies(scene, bloomStatus, BLOOM_SCENE) {
  if (!bloomStatus) return;
  
  scene.traverse((object) => {
    if (object.isMesh) {
      const bloomObject = bloomStatus[object.uuid];
      
      if (bloomObject && bloomObject.status) {
        // Configura material para bloom usando sistema de proxy
        materialProxySystem.applyEffect(object, 'bloom', {
          emissiveIntensity: bloomObject.emissiveIntensity || 1.0,
          emissiveColor: bloomObject.name === "Cabeça-Robo" ? 0x00bfff : undefined 
        });
        
        // Habilita o layer para bloom
        object.layers.enable(BLOOM_SCENE);
      } else {
        // Desabilita o bloom
        object.layers.disable(BLOOM_SCENE);
        
        // Restaura material original apenas se for um material de bloom
        const proxy = materialProxySystem.proxyMaterials?.get(object);
        if (proxy && proxy.effectType === 'bloom') {
          materialProxySystem.removeEffect(object);
        }
      }
    }
  });
}

// Renderiza a cena com efeito de bloom
export function renderWithBloom(scene, camera, renderer, effectsRef) {
  if (!effectsRef.current.bloomComposer || !effectsRef.current.finalComposer) {
    // Renderização padrão
    renderer.render(scene, camera);
    return;
  }
  
  // Guarda o background original
  const originalBackground = scene.background;
  scene.background = null;
  
  // Primeira passagem: renderiza apenas objetos que devem ter bloom
  materialProxySystem.applyDarkMaterial(scene, effectsRef.current.bloomLayer);
  effectsRef.current.bloomComposer.render();
  
  // Restaura os materiais originais
  materialProxySystem.restoreMaterials(scene);
  
  // Restaura o background
  scene.background = originalBackground;
  
  // Segunda passagem: renderiza a cena completa com o efeito de bloom
  effectsRef.current.finalComposer.render();
}

// Processa oscilação de emissive para objetos de bloom
export function processEmissiveOscillation(scene, bloomStatus, elapsedTime) {
  if (!bloomStatus) return;
  
  scene.traverse((object) => {
    if (object.isMesh) {
      const bloomObject = bloomStatus[object.uuid];
      
      if (bloomObject && bloomObject.status && bloomObject.oscillate) {
        // Acessa o material atual (seja original ou proxy)
        const material = object.material;
        
        if (!material) return;
        
        // Processando arrays de materiais
        if (Array.isArray(material)) {
          material.forEach(mat => {
            if (mat && mat.emissiveIntensity !== undefined) {
              // Parâmetros de oscilação
              const minIntensity = 0.1;
              const maxIntensity = 2.0;
              const speed = 0.5;
              
              // Calcula a nova intensidade usando função senoidal
              const intensity = minIntensity +
                (maxIntensity - minIntensity) * 0.5 *
                (1 + Math.sin(speed * elapsedTime * Math.PI * 2));
              
              mat.emissiveIntensity = intensity;
              mat.needsUpdate = true;
            }
          });
        } 
        // Processando material único
        else if (material.emissiveIntensity !== undefined) {
          // Parâmetros de oscilação
          const minIntensity = 0.1;
          const maxIntensity = 2.0;
          const speed = 0.5;
          
          // Calcula a nova intensidade usando função senoidal
          const intensity = minIntensity +
            (maxIntensity - minIntensity) * 0.5 *
            (1 + Math.sin(speed * elapsedTime * Math.PI * 2));
          
          material.emissiveIntensity = intensity;
          material.needsUpdate = true;
        }
      }
    }
  });
}

// Configuração de partículas
export function setupParticles(scene, particleConfig) {
  // Remove partículas existentes
  const oldParticles = scene.children.filter(child => child.isPoints);
  oldParticles.forEach(particle => scene.remove(particle));
  
  // Se partículas estiverem desabilitadas, retorna
  if (!particleConfig.enabled || !particleConfig.particlesEnabled) return;
  
  // Cria nova geometria de partículas
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleConfig.particleCount * 3);
  
  for (let i = 0; i < particleConfig.particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 100;
  }
  
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  
  // Material para partículas
  const particleMaterial = new THREE.PointsMaterial({
    size: particleConfig.particleSize,
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
  });
  
  // Cria o sistema de partículas
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
  
  // Aplica efeito específico se configurado
  switch (particleConfig.particleEffectType) {
    case "dust":
      createDustEffect(particles);
      break;
    case "snow":
      createSnowEffect(particles, positions);
      break;
    case "rain":
      createRainEffect(particles, positions);
      break;
    // Adicione outros efeitos conforme necessário
  }
  
  return particles;
}

// Efeitos específicos de partículas
function createDustEffect(particles) {
  particles.material.color.set(0xcccccc);
  particles.material.opacity = 0.5;
  particles.userData.animation = (time) => {
    particles.rotation.y += 0.001;
  };
}

function createSnowEffect(particles, positions) {
  particles.material.color.set(0xffffff);
  particles.material.opacity = 0.8;
  particles.userData.animation = (time) => {
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= 0.5;
      if (positions[i + 1] < -100) {
        positions[i + 1] = 100;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;
  };
}

function createRainEffect(particles, positions) {
  particles.material.color.set(0x00aaff);
  particles.material.opacity = 0.8;
  particles.userData.animation = (time) => {
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= 2.0;
      if (positions[i + 1] < -100) {
        positions[i + 1] = 100;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;
  };
}

// Criar efeito de água
export function createWaterEffect(scene, waterConfig) {
  // Remover água existente se houver
  scene.children.forEach(child => {
    if (child.userData && child.userData.isWater) {
      scene.remove(child);
    }
  });
  
  if (!waterConfig.enabled) return;
  
  // Cria geometria e material da água
  const waterGeometry = new THREE.PlaneGeometry(500, 500);
  const water = new Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      sunDirection: new THREE.Vector3(0, 1, 0),
      sunColor: 0xffffff,
      waterColor: waterConfig.color,
      distortionScale: waterConfig.scale,
      fog: scene.fog !== undefined
    }
  );
  
  water.rotation.x = -Math.PI / 2;
  water.position.y = -5;
  water.userData.isWater = true;
  water.userData.animation = (time) => {
    water.material.uniforms['time'].value += 1.0 / 60.0;
  };
  
  scene.add(water);
  
  return water;
}