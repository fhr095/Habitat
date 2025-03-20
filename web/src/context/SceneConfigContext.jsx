import React, { createContext, useState, useContext } from 'react';
import * as THREE from 'three';

// Cria o Contexto para as Configurações de Cena
export const SceneConfigContext = createContext();

// Hook personalizado para facilitar o uso do contexto
export const useSceneConfig = () => useContext(SceneConfigContext);

// Configurações default organizadas por categorias
const defaultConfig = {
  common: {
    backgroundColor: "#dddddd",
  },
  model1: {
    backgroundColor: "#dddddd",
    camera: {
      type: "perspective",
      position: { x: 1, y: 1, z: 0 },
      direction: { x: 0, y: 0.8, z: 0 },
      autoRotate: false,
      autoRotateSpeed: 2.0,
      zoomEnabled: false,
      movementLimits: { y: [0, Math.PI] },
    },
    renderSettings: {
      pixelRatio: 1.5,
      antiAliasingEnabled: false,
      lodEnabled: false,
      lodDistance: 50,
      ambientOcclusionEnabled: false,
      particlesEnabled: false,
      particleCount: 1000,
      particleSize: 0.05,
      particleEffectType: "generic",
      toneMappingEnabled: false,
      envMapIntensity: 0.8,
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
      enabled: false,
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
      type: "ambient",
      intensity: 0.8,
      position: { x: 0, y: 20, z: 10 },
      shadowsEnabled: false,
      shadowIntensity: 0.5,
      quantity: 1,
    },
    materialSettings: {
      transparencyEnabled: false,
      materialOpacity: 1,
      metalness: 0.02,
      roughness: 0.02,
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
      position: { x: 1, y: 1, z: 0 },
      direction: { x: 0, y: 0.8, z: 0 },
      autoRotate: true,
      autoRotateSpeed: 2.0,
      zoomEnabled: false,
      movementLimits: { y: [0, Math.PI] },
    },
    renderSettings: {
      pixelRatio: 1.5,
      antiAliasingEnabled: false,
      lodEnabled: false,
      lodDistance: 50,
      ambientOcclusionEnabled: false,
      particlesEnabled: false,
      particleCount: 1000,
      particleSize: 0.05,
      particleEffectType: "generic",
      toneMappingEnabled: false,
      envMapIntensity: 0.8,
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
      enabled: false,
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
      type: "ambient",
      intensity: 1.45,
      position: { x: 0, y: 20, z: 10 },
      shadowsEnabled: false,
      shadowIntensity: 0.5,
      quantity: 1,
    },
    materialSettings: {
      transparencyEnabled: false,
      materialOpacity: 1,
      metalness: 0.02,
      roughness: 0.02,
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
      position: { x: 10, y: 15, z: 40 },
      direction: { x: 0, y: 0.8, z: 0 },
      autoRotate: true,
      autoRotateSpeed: 1.0,
      zoomEnabled: true,
      movementLimits: { y: [0, Math.PI/2] },
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
      toneMappingEnabled: true,
      envMapIntensity: 0.8,
    },
    water: {
      enabled: false,
      color: "#001e0f",
      scale: 4,
    },
    skyboxSettings: {
      enabled: false,
      texturePath: "/surround/3.hdr",
      environmentMapEnabled: false,
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
      density: 0.02,
    },
    light: {
      type: "ambient",
      intensity: 1.45,
      position: { x: 0, y: 20, z: 10 },
      shadowsEnabled: false,
      shadowIntensity: 0.5,
      quantity: 8,
    },
    materialSettings: {
      transparencyEnabled: false,
      materialOpacity: 1,
      metalness: 0.02,
      roughness: 0.02,
    },
    animation: {
      enabled: true,
      speed: 1.0,
      smoothness: 1.0,
    },
  },
};

export const SceneConfigProvider = ({ children }) => {
  // Referências para os objetos principais da cena
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [controls, setControls] = useState(null);
  const [renderer, setRenderer] = useState(null);
  
  // Estado que armazenará as opções de configuração da cena
  const [sceneConfig, setSceneConfig] = useState(defaultConfig);
  
  // Função para atualizar configurações de forma mais simples e estruturada
  const updateConfig = (modelType, section, updates) => {
    setSceneConfig(prevConfig => {
      if (!prevConfig[modelType]) return prevConfig;
      
      // Se não há seção específica, atualiza o modelo diretamente
      if (!section) {
        return {
          ...prevConfig,
          [modelType]: {
            ...prevConfig[modelType],
            ...updates
          }
        };
      }
      
      // Atualiza a seção específica dentro do modelo
      return {
        ...prevConfig,
        [modelType]: {
          ...prevConfig[modelType],
          [section]: {
            ...prevConfig[modelType][section],
            ...updates
          }
        }
      };
    });
  };
  
  // Função para atualizar status específico de objeto (para bloom, etc.)
  const updateObjectStatus = (modelType, uuid, newStatus) => {
    setSceneConfig(prevConfig => {
      const modelConfig = prevConfig[modelType];
      if (!modelConfig || !modelConfig.bloomEffect) return prevConfig;
      
      return {
        ...prevConfig,
        [modelType]: {
          ...modelConfig,
          bloomEffect: {
            ...modelConfig.bloomEffect,
            status: {
              ...modelConfig.bloomEffect.status,
              [uuid]: {
                ...modelConfig.bloomEffect.status[uuid],
                ...newStatus
              }
            }
          }
        }
      };
    });
  };
  
  return (
    <SceneConfigContext.Provider value={{ 
      // Configurações
      sceneConfig, 
      setSceneConfig,
      updateConfig,
      updateObjectStatus,
      // Objetos da cena
      scene, setScene,
      camera, setCamera,
      controls, setControls,
      renderer, setRenderer
    }}>
      {children}
    </SceneConfigContext.Provider>
  );
};