import React, { useEffect, useState, useRef, useContext } from "react";
import { useAnimations } from "../../../../context/AnimationContext";
import { useSceneConfig } from "../../../../context/SceneConfigContext";
import { ModelContext } from "../../../../context/ModelContext";
import LoadModel from "./LoadModel/LoadModel";
import * as THREE from "three";

export default function Model2({ modelUrl, components, world, onLoad }) {
  const [isLoading, setIsLoading] = useState(false);
  const { setAnimations, setMixer } = useAnimations();
  const { updateConfig } = useSceneConfig();
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

          if (scene) {
            modelRef.current = scene;
            world.scene.add(scene);
            scene.position.set(0, 0, 0);

            // Controla a visibilidade inicial
            scene.visible = currentModel === "model2" || currentModel === "both";
            console.log("Model2: modelo carregado e adicionado à cena");

            // Armazena animações e mixer
            if (loadedAnimations && loadedAnimations.length > 0) {
              const mixerInstance = new THREE.AnimationMixer(scene);
              setAnimations(loadedAnimations);
              setMixer(mixerInstance);
            }

            if (initialStatus) {
              // Atualiza o contexto com o status inicial do modelo, se disponível
              updateConfig('model2', 'bloomEffect', {
                status: initialStatus
              });
              
              console.log("Estado inicial dos objetos armazenado no contexto:", initialStatus);
            }

            // Aqui passamos a cena carregada para o callback
            if (onLoad) onLoad(scene);
          }
        } catch (error) {
          console.error("Erro ao carregar o modelo:", error);
        } finally {
          if (isMounted) setIsLoading(false);
          
          // Atualização adicional para o modo 'both' se necessário
          updateConfig('both', null, {});
        }
      } else {
        console.log("Condições não satisfeitas para carregar o modelo em Model2");
      }
    }

    fetchModel();

    return () => {
      isMounted = false;
    };
  }, [modelUrl, components, world, updateConfig]);

  // Controle de visibilidade baseado no modelo atual selecionado
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.visible = currentModel === "model2" || currentModel === "both";
    }
  }, [currentModel]);

  return null;
}