import { useEffect, useState, useContext, useRef } from "react";
import { useAnimations } from "../../../../context/AnimationContext";
import { SceneConfigContext } from "../../../../context/SceneConfigContext"; // Importa o contexto de configuração da cena
import { ModelContext } from "../../../../context/ModelContext";
import LoadModel from "./LoadModel/LoadModel";
import * as THREE from "three";

export default function Model1({ modelUrl, components, world, onLoad }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false); // Novo estado para rastrear se o modelo foi carregado
  const isModelLoadedRef = useRef(false); // Referência para rastrear o carregamento
  const { setAnimations, setMixer } = useAnimations();
  const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext); // Para aplicar configurações específicas da cena
  const { currentModel } = useContext(ModelContext); // Controla qual modelo está sendo exibido (model1, model2, etc.)
  const modelRef = useRef(null);

  // Função para atualizar a posição do modelo
  const updateModelPosition = () => {
    if (modelRef.current) {
      const scene = modelRef.current;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Calcula a largura de referência com base na altura atual
      const baseWindowWidth = (1366 / 768) * windowHeight;

      let basePositionX;
      let positionY;
      let positionZ;

      if (windowHeight > windowWidth) {
        // Orientação retrato
        basePositionX = 3;
        positionY = 0;
        positionZ = -2.5;
      } else {
        // Orientação paisagem
        basePositionX = 2;
        positionY = -0.5;
        positionZ = -2;
      }

      // Calcula a nova posição X proporcional à largura da janela
      const newPositionX = basePositionX * (windowWidth / baseWindowWidth);

      // Atualiza a posição do modelo
      scene.position.set(newPositionX, positionY, positionZ);

      // Ajusta a rotação, se necessário
      scene.rotation.y = -Math.PI / 1.2;
    }
  };

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
            //world.scene.add(scene);
            //scene.frustumCulled = false
            world.camera.add(scene);
            world.scene.add(world.camera);

            // Garante que o modelo mantenha a rotação fixa, se necessário
            scene.onBeforeRender = () => {
              scene.rotation.copy(new THREE.Euler(0, 0, 0));
            };

            scene.traverse((child) => {
              console.log("Child in Model1:", child.name, child);
            });

            // Controla a visibilidade inicial
            scene.visible = true;
            console.log("Model1: modelo carregado e adicionado à cena");

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
                both: {
                  // Aplica as configurações específicas para o modelo 1
                  ...prevConfig.both,
                  bloomEffect: {
                    ...prevConfig.both.bloomEffect,
                    status: initialStatus,
                  },
                },
                model1: {
                  // Aplica as configurações específicas para o modelo 1
                  ...prevConfig.model1,
                  bloomEffect: {
                    ...prevConfig.model1.bloomEffect,
                    status: initialStatus,
                  },
                  renderSettings: {
                    ...prevConfig.model1.renderSettings,
                    envMapIntensity: 0.79, // Armazena os objetos no contexto
                  },
                },
              }));
              console.log("Estado inicial dos objetos armazenado no contexto:", initialStatus);
            }

            isModelLoadedRef.current = true; // Marca como carregado
            setIsModelLoaded(true); // Atualiza o estado para indicar que o modelo foi carregado

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
  }, [modelUrl, components, world, sceneConfig, setSceneConfig]);

  // Controle de visibilidade do modelo
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.visible = currentModel === "model1" || currentModel === "both";
    }
  }, [currentModel]);

  // Atualiza a posição do modelo quando ele é carregado ou quando a janela é redimensionada
  useEffect(() => {
    if (isModelLoaded) {
      // Atualiza a posição inicialmente
      updateModelPosition();

      // Adiciona event listeners para atualizar a posição ao redimensionar a janela ou mudar a orientação
      window.addEventListener("resize", updateModelPosition);
      window.addEventListener("orientationchange", updateModelPosition);

      // Limpa os event listeners ao desmontar o componente
      return () => {
        window.removeEventListener("resize", updateModelPosition);
        window.removeEventListener("orientationchange", updateModelPosition);
      };
    }
  }, [isModelLoaded]);

  return null;
}
