// SketchIntegration.jsx - Componente para integrar FocusOnObject com o modo sketch
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import { objectLocationMapper } from '../../utils/ObjectLocationMapper';
import { findObjectsByName, focusOnObject, returnToOriginalCamera } from '../Model/FocusOnObject';

/**
 * Componente para integrar a funcionalidade de foco e navegação com o modo sketch
 * e auxiliar nas transições entre modos normal e sketch.
 * 
 * @param {Object} props
 * @param {Object} props.modelRef - Referência ao modelo principal
 * @param {Object} props.scene - Cena Three.js
 * @param {Object} props.camera - Câmera Three.js
 * @param {Object} props.controls - Controles da câmera
 * @param {Function} props.onFocus - Callback quando ocorre um foco (opcional)
 */
const SketchIntegration = ({ modelRef, scene, camera, controls, onFocus }) => {
  const { currentMode } = useVisualizationMode();
  const previousModeRef = useRef(currentMode);
  const focusStateRef = useRef({
    isFocusing: false,
    currentTarget: null,
    lastFocusedObject: null
  });
  
  // Sincroniza o mapeador de objetos quando o modo muda
  useEffect(() => {
    if (!modelRef.current || !scene) return;
    
    if (currentMode === 'sketch' && previousModeRef.current === 'normal') {
      // Transitioning to sketch mode - create mappings
      setTimeout(() => {
        const result = objectLocationMapper.buildMappings(modelRef.current, scene);
        console.log("Mapeamento de objetos normal->sketch construído");
      }, 100); // Pequeno atraso para garantir que o modo sketch está renderizado
    }
    
    // Guarda o modo anterior para comparação
    previousModeRef.current = currentMode;
  }, [currentMode, modelRef.current, scene]);
  
  // Função para focar em um objeto em qualquer modo
  const focusOnTargetObject = useCallback(async (targetName, duration = 3000) => {
    if (!scene || !camera || !controls || !targetName) return null;
    
    // Evita múltiplos focos simultâneos
    if (focusStateRef.current.isFocusing) {
      console.log("Já existe uma operação de foco em andamento");
      return null;
    }
    
    // Inicia o estado de foco
    focusStateRef.current.isFocusing = true;
    focusStateRef.current.currentTarget = targetName;
    
    console.log(`Iniciando foco em '${targetName}' no modo ${currentMode}`);
    
    try {
      // Obtém objetos em ambos os modos usando o mapeador
      let targetMeshes;
      
      if (objectLocationMapper && scene) {
        const { normalObjects, sketchObjects } = objectLocationMapper.findObjectsByName(
          targetName, 
          scene, 
          currentMode // Passa o modo atual para otimizar a busca
        );
        
        // Usa os objetos apropriados para o modo atual
        targetMeshes = currentMode === 'sketch' ? sketchObjects : normalObjects;
        
        // Se não encontrar objetos com o mapeador, usa o método padrão
        if (!targetMeshes || targetMeshes.length === 0) {
          console.log("Recorrendo ao método padrão de busca");
          targetMeshes = findObjectsByName(targetName, scene);
        }
      } else {
        // Fallback para o método padrão
        targetMeshes = findObjectsByName(targetName, scene);
      }
      
      // Se não encontrou objetos, retorna
      if (!targetMeshes || targetMeshes.length === 0) {
        console.warn(`Nenhum objeto encontrado para '${targetName}'`);
        focusStateRef.current.isFocusing = false;
        return null;
      }
      
      console.log(`Encontrados ${targetMeshes.length} objetos para foco`);
      
      // Executa a animação de foco
      const finalPosition = await focusOnObject(targetName, scene, camera, controls, duration);
      
      // Registra o último objeto focado
      focusStateRef.current.lastFocusedObject = targetName;
      
      // Invoca callback se fornecido
      if (onFocus && typeof onFocus === 'function') {
        onFocus(targetName, targetMeshes);
      }
      
      return finalPosition;
    } catch (error) {
      console.error("Erro ao focar em objeto:", error);
      return null;
    } finally {
      // Limpa o estado de foco
      focusStateRef.current.isFocusing = false;
      focusStateRef.current.currentTarget = null;
    }
  }, [scene, camera, controls, currentMode, onFocus]);
  
  // Função para retornar à posição original da câmera
  const returnToOriginal = useCallback(async (duration = 2000) => {
    if (!scene || !camera || !controls) return;
    
    if (focusStateRef.current.isFocusing) {
      console.log("Operação de foco em andamento, aguarde");
      return;
    }
    
    console.log("Retornando à posição original da câmera");
    
    try {
      focusStateRef.current.isFocusing = true;
      
      // Usa a função do FocusOnObject para retornar
      await returnToOriginalCamera(null, null, scene, camera, controls, duration);
      
      // Limpa referência do último objeto focado
      focusStateRef.current.lastFocusedObject = null;
      
    } catch (error) {
      console.error("Erro ao retornar à posição original:", error);
    } finally {
      focusStateRef.current.isFocusing = false;
    }
  }, [scene, camera, controls]);
  
  // Expõe as funções através do objeto global para acesso de debugging e API
  useEffect(() => {
    if (window && !window._sceneNavigation) {
      window._sceneNavigation = {};
    }
    
    if (window._sceneNavigation) {
      window._sceneNavigation.focusOnObject = focusOnTargetObject;
      window._sceneNavigation.returnToOriginal = returnToOriginal;
      window._sceneNavigation.getCurrentMode = () => currentMode;
      window._sceneNavigation.getLastFocused = () => focusStateRef.current.lastFocusedObject;
    }
    
    return () => {
      // Limpa referências globais na desmontagem
      if (window._sceneNavigation) {
        window._sceneNavigation.focusOnObject = null;
        window._sceneNavigation.returnToOriginal = null;
        window._sceneNavigation.getCurrentMode = null;
        window._sceneNavigation.getLastFocused = null;
      }
    };
  }, [focusOnTargetObject, returnToOriginal, currentMode]);
  
  // Este componente não renderiza nada visualmente
  return null;
};

// Exporta um componente memorizado para evitar renderizações desnecessárias
export default React.memo(SketchIntegration);