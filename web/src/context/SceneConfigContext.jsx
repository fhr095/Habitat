import React, { createContext, useState } from 'react';

// Cria o Contexto para as Configurações de Cena
export const SceneConfigContext = createContext();

export const SceneConfigProvider = ({ children }) => {
  // Estado que armazenará as opções de configuração da cena
  const [sceneConfig, setSceneConfig] = useState({
    backgroundColor: "#222222",
    camera: {
      type: "perspective",
      position: { x: 1, y: 1, z: 0 },
      direction: { x: 0, y: 0.8, z: 0 },
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
      envMapIntensity: 0.8, // Adicionado controle de intensidade do envMap
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
    water: {
      enabled: false,
      color: "#001e0f",
      scale: 4,
    },
    skyboxSettings: {
      enabled: true,
      texturePath: "/surround/8.hdr",
      environmentMapEnabled: true,
    },
    bloomEffect: {
      enabled: true,
      strength: 0.5,
      radius: 0.4,
      threshold: 0.1,
      status: {
        "a4c36120-ea7c-42ac-ba92-b0d1ef736e8a": {
            "name": "Plane",
            "status": false
        },
        "4666cc28-5cad-4ac9-a949-215589c294d8": {
            "name": "Cabeca-Robo",
            "status": true
        },
        "f07d77d4-d371-4955-967f-d90ac658163c": {
            "name": "Peito",
            "status": true
        },
        "e75071d0-376a-4688-aa14-450d3170229c": {
            "name": "Robo-CabFrente",
            "status": true
        },
        "6594bfbf-9147-4da5-b7b2-dd0141e78b04": {
            "name": "Robo-Corpo",
            "status": false
        },
        "bd3184d5-c67f-4072-a18c-7af6c8bc30e0": {
            "name": "Robo-Corpo002",
            "status": false
        }
    },
    }
  });
  
  return (
    <SceneConfigContext.Provider value={{ sceneConfig, setSceneConfig }}>
      {children}
    </SceneConfigContext.Provider>
  );
};
