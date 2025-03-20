import React, { createContext, useContext, useState } from 'react';
import { useThree } from '@react-three/fiber';

// Definição das configurações padrão
const defaultConfig = {
  common: {
    backgroundColor: "#dddddd",
  },
  model1: {
    backgroundColor: "#dddddd",
    camera: {
      type: "perspective",
      position: [1, 1, 0],
      lookAt: [0, 0.8, 0],
      fov: 75,
      autoRotate: false,
      autoRotateSpeed: 2.0,
      enableZoom: false,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
    },
    renderer: {
      pixelRatio: 1.5,
      antialias: false,
      toneMapping: false,
      outputEncoding: 'sRGB',
      shadowMap: false,
    },
    postProcessing: {
      bloom: {
        enabled: false,
        strength: 0.5,
        radius: 0.4,
        threshold: 0.1,
      },
      fxaa: {
        enabled: false,
      },
      smaa: {
        enabled: false,
      },
    },
    environment: {
      skybox: {
        enabled: false,
        texturePath: "/surround/8.hdr",
        envMapIntensity: 0.8,
      },
      fog: {
        enabled: false,
        color: "#ffffff",
        density: 0.02,
      },
    },
    lighting: {
      ambient: {
        intensity: 0.8,
        color: "#ffffff",
      },
      directional: {
        enabled: false,
        intensity: 1.0,
        position: [0, 20, 10],
        castShadow: false,
        shadowBias: 0,
      },
      hemisphere: {
        enabled: false,
        skyColor: "#ffffff",
        groundColor: "#444444",
        intensity: 1.0,
      },
    },
    materials: {
      transparent: false,
      opacity: 1,
      metalness: 0.02,
      roughness: 0.02,
    },
    animations: {
      enabled: true,
      speed: 1.0,
      currentAnimation: null,
    },
    effects: {
      particles: {
        enabled: false,
        count: 1000,
        size: 0.05,
        type: "generic",
      },
      water: {
        enabled: false,
        color: "#001e0f",
        scale: 4,
      },
    },
    // Status de objetos com efeitos especiais, como bloom
    objectStatus: {},
  },
  model2: {
    // Configurações específicas para o model2
    // Similar ao model1, mas com valores específicos
    camera: {
      type: "perspective",
      position: [1, 1, 0],
      lookAt: [0, 0.8, 0],
      fov: 75,
      autoRotate: true,
      autoRotateSpeed: 2.0,
      enableZoom: false,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
    },
    renderer: {
      pixelRatio: 1.5,
      antialias: false,
      toneMapping: false,
      outputEncoding: 'sRGB',
      shadowMap: false,
    },
    postProcessing: {
      bloom: {
        enabled: false,
        strength: 0.5,
        radius: 0.4,
        threshold: 0.1,
      },
    },
    environment: {
      skybox: {
        enabled: false,
        texturePath: "/surround/8.hdr",
        envMapIntensity: 0.8,
      },
      fog: {
        enabled: false,
        color: "#ffffff",
        density: 0.02,
      },
    },
    lighting: {
      ambient: {
        intensity: 1.45,
        color: "#ffffff",
      },
      directional: {
        enabled: false,
        intensity: 1.0,
        position: [0, 20, 10],
        castShadow: false,
        shadowBias: 0,
      },
    },
    materials: {
      transparent: false,
      opacity: 1,
      metalness: 0.02,
      roughness: 0.02,
    },
    animations: {
      enabled: true,
      speed: 1.0,
      currentAnimation: null,
    },
    effects: {
      particles: {
        enabled: false,
        count: 1000,
        size: 0.05,
        type: "generic",
      },
      water: {
        enabled: false,
        color: "#001e0f",
        scale: 4,
      },
    },
    objectStatus: {},
  },
  both: {
    // Configurações quando ambos os modelos estão visíveis
    camera: {
      type: "perspective",
      position: [10, 15, 40],
      lookAt: [0, 0.8, 0],
      fov: 75,
      autoRotate: true,
      autoRotateSpeed: 1.0,
      enableZoom: true,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI/2,
    },
    renderer: {
      pixelRatio: 1.5,
      antialias: true,
      toneMapping: true,
      outputEncoding: 'sRGB',
      shadowMap: false,
    },
    postProcessing: {
      bloom: {
        enabled: false,
        strength: 0.5,
        radius: 0.4,
        threshold: 0.1,
      },
    },
    environment: {
      skybox: {
        enabled: false,
        texturePath: "/surround/3.hdr",
        envMapIntensity: 0.8,
      },
      fog: {
        enabled: false,
        color: "#ffffff",
        density: 0.02,
      },
    },
    lighting: {
      ambient: {
        intensity: 1.45,
        color: "#ffffff",
      },
      directional: {
        enabled: false,
        intensity: 1.0,
        position: [0, 20, 10],
        castShadow: false,
        shadowBias: 0,
      },
    },
    materials: {
      transparent: false,
      opacity: 1,
      metalness: 0.02,
      roughness: 0.02,
    },
    animations: {
      enabled: true,
      speed: 1.0,
      currentAnimation: null,
    },
    effects: {
      particles: {
        enabled: false,
        count: 1000,
        size: 0.05,
        type: "generic",
      },
      water: {
        enabled: false,
        color: "#001e0f",
        scale: 4,
      },
    },
    objectStatus: {},
  },
};

