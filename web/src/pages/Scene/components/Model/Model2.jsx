import { useEffect, useState, useContext, useRef } from "react";
import { useAnimations } from "../../../../context/AnimationContext";
import { SceneConfigContext } from "../../../../context/SceneConfigContext";
import { ModelContext } from "../../../../context/ModelContext";
import LoadModel from "./LoadModel/LoadModel";
import * as THREE from "three";

export default function Model2({ modelUrl, components, world, onLoad }) {
  const [isLoading, setIsLoading] = useState(false);
  const { setAnimations, setMixer } = useAnimations();
  const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext);
  const { currentModel } = useContext(ModelContext);
  const modelRef = useRef(null);

  useEffect(() => {
    console.log("Model2 useEffect executado com modelUrl:", modelUrl);
    let isMounted = true;

    async function fetchModel() {
      if (modelUrl && modelUrl.length > 0 && components && world && !isLoading) {
        console.log("Carregando o modelo em Model2...");
        setIsLoading(true);

        try {
          const { scene, animations: loadedAnimations, initialStatus } = await LoadModel(
            modelUrl,
            components,
            world
          );

          if (/*isMounted &&*/ scene) {
            modelRef.current = scene;
            world.scene.add(scene);

            // Controla a visibilidade inicial
            scene.visible = currentModel === "model2" /*|| currentModel === "both"*/;
            console.log("Model2: modelo carregado e adicionado à cena");

            // Armazena animações e mixer
            if (loadedAnimations && loadedAnimations.length > 0) {
              const mixerInstance = new THREE.AnimationMixer(scene);
              setAnimations(loadedAnimations);
              setMixer(mixerInstance);
            }

            // Atualiza as configurações da cena com o status inicial do modelo
            
            if (initialStatus) {
              /*setSceneConfig((prevConfig) => ({
                ...prevConfig,
                both: {
                  // Preserve existing configurations in 'both'
                  ...prevConfig.both,
                  bloomEffect: {
                    // Preserve existing bloomEffect configurations
                    ...prevConfig.both.bloomEffect,
                    status: {
                      // Merge existing status entries
                      ...prevConfig.both.bloomEffect.status,
                      // Add new entries from initialStatus
                      ...initialStatus,
                    },
                  },
                

                  
                  
                
                  renderSettings: {
                    ...prevConfig.both.renderSettings,
                    envMapIntensity: 0.79, // Armazena os objetos no contexto
                  },
                  // Aqui você pode incluir qualquer outra configuração que dependa do estado do modelo carregado
                },
                model2: { // Aplica as configurações específicas para o modelo 1
                  ...prevConfig.model2,
                  bloomEffect: {
                    ...prevConfig.model2.bloomEffect,
                    status: initialStatus,
                  },}
              }));*/
              console.log("Estado inicial dos objetos armazenado no contexto:", initialStatus);
            }

            if (onLoad) onLoad();
          }
        } catch (error) {
          console.error("Erro ao carregar o modelo:", error);
        } finally {
          if (isMounted) setIsLoading(false);
          setSceneConfig((prevConfig) => ({
            ...prevConfig,
            both: {
              // Preserve existing configurations in 'both'
              ...prevConfig.both,                  

              
              
            
              /*renderSettings: {
                ...prevConfig.both.renderSettings,
                envMapIntensity: 0.21, // Armazena os objetos no contexto
              },*/
              
              
              // Aqui você pode incluir qualquer outra configuração que dependa do estado do modelo carregado
            },  
            /*model2: {
              // Preserve existing configurations in 'both'
              ...prevConfig.both,                  

              
              
            
              backgroundColor: "#dddddd",}     */   
          }));
        }
      } else {
        console.log("Condições não satisfeitas para carregar o modelo em Model2");
      }
    }

    fetchModel();

    return () => {
      isMounted = false;
    };
  }, [modelUrl, components, world, sceneConfig, setSceneConfig]);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.visible = currentModel === "model2" /*|| currentModel === "both"*/;
    }
  }, [currentModel]);

  return null;
}
