// Model1.jsx
import { useEffect, useState, useContext } from "react";
import { useAnimations } from "../../../../context/AnimationContext"; // Importa o contexto de animações
import { SceneConfigContext } from "../../../../context/SceneConfigContext"; // Importa o contexto de configuração da cena
import { ModelContext } from "../../../../context/ModelContext"; // Importa o contexto do modelo atual
import LoadModel from "./LoadModel/LoadModel";
import * as THREE from "three";

export default function Model1({ modelUrl, components, world, setArrayName, onLoad }) {
  const [isLoading, setIsLoading] = useState(false);
  const { setAnimations, setMixer } = useAnimations(); // Pega as funções do contexto de animações
  const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext); // Pega o contexto de configuração da cena
  const { currentModel } = useContext(ModelContext); // Pega o modelo atual do contexto de modelos

  useEffect(() => {
    let isMounted = true;
    console.log("OIIIII", modelUrl)
    async function fetchModel() {
      if (
        currentModel &&
        sceneConfig[currentModel] && modelUrl &&
        components &&
        world &&
        !isLoading
      ) {
        setIsLoading(true);

        console.log(`Iniciando o carregamento do modelo: ${currentModel}, URL: ${modelUrl}`);

        try {
          // Carrega o modelo e captura as animações e o estado inicial dos objetos
          const { scene, animations: loadedAnimations, initialStatus } = await LoadModel(
            modelUrl,
            components,
            world,
            setArrayName
          );

          // Armazena as animações no contexto de animações
          if (isMounted && loadedAnimations) {
            setAnimations(loadedAnimations);
            console.log("Animações carregadas e armazenadas no contexto:", loadedAnimations);
          }

          // Inicializa o mixer e armazena no contexto de animações
          if (isMounted && scene && loadedAnimations.length > 0) {
            const mixerInstance = new THREE.AnimationMixer(scene);
            setMixer(mixerInstance);
            console.log("AnimationMixer criado e armazenado no contexto.");
          }

          // Armazena o estado inicial dos objetos no contexto de configuração da cena
          if (isMounted && initialStatus) {
            setSceneConfig((prevConfig) => ({
              ...prevConfig,
              [currentModel]: {
                ...prevConfig[currentModel],
                bloomEffect: {
                  ...prevConfig[currentModel].bloomEffect,
                  status: initialStatus,
                },
              },
            }));
            console.log("Estado inicial dos objetos armazenado no contexto:", initialStatus);
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
  }, [
    currentModel,
    sceneConfig,
    components,
    world,
    onLoad,
    setAnimations,
    setMixer,
    setSceneConfig,
  ]);

  return null; // Este componente não renderiza nada visualmente
}
