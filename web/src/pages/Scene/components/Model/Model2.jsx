import React, { useEffect, useState, useRef, useContext } from "react";
import { useAnimations } from "../../../../context/AnimationContext";
import { useSceneConfig } from "../../../../context/SceneConfigContext";
import { ModelContext } from "../../../../context/ModelContext";
import { useVisualizationMode } from "../../../../context/VisualizationModeContext";
import LoadModel from "./LoadModel/LoadModel";
import * as THREE from "three";
import { registerOriginalModel } from "../../utils/SketchModeRecovery";

export default function Model2({ modelUrl, components, world, onLoad }) {
  const [isLoading, setIsLoading] = useState(false);
  const { setAnimations, setMixer } = useAnimations();
  const { updateConfig } = useSceneConfig();
  const { currentModel } = useContext(ModelContext);
  const { currentMode } = useVisualizationMode();
  const modelRef = useRef(null);
  const loadedFlagRef = useRef(false);
  const materialCacheRef = useRef(new Map());

  useEffect(() => {
    console.log("Model2 useEffect executado com modelUrl:", modelUrl);
    let isMounted = true;

    async function fetchModel() {
      if (modelUrl && modelUrl.length > 0 && components && world && !isLoading && !loadedFlagRef.current) {
        console.log("Carregando o modelo em Model2...");
        setIsLoading(true);

        try {
          const { scene, animations: loadedAnimations, initialStatus } = await LoadModel(
            modelUrl,
            components,
            world
          );

          if (scene) {
            // Armazenar referência do modelo
            modelRef.current = scene;
            
            // Salvar materiais originais para restauração posterior
            scene.traverse(child => {
              if (child.isMesh && child.material) {
                // Salvar o material original para restaurar depois, se necessário
                materialCacheRef.current.set(child.uuid, child.material.clone());
              }
            });
            
            // Adicionar modelo à cena
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

            // Registra o modelo no cache global para acesso fácil e recuperação
            registerOriginalModel(scene, world.scene);
            console.log("Modelo registrado no sistema de recuperação");

            // Marcar como carregado para evitar carregamentos duplicados
            loadedFlagRef.current = true;

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
  }, [modelUrl, components, world, updateConfig, onLoad]);

  // Controle de visibilidade baseado no modelo atual selecionado
  useEffect(() => {
    // Só atualiza se o modelo foi carregado
    if (modelRef.current) {
      const shouldBeVisible = currentModel === "model2" || currentModel === "both";
      
      // Só atualiza se mudou o estado de visibilidade e estamos no modo normal
      if (modelRef.current.visible !== shouldBeVisible && currentMode === 'normal') {
        console.log(`Atualizando visibilidade do modelo para: ${shouldBeVisible}`);
        modelRef.current.visible = shouldBeVisible;
        
        // Em caso de problemas com materiais, restaura os originais
        if (shouldBeVisible) {
          modelRef.current.traverse(child => {
            if (child.isMesh) {
              // Se o mesh está com material ausente e temos ele no cache
              if ((!child.material || child.material.dispose) && materialCacheRef.current.has(child.uuid)) {
                // Restaurar material do cache
                child.material = materialCacheRef.current.get(child.uuid).clone();
                console.log(`Material restaurado para: ${child.name}`);
              }
              
              // Garantir que o objeto está visível a menos que seja "Plane"
              if (child.name !== "Plane") {
                child.visible = true;
              }
            }
          });
        }
      }
    }
  }, [currentModel, currentMode]);

  // Efeito adicional para monitorar mudanças de modo
  useEffect(() => {
    // Se estamos voltando para o modo normal, certifique-se de que o modelo esteja visível
    if (currentMode === 'normal' && modelRef.current) {
      // Garantir que o modelo está na cena
      if (modelRef.current.parent !== world?.scene && world?.scene) {
        world.scene.add(modelRef.current);
        console.log("Modelo readicionado à cena após mudança de modo");
      }
      
      // Atualizar visibilidade
      const shouldBeVisible = currentModel === "model2" || currentModel === "both";
      modelRef.current.visible = shouldBeVisible;
      
      if (shouldBeVisible) {
        // Forçar visibilidade de todos os filhos relevantes
        modelRef.current.traverse(child => {
          if (child.isMesh || child.isGroup) {
            // Remover flags de ocultação
            if (child.userData && child.userData._hiddenBySketchMode) {
              delete child.userData._hiddenBySketchMode;
            }
            
            // Restaurar visibilidade normal (exceto para "Plane")
            if (child.name !== "Plane") {
              child.visible = true;
            }
            
            // Restaurar material se necessário
            if (child.isMesh && (!child.material || child.material.disposed) && 
                materialCacheRef.current.has(child.uuid)) {
              child.material = materialCacheRef.current.get(child.uuid).clone();
            }
          }
        });
        console.log("Visibilidade e materiais restaurados após mudança de modo");
      }
    }
  }, [currentMode, currentModel, world?.scene]);

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    return () => {
      // Limpar cache de materiais
      materialCacheRef.current.clear();
    };
  }, []);

  return null;
}