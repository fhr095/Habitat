import { useEffect, useState, useContext, useRef } from "react";
import { useAnimations } from "../../../../context/AnimationContext";
import { SceneConfigContext } from "../../../../context/SceneConfigContext"; // Importa o contexto de configuração da cena
import { ModelContext } from "../../../../context/ModelContext";
import LoadModel from "./LoadModel/LoadModel";
import * as THREE from "three";

export default function Model1({ modelUrl, components, world, onLoad }) {
  const [isLoading, setIsLoading] = useState(false);
  const isModelLoadedRef = useRef(false); // Referência para rastrear o carregamento
  const { setAnimations, setMixer } = useAnimations();
  const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext); // Para aplicar configurações específicas da cena
  const { currentModel } = useContext(ModelContext); // Controla qual modelo está sendo exibido (model1, model2, etc.)
  const modelRef = useRef(null);

  useEffect(() => {
    console.log("Model1 useEffect executado com modelUrl:", modelUrl);
    let isMounted = true;

    async function fetchModel() {
      if (
        !isModelLoadedRef.current && // Carrega apenas se ainda não foi carregado
        modelUrl &&
        modelUrl.length > 0 &&
        components &&
        world &&
        !isLoading
      ) {
        console.log("Carregando o modelo em Model1...");
        setIsLoading(true);

        try {
          const { scene, animations: loadedAnimations, initialStatus } = await LoadModel(
            modelUrl,
            components,
            world
          );

          if (isMounted && scene) {
            modelRef.current = scene;
            world.scene.add(scene);

            // Controla a visibilidade inicial
            scene.visible = currentModel === "model1" || currentModel === "both";
            console.log("Model1: modelo carregado e adicionado à cena");

            //scene.position.set(-18,7,2)
            //scene.position.set(4.88,1,-21)
            //scene.rotation.y = Math.PI/2;

            // Armazena animações e mixer
            if (loadedAnimations && loadedAnimations.length > 0) {
              const mixerInstance = new THREE.AnimationMixer(scene);
              setAnimations(loadedAnimations);
              setMixer(mixerInstance);
            }

            // Atualiza as configurações da cena com o status inicial do modelo
            if (initialStatus) {
              setSceneConfig((prevConfig) => ({
                ...prevConfig,
                both: { // Aplica as configurações específicas para o modelo 1
                  ...prevConfig.both,
                  bloomEffect: {
                    ...prevConfig.both.bloomEffect,
                    status: initialStatus,
                  },
                  /*renderSettings: {
                    ...prevConfig.both.renderSettings,
                    envMapIntensity: 0.79, // Armazena os objetos no contexto
                  },*/
                  // Aqui você pode incluir qualquer outra configuração que dependa do estado do modelo carregado
                },
                model1: { // Aplica as configurações específicas para o modelo 1
                  ...prevConfig.model1,
                  bloomEffect: {
                    ...prevConfig.model1.bloomEffect,
                    status: initialStatus,
                  },
                  renderSettings: {
                    ...prevConfig.model1.renderSettings,
                    envMapIntensity: 0.79, // Armazena os objetos no contexto
                  },}
              }));
              console.log("Estado inicial dos objetos armazenado no contexto:", initialStatus);
            }            
          

            isModelLoadedRef.current = true; // Marca como carregado

            if (onLoad) onLoad();
          }
        } catch (error) {
          console.error("Erro ao carregar o modelo:", error);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else {
        console.log("Condições não satisfeitas para carregar o modelo em Model1 ou já carregado");
      }
    }

    fetchModel();

    return () => {
      isMounted = false;
    };
  }, [modelUrl, components, world, sceneConfig, setSceneConfig]); // Inclui `sceneConfig` e `setSceneConfig` nas dependências para garantir que as configurações sejam aplicadas quando mudarem

  // Controle de visibilidade
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.visible = currentModel === "model1" || currentModel === "both";
    }
  }, [currentModel]);

  return null;
}
