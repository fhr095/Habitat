import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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
    skyboxEnabled = sceneConfig.skybox.enabled, 
    skyboxTextureUrls = sceneConfig.skybox.textureUrls, 
    skyboxColor = sceneConfig.skybox.color,
  } = sceneConfig;

  const minimalSetup = false;


  const cameraRef = useRef(null);
  const worldRef = useRef(null);
  const containerRef = useRef(null);

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
  
  // Função para configurar a água com base no formato do objeto de grama
  const setupWater = (scene) => {
    const grassObject = scene.getObjectByName('Grama_-_Cidade_Administrativa_1');
    if (grassObject) {
      // Usar a mesma geometria do objeto de grama
      const waterGeometry = grassObject.geometry.clone(); // Clonar a geometria da grama

      // Criar o material de água
      const water = new Water(waterGeometry, {
        color: new THREE.Color(waterColor), // Cor da água baseada nas configurações dinâmicas
        scale: waterScale, // Escala ajustada dinamicamente
        flowDirection: new THREE.Vector2(1, 1),
        textureWidth: 1024,
        textureHeight: 1024,
        reflectivity: 0.6, // Ajustar a intensidade da reflexão para realismo
        opacity: 0.8, // Definir a opacidade da água
      });

      // Ajustar a posição da água para estar logo acima da grama
      water.rotation.x = -Math.PI / 2; // Rotaciona para alinhar com o plano XZ (horizontal)
      const elevation = 0.05; // Elevar a água levemente acima da grama
      water.position.set(grassObject.position.x, grassObject.position.y + elevation, grassObject.position.z);

      // Adicionar a água ao objeto de grama
      grassObject.add(water);
      console.log('Água adicionada ao objeto Grama_-_Cidade_Administrativa_1');
    } else {
      console.warn('Objeto "Grama_-_Cidade_Administrativa_1" não encontrado na cena.');
    }
  };

  const setupSkybox = (scene) => {
    if (sceneConfig.skybox.enabled) {
      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load(sceneConfig.skybox.textureUrls);
      scene.background = texture;
    } else {
      scene.background = new THREE.Color(sceneConfig.skybox.color);
    }
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

    if (movementLimits && !minimalSetup) {
      controls.minPolarAngle = movementLimits.y[0];
      controls.maxPolarAngle = movementLimits.y[1];
    }

    setupLights(scene);
    setupTransparency(scene);
    setupLOD(scene);
    setupAmbientOcclusion(scene);
    setupParticles(scene);
    setupFog(scene);
    setupWater(scene);
    setupSkybox (scene);

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
  

  // Atualiza o autoRotate nos controles da câmera
  useEffect(() => {
    // Inspecionar as opções recebidas do contexto para SetupScene
    if (worldRef.current && worldRef.current.controls) {
      console.log('Atualizando autoRotate e autoRotateSpeed:', { autoRotate, autoRotateSpeed });
      worldRef.current.controls.autoRotate = autoRotate;
      worldRef.current.controls.autoRotateSpeed = autoRotateSpeed;
    }
  }, [autoRotate, autoRotateSpeed]);

  useEffect(() => {
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
  }, [antiAliasingEnabled, pixelRatio]);
  
  
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

    useEffect(() => {
      const scene = new THREE.Scene();
      
      setupSkybox(scene);
  
      // Configuração da cena...
      const renderer = new THREE.WebGLRenderer({ antialias: sceneConfig.renderSettings.antiAliasingEnabled });
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current.appendChild(renderer.domElement);
  
      // Outras configurações da cena, como luzes e câmera...
  
      worldRef.current = { scene, renderer };
  
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, cameraRef.current);
      };
      animate();
  
      return () => {
        containerRef.current.removeChild(renderer.domElement);
      };
    }, [skyboxEnabled, skyboxTextureUrls, skyboxColor]);
    

  return <div ref={containerRef} className="scene-container"></div>;
}
