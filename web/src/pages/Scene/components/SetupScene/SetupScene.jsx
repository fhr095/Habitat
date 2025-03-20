import React, { useEffect, useRef, useContext, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as TWEEN from "@tweenjs/tween.js";
import * as OBC from "@thatopen/components";
import { useAnimations } from "../../../../context/AnimationContext";
import { useSceneConfig } from "../../../../context/SceneConfigContext";
import { ModelContext } from "../../../../context/ModelContext";
import { materialProxySystem } from "./MaterialProxySystem";
import { useVisualizationMode } from "../../../../context/VisualizationModeContext";

// Importa os módulos de configuração da cena
import {
  setupCamera,
  setupLights,
  setupSkybox,
  setupMaterials,
  setupFog,
  setupBloomEffect,
  updateBloomProxies,
  processEmissiveOscillation,
  setupParticles,
  createWaterEffect,
  renderWithBloom
} from "./sceneModules";

export default function SetupScene({ modelUrl, setComponents, setWorld }) {
  const { animations, mixer, playAnimation, stopAllAnimations } = useAnimations();
  const { 
    scene: sceneObj, 
    setScene, 
    camera: cameraObj, 
    setCamera, 
    controls: controlsObj, 
    setControls, 
    renderer: rendererObj,
    setRenderer,
    sceneConfig, 
    updateConfig
  } = useSceneConfig();
  
  const { currentModel } = useContext(ModelContext);
  const { currentMode } = useVisualizationMode();

  // Obter as configurações para o modelo atual
  const modelConfig = sceneConfig[currentModel] || sceneConfig.both;
  
  // Referências locais
  const containerRef = useRef(null);
  const worldRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const animationFrameId = useRef(null);
  const sceneInitialized = useRef(false);
  
  // Estado para rastrear se a cena já foi inicializada
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Referências para efeitos
  const effectsRef = useRef({
    bloomComposer: null,
    bloomPass: null,
    finalComposer: null,
    mixPass: null,
    smaaPass: null,
    fxaaPass: null,
    bloomLayer: null
  });
  
  // Shaders para o bloom effect
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

  // Função principal de renderização e animação - memoizada para evitar recriações
  const animate = useCallback(() => {
    if (!worldRef.current || !worldRef.current.scene || !worldRef.current.camera) {
      animationFrameId.current = requestAnimationFrame(animate);
      return;
    }
    
    const delta = clockRef.current.getDelta();
    const elapsedTime = clockRef.current.getElapsedTime();
    
    // Atualiza o mixer de animação, se existir
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    // Atualiza tweens e controles
    TWEEN.update();
    if (worldRef.current && worldRef.current.controls) {
      worldRef.current.controls.update();
    }
    
    // Processa oscilações de emissão para objetos de bloom
    if (worldRef.current && worldRef.current.scene) {
      processEmissiveOscillation(
        worldRef.current.scene, 
        modelConfig.bloomEffect.status, 
        elapsedTime
      );
      
      // Atualiza animações de partículas e água
      worldRef.current.scene.children.forEach(child => {
        if (child.userData && child.userData.animation) {
          child.userData.animation(elapsedTime);
        }
      });
    }
    
    // Renderiza com ou sem efeito de bloom
    if (worldRef.current && worldRef.current.renderer) {
      const { scene, renderer, camera } = worldRef.current;
      
      // Usa a função atualizada de renderização com bloom
      if (effectsRef.current.bloomComposer && effectsRef.current.finalComposer) {
        renderWithBloom(scene, camera, renderer, effectsRef);
      } else {
        // Renderização padrão
        renderer.render(scene, camera);
      }
    }
    
    animationFrameId.current = requestAnimationFrame(animate);
  }, [modelConfig.bloomEffect.status]); // Dependência reduzida ao mínimo

  // Inicialização da cena - executada apenas uma vez
  useEffect(() => {
    if (sceneInitialized.current) return; // Evita múltiplas inicializações
    
    console.log("Initializing scene");
    sceneInitialized.current = true;
    
    // Ativa o debug no sistema de proxy para desenvolvimento
    materialProxySystem.debugEnabled = false;
    
    // Configuração do renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      alpha: true
    });
    
    renderer.setPixelRatio(window.devicePixelRatio * (modelConfig.renderSettings.pixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    if (containerRef.current) {
      // Remove canvas existentes para evitar duplicação
      const existingCanvas = containerRef.current.querySelector('canvas');
      if (existingCanvas) {
        containerRef.current.removeChild(existingCanvas);
      }
      
      containerRef.current.appendChild(renderer.domElement);
    }
    
    setRenderer(renderer);

    // Configuração da cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneConfig.common.backgroundColor);
    setScene(scene);

    // Configuração da câmera
    const camera = setupCamera(modelConfig.camera, window.innerWidth / window.innerHeight);
    setCamera(camera);

    // Configuração dos controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = modelConfig.camera.autoRotate;
    controls.autoRotateSpeed = modelConfig.camera.autoRotateSpeed;
    controls.enableZoom = modelConfig.camera.zoomEnabled;
    
    if (modelConfig.camera.movementLimits) {
      controls.minPolarAngle = modelConfig.camera.movementLimits.y[0];
      controls.maxPolarAngle = modelConfig.camera.movementLimits.y[1];
    }
    
    controls.target.set(
      modelConfig.camera.direction.x,
      modelConfig.camera.direction.y,
      modelConfig.camera.direction.z
    );
    
    controls.update();
    setControls(controls);

    // Armazena referência do mundo
    worldRef.current = {
      scene,
      renderer,
      camera,
      controls
    };
    
    // Atualiza o estado do mundo para o componente pai
    setWorld({
      scene,
      renderer,
      camera,
      controls
    });

    // Inicializa componentes OBC
    const components = new OBC.Components();
    setComponents(components);

    // Inicia o loop de animação
    animationFrameId.current = requestAnimationFrame(animate);

    // Gerencia redimensionamento da janela
    const handleResize = () => {
      if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
      
      if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      
      // Redimensiona compositors se existirem
      if (effectsRef.current.bloomComposer) {
        effectsRef.current.bloomComposer.setSize(window.innerWidth, window.innerHeight);
      }
      
      if (effectsRef.current.finalComposer) {
        effectsRef.current.finalComposer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    setIsInitialized(true);

    // Cleanup
    return () => {
      console.log("Cleaning up scene setup");
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      if (mixer) {
        mixer.stopAllAction();
      }
      
      // Dispose de todos os recursos
      if (renderer) {
        renderer.dispose();
      }
      
      if (controls) {
        controls.dispose();
      }
      
      // Limpa recursos do sistema de proxy
      materialProxySystem.dispose();
      
      sceneInitialized.current = false;
    };
  }, []); // Executa apenas uma vez
  
  // Atualiza configurações quando o modelo atual ou configurações mudam
  useEffect(() => {
    if (!worldRef.current || !worldRef.current.scene) return;
    
    console.log("Updating scene config");
    const { scene, renderer, camera, controls } = worldRef.current;
    
    // Registra materiais originais assim que carregados
    materialProxySystem.registerScene(scene);
    
    // Configurações básicas
    setupLights(scene, modelConfig.light);
    scene.background = new THREE.Color(sceneConfig.common.backgroundColor);
    
    // Controles da câmera
    if (controls) {
      controls.autoRotate = modelConfig.camera.autoRotate;
      controls.autoRotateSpeed = modelConfig.camera.autoRotateSpeed;
      controls.enableZoom = modelConfig.camera.zoomEnabled;
      
      if (modelConfig.camera.movementLimits) {
        controls.minPolarAngle = modelConfig.camera.movementLimits.y[0];
        controls.maxPolarAngle = modelConfig.camera.movementLimits.y[1];
      }
      
      controls.update();
    }
    
    // Configuração de materiais
    setupMaterials(scene, modelConfig.materialSettings);
    
    // Configuração de ambiente
    setupSkybox(
      scene, 
      renderer, 
      modelConfig.skyboxSettings, 
      modelConfig.materialSettings
    );
    
    // Configuração de fog
    setupFog(scene, modelConfig.fogSettings);
    
    // Configuração de bloom
    setupBloomEffect(
      worldRef.current,
      effectsRef,
      modelConfig.bloomEffect,
      vertexShader,
      fragmentShader
    );
    
    // Configuração de partículas
    setupParticles(scene, modelConfig.renderSettings);
    
    // Configuração de água
    createWaterEffect(scene, modelConfig.water);
    
  }, [sceneConfig, currentModel, isInitialized]); // Só atualiza quando necessário
  
  // Atualiza o mixer de referência quando o mixer no contexto mudar
  useEffect(() => {
    mixerRef.current = mixer;
  }, [mixer]);

  // Manipula mudanças no modo de visualização
  useEffect(() => {
    console.log("Visualization mode changed:", currentMode);
    
    // Atualize a visibilidade ou configurações necessárias com base no modo
    if (worldRef.current && worldRef.current.scene) {
      // Você pode adicionar mais lógica aqui para ajustar a cena com base no modo atual
    }
  }, [currentMode]);

  return <div ref={containerRef} className="scene-container"></div>;
}