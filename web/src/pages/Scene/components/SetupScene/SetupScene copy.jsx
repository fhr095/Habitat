import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import * as TWEEN from "@tweenjs/tween.js";
import { useEffect, useRef, useContext } from "react";
import * as OBC from "@thatopen/components"; // Componentes OBC
import { AnimationMixer } from "three";
import { useAnimations } from "../../../../context/AnimationContext";
import { SceneConfigContext } from "../../../../context/SceneConfigContext";
import { ModelContext } from "../../../../context/ModelContext";
import { Water } from 'three/examples/jsm/objects/Water';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';

export default function SetupScene({ /*setCamera*/ modelUrl, setComponents, setWorld }) {
  const { animations, mixer, playAnimation, stopAllAnimations } = useAnimations();

   const {
    setScene,
    setCamera,
    setControls,
    sceneConfig,
    setSceneConfig
  } = useContext(SceneConfigContext);
  
  const { currentModel } = useContext(ModelContext);

  // Obter as configurações comuns e específicas do modelo atual
  const { common } = sceneConfig;
  const modelConfig = sceneConfig[currentModel] || {};

  // Combinar as configurações
  const combinedConfig = {
    ...common,
    ...modelConfig,
  };

  // Desestruturar as configurações de combinedConfig
  const {
    backgroundColor,
    camera,
    renderSettings,
    water,
    skyboxSettings,
    bloomEffect,
    fogSettings,
    light,
    materialSettings,
    animation,
  } = combinedConfig;

  // Desestruturar propriedades individuais
  const {
    type: cameraType,
    position: cameraPosition,
    direction: cameraDirection,
    autoRotate,
    autoRotateSpeed,
    zoomEnabled,
    movementLimits,
  } = camera || {};

  const {
    pixelRatio,
    antiAliasingEnabled,
    lodEnabled,
    lodDistance,
    ambientOcclusionEnabled,
    particlesEnabled,
    particleCount,
    particleSize,
    particleEffectType,
    toneMappingEnabled,
    envMapIntensity,
  } = renderSettings || {};

  const {
    enabled: waterEnabled,
    color: waterColor,
    scale: waterScale,
  } = water || {};

  const {
    enabled: skyboxEnabled,
    texturePath: skyboxTexturePath,
    environmentMapEnabled: skyboxEnvironmentMapEnabled,
  } = skyboxSettings || {};

  const {
    enabled: bloomEnabled,
    strength: bloomStrength,
    radius: bloomRadius,
    threshold: bloomThreshold,
    status: bloomStatus,
  } = bloomEffect || {};

  const {
    enabled: fogEnabled,
    color: fogColor,
    density: fogDensity,
  } = fogSettings || {};

  const {
    type: lightType,
    intensity: lightIntensity,
    position: lightPosition,
    shadowsEnabled,
    shadowIntensity,
    quantity: lightQuantity,
  } = light || {};

  const {
    transparencyEnabled,
    materialOpacity,
    metalness,
    roughness,
  } = materialSettings || {};

  const {
    enabled: animationEnabled,
    speed: animationSpeed,
    smoothness: animationSmoothness,
  } = animation || {};

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




  function restoreMaterial(obj) {
    if (materials[obj.uuid]) {
      obj.material = materials[obj.uuid];
      delete materials[obj.uuid];
    }
  }

  
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
    if (cameraPosition) {
      cameraRef.current.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    }
    if (cameraDirection) {
      cameraRef.current.lookAt(cameraDirection.x, cameraDirection.y, cameraDirection.z);
    }
  
    // Atualiza os controles se existirem
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
  
   // VARIAS FUNCOES OMITIDAS AQUI PARA BREVIDADE


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

  

  const animate = () => {
    requestAnimationFrame(animate);
  
    const delta = clockRef.current.getDelta();
    const elapsedTime = clockRef.current.getElapsedTime();
  
    if (mixerRef.current) mixerRef.current.update(delta);
  
    // Update controls and other animations
    TWEEN.update(); // If you're using TWEEN
    if (worldRef.current.controls) worldRef.current.controls.update();
  
    const { scene, renderer, camera } = worldRef.current;
    const background = scene.background;
  
    // Update emissive intensity for oscillating objects
    scene.traverse((object) => {
      if (object.isMesh) {
        const bloomObject = bloomStatusRef.current[object.uuid];
  
        if (bloomObject && bloomObject.status) {
          if (bloomObject.oscillate) {
            // Initialize oscillation parameters if not already set
            if (!object.userData.oscillation) {
              object.userData.oscillation = {
                initialIntensity: object.material.emissiveIntensity || 1.0,
              };
            }
  
            // Oscillation parameters
            const minIntensity = 0.1;
            const maxIntensity = 2.0;
            const speed = 0.5; // Adjust as needed
  
            // Calculate the new emissive intensity using a sine function
            const intensity =
              minIntensity +
              (maxIntensity - minIntensity) * 0.5 * (1 + Math.sin(speed * elapsedTime * Math.PI * 2));
  
            object.material.emissiveIntensity = intensity;
          } else if (object.userData.oscillation) {
            // Oscillation stopped; reset emissive intensity to initial value
            object.material.emissiveIntensity = object.userData.oscillation.initialIntensity;
            delete object.userData.oscillation;
          }
        }
      }
    });
  
    // Render with Bloom or default rendering
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
    setScene(scene);
    setCamera(camera);

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
      //window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', handleResize);
      containerRef.current.removeChild(renderer.domElement);
      if (mixer) mixer.stopAllAction();
    };
  }, []);

//OMITIDAS PARA BREVIDADE
  
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
