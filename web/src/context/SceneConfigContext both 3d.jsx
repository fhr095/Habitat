import React, { createContext, useState } from 'react';




// Cria o Contexto para as Configurações de Cena
export const SceneConfigContext = createContext();


export const SceneConfigProvider = ({ children }) => {
  // Adicionar os estados para armazenar 'scene', 'camera', e 'controls'
const [scene, setScene] = useState(null);
const [camera, setCamera] = useState(null);
const [controls, setControls] = useState(null);
  // Estado que armazenará as opções de configuração da cena
  const [sceneConfig, setSceneConfig] = useState({
    common: {
      backgroundColor: "#dddddd",
    },
    model1: {
      camera: {
        type: "perspective",
        position: { x: 1, y: 1, z: 0 },
        direction: { x: 0, y: 0.8, z: 0 },
        autoRotate: false,
        autoRotateSpeed: 2.0,
        zoomEnabled: false,
        movementLimits: { y: [0, Math.PI] }, // Adicionado movimento de limite padrão
      },
      renderSettings: {
        pixelRatio: 1.5,
        antiAliasingEnabled: true,
        lodEnabled: false,
        lodDistance: 50,
        ambientOcclusionEnabled: false,
        particlesEnabled: false,
        particleCount: 1000,
        particleSize: 0.05,
        particleEffectType: "generic",
        toneMappingEnabled: true, // Adicionado para controle do tone mapping
        envMapIntensity: 0.8, // Adicionado controle de intensidade do envMap
      },
      water: {
        enabled: false,
        color: "#001e0f",
        scale: 4,
      },
      skyboxSettings: {
        enabled: false,
        texturePath: "/surround/8.hdr",
        environmentMapEnabled: false,
      },
      bloomEffect: {
        enabled: true,
        strength: 0.5,
        radius: 0.4,
        threshold: 0.1,
        status: {},
      },
      fogSettings: {
        enabled: false,
        color: "#ffffff",
        density: 0.02,
      },
      light: {
        type: "directional",
        intensity: 0.45,
        position: { x: 0, y: 20, z: 10 },
        shadowsEnabled: true,
        shadowIntensity: 0.5,
        quantity: 1,
      },
      materialSettings: {
        transparencyEnabled: true,
        materialOpacity: 1,
        metalness: 0.02, // Adicionado controle de metalness
        roughness: 0.02, // Adicionado controle de roughness
      },
      animation: {
        enabled: true,
        speed: 1.0,
        smoothness: 1.0,
      },
    },
    model2: {
      camera: {
        type: "perspective",
        position: { x: 4.9, y: 2, z: -22 },
        direction: { x: 4, y: -3.2, z: 0 },
        autoRotate: false,
        autoRotateSpeed: 2.0,
        zoomEnabled: true,
        movementLimits: { y: [0, Math.PI] }, // Adicionado movimento de limite padrão
      },
      renderSettings: {
        pixelRatio: 1.5,
        antiAliasingEnabled: true,
        lodEnabled: false,
        lodDistance: 50,
        ambientOcclusionEnabled: false,
        particlesEnabled: false,
        particleCount: 1000,
        particleSize: 0.05,
        particleEffectType: "generic",
        toneMappingEnabled: true, // Adicionado para controle do tone mapping
        envMapIntensity: 0.2, // Adicionado controle de intensidade do envMap
      },
      water: {
        enabled: false,
        color: "#001e0f",
        scale: 4,
      },
      skyboxSettings: {
        enabled: false,
        texturePath: "/surround/3.hdr",
        environmentMapEnabled: true,
      },
      bloomEffect: {
        enabled: false,
        strength: 0.5,
        radius: 0.4,
        threshold: 0.1,
        status: {},
      },
      fogSettings: {
        enabled: false,
        color: "#ffffff",
        density: 0.058,
      },
      light: {
        type: "directional",
        intensity: 0.45,
        position: { x: 0, y: 20, z: 10 },
        shadowsEnabled: true,
        shadowIntensity: 0.5,
        quantity: 1,
      },
      materialSettings: {
        transparencyEnabled: false,
        materialOpacity: 1,
        metalness: 0.99, // Adicionado controle de metalness
        roughness: 0.1, // Adicionado controle de roughness
      },
      animation: {
        enabled: true,
        speed: 1.0,
        smoothness: 1.0,
      },
    },
    both: {
      camera: {
        type: "perspective",
        position: { x: 4.9, y: 2, z: -22 },
        direction: { x: 4, y: -3.2, z: 0 },
        autoRotate: false,
        autoRotateSpeed: 2.0,
        zoomEnabled: false,
        //movementLimits: { y: [0, Math.PI] }, // Adicionado movimento de limite padrão
       movementLimits: { y: [1.34,1.34] },
      },
      renderSettings: {
        pixelRatio: 1.5,
        antiAliasingEnabled: true,
        lodEnabled: false,
        lodDistance: 50,
        ambientOcclusionEnabled: false,
        particlesEnabled: false,
        particleCount: 1000,
        particleSize: 0.05,
        particleEffectType: "generic",
        toneMappingEnabled: true, // Adicionado para controle do tone mapping
        envMapIntensity: 0.2, // Adicionado controle de intensidade do envMap
      },
      water: {
        enabled: false,
        color: "#001e0f",
        scale: 4,
      },
      skyboxSettings: {
        enabled: true,
        texturePath: "/surround/3.hdr",
        environmentMapEnabled: true,
      },
      bloomEffect: {
        enabled: true,
        strength: 0.5,
        radius: 0.4,
        threshold: 0.1,
        status: {},
      },
      fogSettings: {
        enabled: false,
        color: "#ffffff",
        density: 0.058,
      },
      light: {
        type: "directional",
        intensity: 0.45,
        position: { x: 0, y: 20, z: 10 },
        shadowsEnabled: true,
        shadowIntensity: 0.5,
        quantity: 1,
      },
      materialSettings: {
        transparencyEnabled: false,
        materialOpacity: 1,
        metalness: 0.99, // Adicionado controle de metalness
        roughness: 0.1, // Adicionado controle de roughness
      },
      animation: {
        enabled: true,
        speed: 1.0,
        smoothness: 1.0,
      },
    },
  });
  
  return (
    <SceneConfigContext.Provider value={{ 
      sceneConfig, 
      setSceneConfig,
      scene, setScene,
      camera, setCamera,
      controls, setControls }}>
      {children}
    </SceneConfigContext.Provider>
  );
};