// Create the context
export const SceneConfigContext = createContext();

// Custom hook for using the scene config
export const useSceneConfig = () => {
  const context = useContext(SceneConfigContext);
  if (!context) {
    throw new Error('useSceneConfig must be used within a SceneConfigProvider');
  }
  return context;
};

// Custom hook for getting the active config based on the current model
export const useActiveConfig = () => {
  const { sceneConfig, currentModel } = useSceneConfig();
  // Merge common config with model-specific config
  return {
    ...sceneConfig.common,
    ...sceneConfig[currentModel]
  };
};

// Custom hook for applying config to the three.js scene
export const useApplySceneConfig = () => {
  const { scene, gl, camera } = useThree();
  const { sceneConfig, currentModel } = useSceneConfig();
  
  const applyConfig = () => {
    const activeConfig = {
      ...sceneConfig.common,
      ...sceneConfig[currentModel]
    };
    
    // Apply background color
    if (activeConfig.backgroundColor) {
      scene.background = new THREE.Color(activeConfig.backgroundColor);
    }
    
    // Apply more configurations as needed...
    
    return activeConfig;
  };
  
  return applyConfig;
};

// Provider component
export const SceneConfigProvider = ({ children }) => {
  const [sceneConfig, setSceneConfig] = useState(defaultConfig);
  const [currentModel, setCurrentModel] = useState('both');
  
  // Function to update a specific part of the config
  const updateConfig = (modelType, section, values) => {
    setSceneConfig(prev => ({
      ...prev,
      [modelType]: {
        ...prev[modelType],
        [section]: {
          ...prev[modelType][section],
          ...values
        }
      }
    }));
  };
  
  // Function to update bloom status for an object
  const updateObjectStatus = (modelType, objectId, status) => {
    setSceneConfig(prev => ({
      ...prev,
      [modelType]: {
        ...prev[modelType],
        objectStatus: {
          ...prev[modelType].objectStatus,
          [objectId]: {
            ...prev[modelType].objectStatus[objectId],
            ...status
          }
        }
      }
    }));
  };
  
  // Toggle oscillation for an object
  const toggleObjectOscillation = (modelType, objectId, objectName, shouldOscillate) => {
    updateObjectStatus(modelType, objectId, {
      name: objectName,
      oscillate: shouldOscillate
    });
  };
  
  const value = {
    sceneConfig,
    setSceneConfig,
    currentModel,
    setCurrentModel,
    updateConfig,
    updateObjectStatus,
    toggleObjectOscillation
  };
  
  return (
    <SceneConfigContext.Provider value={value}>
      {children}
    </SceneConfigContext.Provider>
  );
};