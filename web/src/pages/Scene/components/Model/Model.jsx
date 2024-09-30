import { useEffect, useState, useContext } from "react";
import { useAnimations } from "../../../../context/AnimationContext"; // Importa o contexto de animações
import { SceneConfigContext } from "../../../../context/SceneConfigContext"; // Importa o contexto de configuração da cena
import LoadModel from "./LoadModel/LoadModel";
import * as THREE from "three";

export default function Model({ modelUrl, components, world, setArrayName, onLoad }) {
  const [isLoading, setIsLoading] = useState(false);
  const { setAnimations, setMixer } = useAnimations(); // Pega as funções `setAnimations` e `setMixer` do contexto
  const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext); // Pega a função `setSceneConfig` do contexto

  useEffect(() => {
    let isMounted = true;
  
    async function fetchModel() {
      if (modelUrl && components && world && !isLoading) {
        setIsLoading(true);
        console.log("Iniciando o carregamento do modelo:", modelUrl);
  
        try {
          // Carrega o modelo e captura as animações e o estado inicial dos objetos
          const { scene, animations: loadedAnimations, initialStatus } = await LoadModel(modelUrl, components, world, setArrayName);
          
          // Armazena as animações no contexto
          if (/*isMounted && */loadedAnimations) {
            setAnimations(loadedAnimations); 
            console.log("Animações carregadas e armazenadas no contexto:", loadedAnimations);
          }

          // Inicializa o mixer e armazena no contexto
          if (/*isMounted && */scene && loadedAnimations.length > 0) {
            const mixerInstance = new THREE.AnimationMixer(scene);
            setMixer(mixerInstance);
            console.log("AnimationMixer criado e armazenado no contexto.");
          }

          // Armazena o estado inicial dos objetos no contexto
          if (/*isMounted &&*/ initialStatus) {
            setSceneConfig((prevConfig) => ({
              ...prevConfig,
              bloomEffect: {
                ...prevConfig.bloomEffect,
                status: initialStatus, // Armazena os objetos no contexto
              },
            }));
            console.log("Estado inicial dos objetos armazenado no contexto:", initialStatus);
            setSceneConfig((prevConfig) => ({
              ...prevConfig,
              renderSettings: {
                ...prevConfig.renderSettings,
                envMapIntensity: 0.79, // Armazena os objetos no contexto
              },
            }));
          }

          if (onLoad) {
            onLoad(); // Marca o modelo como carregado
          }
        } catch (error) {
          console.error("Erro ao carregar o modelo:", error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    }
  
    fetchModel();
  
    return () => {
      isMounted = false;
    };
  }, [modelUrl, components, world, setArrayName, onLoad, setAnimations, setMixer, sceneConfig]);

  return null; // Este componente não renderiza nada visualmente
}
