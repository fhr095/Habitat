// FocusOnObject.jsx - Versão Otimizada e Corrigida
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

// Mapa global para armazenar os materiais originais (usando o UUID como chave)
const originalMaterialsMap = new Map();
// Referência para a animação de pulsação do "Você está aqui"
let youAreHerePulseAnimation = null;
// Referência para os objetos de efeito adicionados temporariamente na cena
const temporaryEffects = new Set();
// Cache para objetos encontrados recentemente para otimização de busca
const objectSearchCache = new Map();

// Limitar logs apenas para desenvolvimento
const DEBUG_LOGS = true;

// Função para log condicional
const debugLog = (message, ...args) => {
  if (DEBUG_LOGS) {
    console.log(`%c[FocusOnObject] ${message}`, "background: #2a3f5f; color: #fff; padding: 2px 6px;", ...args);
  }
};

/**
 * Captura os materiais originais de todos os meshes da cena.
 * Essa função é chamada uma única vez na primeira animação.
 */
function captureOriginalMaterials(scene) {
  scene.traverse((child) => {
    if (child.isMesh && !originalMaterialsMap.has(child.uuid)) {
      // Clona os materiais para preservar seu estado original
      const materialClone = Array.isArray(child.material) 
        ? child.material.map(m => m.clone()) 
        : child.material.clone();
      
      originalMaterialsMap.set(child.uuid, {
        material: materialClone,
        opacity: Array.isArray(child.material) 
          ? child.material[0].opacity 
          : child.material.opacity,
        depthWrite: Array.isArray(child.material) 
          ? child.material[0].depthWrite 
          : child.material.depthWrite,
        transparent: Array.isArray(child.material) 
          ? child.material[0].transparent 
          : child.material.transparent,
      });
    }
  });
}

/**
 * Retorna a câmera à posição original utilizando uma trajetória inteligente.
 * Durante esse movimento, inicia-se um tween de fade in para restaurar as opacidades.
 *
 * @param {THREE.Vector3} originalPosition - Posição original da câmera.
 * @param {THREE.Vector3} originalTarget - Alvo original dos controles.
 * @param {THREE.Scene} scene - A cena.
 * @param {THREE.Camera} camera - A câmera.
 * @param {Object} controls - Os controles da câmera.
 * @param {number} duration - Duração da animação (em ms).
 * @returns {Promise} - Resolve quando a animação for concluída.
 */
export function returnToOriginalCamera(originalPosition, originalTarget, scene, camera, controls, duration = 3000) {
  return new Promise((resolve) => {
    debugLog("Iniciando retorno à posição original da câmera");
    
    if (!scene || !camera || !controls) {
      console.error("Scene, camera, or controls are not defined.");
      resolve();
      return;
    }
    
    // Se não forem fornecidas posições específicas, use os valores armazenados no último foco
    if (!originalPosition || !originalTarget) {
      if (controls.userData && controls.userData.lastFocusPosition) {
        originalPosition = controls.userData.lastFocusPosition.originalPosition;
        originalTarget = controls.userData.lastFocusPosition.originalTarget;
        
        debugLog("Usando posições armazenadas do último foco");
      } else {
        console.error("No original positions provided and no stored positions found.");
        resolve();
        return;
      }
    }
    
    // Detectar modo atual
    const sketchModeInfo = window._debugSketchMode?.getSketchStatus?.();
    const isSketchMode = sketchModeInfo?.currentMode === 'sketch' && sketchModeInfo?.sketchGroupVisible;
    
    debugLog(`Modo atual para restauração: ${isSketchMode ? 'sketch' : 'normal'}`);

    // Informa ao SketchRenderer que uma transição de câmera está começando
    if (isSketchMode && window._debugSketchMode?.setCameraTransition) {
      window._debugSketchMode.setCameraTransition(true);
    }
    
    // Aplicar a estratégia apropriada com base no modo
    if (isSketchMode) {
      debugLog("Restaurando objetos do modo sketch");
      restoreSketchObjects(scene, duration);
    } else {
      debugLog("Aplicando fade in para restauração no modo normal");
      animateFadeIn(scene, duration * 0.7);
    }
    
    // Calcula uma trajetória inteligente de volta
    debugLog("Calculando trajetória de retorno");
    const trajectory = calculateSmartTrajectory(
      camera.position.clone(),
      originalPosition.clone(),
      scene,
      10, // Segmentos para o retorno
      camera // Passando a câmera para o raycaster
    );
    
    // Adiciona um efeito visual de rastro ao longo da trajetória
    const trailEffect = createTrailEffect(scene, trajectory, new THREE.Color(0x00ff88));
    
    const tweenObj = { t: 0 };
    
    // Iniciar o tempo limite de segurança
    let animationTimeoutId = setTimeout(() => {
      debugLog("Timeout de segurança acionado na retorno à posição original");
      camera.position.copy(originalPosition);
      controls.target.copy(originalTarget);
      controls.update();
      
      // Restaurar materiais originais
      if (isSketchMode) {
        restoreSketchObjects(scene, 0);
        // Informa ao SketchRenderer que a transição terminou
        if (window._debugSketchMode?.setCameraTransition) {
          window._debugSketchMode.setCameraTransition(false);
        }
      } else {
        restoreOriginalMaterials(scene);
      }
      
      controls.enabled = true;
      
      if (controls.userData) {
        delete controls.userData.lastFocusPosition;
      }
      
      resolve();
    }, duration + 1500);
    
    new TWEEN.Tween(tweenObj)
      .to({ t: 1 }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        let pos = trajectory.getPoint(tweenObj.t);
        
        // Interpola suavemente o alvo do lookAt
        const newTarget = new THREE.Vector3().lerpVectors(
          controls.target,
          originalTarget, 
          Math.pow(tweenObj.t, 0.8) // Curva suave para o olhar
        );
        
        camera.position.copy(pos);
        controls.target.copy(newTarget);
        camera.lookAt(newTarget);
        controls.update();
      })
      .onComplete(() => {
        debugLog("Animação de retorno concluída");
        
        // Limpar timeout de segurança
        if (animationTimeoutId) {
          clearTimeout(animationTimeoutId);
          animationTimeoutId = null;
        }
        
        // Adiciona um pequeno movimento de "chegada" ao voltar
        new TWEEN.Tween(camera.position)
          .to({
            x: originalPosition.x,
            y: originalPosition.y,
            z: originalPosition.z
          }, 500)
          .easing(TWEEN.Easing.Back.Out)
          .onComplete(() => {
            // Restaura materiais originais e limpa quaisquer efeitos temporários
            if (isSketchMode) {
              restoreSketchObjects(scene, 0);
              // Informa ao SketchRenderer que a transição terminou
              if (window._debugSketchMode?.setCameraTransition) {
                window._debugSketchMode.setCameraTransition(false);
              }
            } else {
              restoreOriginalMaterials(scene);
            }
            
            // Reativar controles garante que a câmera possa ser manipulada novamente
            if (controls) {
              controls.enabled = true;
            }
            
            // Atualiza os controles
            controls.update();
            
            // Limpa os dados de foco anterior
            if (controls.userData) {
              delete controls.userData.lastFocusPosition;
            }
            
            debugLog("Restauração completa");
            resolve();
          })
          .start();
      })
      .start();
  });
}

/**
 * Anima a opacidade de todos os meshes para os valores originais
 * ao longo de um determinado período, restaurando a cena ao estado normal gradualmente.
 * 
 * @param {THREE.Scene} scene - A cena
 * @param {number} duration - Duração da animação em ms
 */
function animateFadeIn(scene, duration) {
  // Encontra os materiais para restaurar
  scene.traverse((child) => {
    if (child.isMesh && originalMaterialsMap.has(child.uuid) && !temporaryEffects.has(child)) {
      const origProps = originalMaterialsMap.get(child.uuid);
      
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => {
          // Use a opacidade original se disponível, caso contrário use a opacidade atual
          const origOpacity = origProps.opacity !== undefined ? origProps.opacity : mat.opacity;
          
          // Restaura a emissividade original (se aplicável)
          if (mat.emissive && origProps.material.emissive) {
            const originalEmissive = origProps.material.emissive.clone();
            new TWEEN.Tween(mat.emissive)
              .to({ r: originalEmissive.r, g: originalEmissive.g, b: originalEmissive.b }, duration)
              .easing(TWEEN.Easing.Cubic.InOut)
              .start();
          }
          
          // Anima de volta à opacidade original
          new TWEEN.Tween({ opacity: mat.opacity })
            .to({ opacity: origOpacity }, duration)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onStart(() => {
              mat.transparent = true;
              mat.depthWrite = true;
            })
            .onUpdate((obj) => {
              mat.opacity = obj.opacity;
              mat.needsUpdate = true;
            })
            .onComplete(() => {
              mat.depthWrite = origProps.depthWrite !== undefined ? origProps.depthWrite : true;
              mat.transparent = origProps.transparent !== undefined ? origProps.transparent : false;
              mat.needsUpdate = true;
            })
            .start();
        });
      } else if (child.material) {
        const origOpacity = origProps.opacity !== undefined ? origProps.opacity : child.material.opacity;
        
        // Restaura a emissividade original (se aplicável)
        if (child.material.emissive && origProps.material.emissive) {
          const originalEmissive = origProps.material.emissive.clone();
          new TWEEN.Tween(child.material.emissive)
            .to({ r: originalEmissive.r, g: originalEmissive.g, b: originalEmissive.b }, duration)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();
        }
        
        // Anima de volta à opacidade original
        new TWEEN.Tween({ opacity: child.material.opacity })
          .to({ opacity: origOpacity }, duration)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onStart(() => {
            child.material.transparent = true;
            child.material.depthWrite = true;
          })
          .onUpdate((obj) => {
            child.material.opacity = obj.opacity;
            child.material.needsUpdate = true;
          })
          .onComplete(() => {
            child.material.depthWrite = origProps.depthWrite !== undefined ? origProps.depthWrite : true;
            child.material.transparent = origProps.transparent !== undefined ? origProps.transparent : false;
            child.material.needsUpdate = true;
          })
          .start();
      }
    }
  });
  
  // Remove quaisquer efeitos temporários que ainda possam existir
  temporaryEffects.forEach(effect => {
    if (effect.parent) {
      effect.parent.remove(effect);
    }
  });
  temporaryEffects.clear();
}

/**
 * Restaura os materiais originais de todos os meshes da cena utilizando os dados armazenados.
 * Útil para resetar a cena imediatamente, sem animação.
 * 
 * @param {THREE.Scene} scene - A cena a ser restaurada
 */
export function restoreOriginalMaterials(scene) {
  scene.traverse((child) => {
    if (child.isMesh && originalMaterialsMap.has(child.uuid)) {
      const orig = originalMaterialsMap.get(child.uuid);
      
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => {
          mat.opacity = orig.opacity;
          mat.depthWrite = orig.depthWrite;
          mat.transparent = orig.transparent;
          
          // Restaura emissividade se existir
          if (mat.emissive && orig.material.emissive) {
            mat.emissive.copy(orig.material.emissive);
          }
          
          mat.needsUpdate = true;
        });
      } else if (child.material) {
        child.material.opacity = orig.opacity;
        child.material.depthWrite = orig.depthWrite;
        child.material.transparent = orig.transparent;
        
        // Restaura emissividade se existir
        if (child.material.emissive && orig.material.emissive) {
          child.material.emissive.copy(orig.material.emissive);
        }
        
        child.material.needsUpdate = true;
      }
    }
  });
  
  // Remove todos os efeitos temporários da cena
  temporaryEffects.forEach(effect => {
    if (effect.parent) {
      effect.parent.remove(effect);
    }
  });
  temporaryEffects.clear();
}

/**
 * Função principal para focar em um objeto. Detecta automaticamente o modo de visualização
 * e aplica a estratégia de destaque mais apropriada.
 * 
 * @param {string} targetName - Nome do objeto a ser focado
 * @param {THREE.Scene} scene - A cena
 * @param {THREE.Camera} camera - A câmera
 * @param {Object} controls - Controles da câmera
 * @param {number} duration - Duração da animação em ms
 * @returns {Promise} - Resolve quando a animação terminar
 */
export async function focusOnObject(targetName, scene, camera, controls, duration = 3500) {
  return new Promise(async (resolve) => {
    debugLog(`Iniciando foco em: "${targetName}"`);
    
    if (!scene || !camera || !controls) {
      console.error("Scene, camera, or controls are not defined.");
      resolve();
      return;
    }
    
    // Captura os materiais originais se ainda não foram capturados
    if (originalMaterialsMap.size === 0) {
      debugLog("Capturando materiais originais");
      captureOriginalMaterials(scene);
    }

    // Detectar modo atual
    const sketchModeInfo = window._debugSketchMode?.getSketchStatus?.();
    const isSketchMode = sketchModeInfo?.currentMode === 'sketch' && sketchModeInfo?.sketchGroupVisible;
    
    debugLog(`Modo atual: ${isSketchMode ? 'sketch' : 'normal'}`);

    // Notificar o SketchRenderer que uma transição de câmera vai começar
    if (isSketchMode && window._debugSketchMode?.setCameraTransition) {
      window._debugSketchMode.setCameraTransition(true);
    }

    // Usa a função melhorada para encontrar objetos
    let targetMeshes = findObjectsByName(targetName, scene);

    if (targetMeshes.length === 0) {
      console.warn(`Target object not found: ${targetName}`);
      
      // Tentar encontrar objetos com correspondência mais flexível em modo de recuperação
      debugLog("Tentando busca com correspondência mais flexível");
      const normalizedTargetName = targetName.toLowerCase().replace(/[-_\s]+/g, "");
      
      const allMeshes = [];
      scene.traverse(obj => {
        if (obj.isMesh || obj.isGroup) {
          allMeshes.push(obj);
        }
      });
      
      // Busca com correspondência mais flexível
      targetMeshes = allMeshes.filter(obj => {
        const objName = obj.name.toLowerCase().replace(/[-_\s]+/g, "");
        return objName.includes(normalizedTargetName) || normalizedTargetName.includes(objName);
      });
      
      if (targetMeshes.length === 0) {
        debugLog("Nenhum objeto encontrado mesmo com correspondência flexível");
        
        // Informa o SketchRenderer que a transição foi cancelada
        if (isSketchMode && window._debugSketchMode?.setCameraTransition) {
          window._debugSketchMode.setCameraTransition(false);
        }
        
        resolve();
        return;
      }
      
      debugLog(`Encontrados ${targetMeshes.length} objetos com correspondência flexível`);
    }
    
    debugLog(`Encontrados ${targetMeshes.length} objetos para foco`);
    
    // Buscar "Você está aqui" com filtragem especial para evitar duplicatas
    let youAreHereMarker = null;
    const youAreHereMarkers = findObjectsByName("você_está_aqui", scene);
    
    if (youAreHereMarkers.length > 0) {
      // Selecionar apenas um marcador, preferencialmente sem sufixos
      youAreHereMarker = youAreHereMarkers.find(m => 
        !m.name.includes("_edges") && 
        !m.name.includes("_conditional") && 
        !m.name.includes("_thick")
      ) || youAreHereMarkers[0];
      
      debugLog(`Marcador "Você está aqui" encontrado: ${youAreHereMarker.name}`);
      // Anima o marcador antes de iniciar o movimento
      await animateYouAreHereMarker(youAreHereMarker, scene, Math.min(duration * 0.3, 2000));
    } else {
      debugLog("Marcador 'Você_está_aqui' não encontrado na cena");
    }
    
    // Inicia monitoramento para evitar problemas durante a transição de câmera no modo sketch
    let materialMonitorInterval = null;
    if (isSketchMode) {
      debugLog("Iniciando monitoramento de materiais para modo sketch");
      materialMonitorInterval = startSketchMaterialMonitoring(scene, targetMeshes);
    }
    
    // Com base no modo, escolhe a estratégia apropriada
    if (isSketchMode) {
      debugLog("Usando estratégia de destaque para modo sketch");
      
      // Função específica para destacar objetos no modo sketch
      highlightSketchObjects(scene, targetMeshes, duration * 0.6);
    } else {
      debugLog("Usando estratégia de fade para modo normal");
      
      // Função padrão de fade para o modo normal - com melhoria para mais contraste
      animateFade(scene, targetMeshes, 0.10, duration * 0.6);
    }

    // MELHORIA CRÍTICA: Cálculo mais preciso do bounding box
    let boundingBox = new THREE.Box3();
    let validMeshCount = 0;
    
    // Primeiro, calcular o bounding box só com objetos significativos
    targetMeshes.forEach((mesh) => {
      try {
        // Ignorar objetos com "_edges" ou "_conditional" para cálculo inicial de bounding box
        // Isso evita que objetos de borda influenciem excessivamente o tamanho
        if (!mesh.name.includes("_edges") && !mesh.name.includes("_conditional")) {
          const meshBounds = new THREE.Box3().setFromObject(mesh);
          
          // Verificar se o bounding box tem dimensões razoáveis
          const size = new THREE.Vector3();
          meshBounds.getSize(size);
          
          const maxDimension = Math.max(size.x, size.y, size.z);
          
          // Ignorar objetos muito grandes (provavelmente incorretos) no modo sketch
          const isTooLarge = isSketchMode && maxDimension > 50;
          
          if (!meshBounds.isEmpty() && !isTooLarge) {
            boundingBox.union(meshBounds);
            validMeshCount++;
          }
        }
      } catch (err) {
        debugLog(`Erro ao expandir bounding box para ${mesh.name}:`, err);
      }
    });
    
    // Se não encontramos nenhum mesh válido, tentar com todos os objetos
    if (validMeshCount === 0) {
      debugLog("Nenhum objeto significativo encontrado, usando todos os objetos para bounding box");
      
      targetMeshes.forEach((mesh) => {
        try {
          const meshBounds = new THREE.Box3().setFromObject(mesh);
          if (!meshBounds.isEmpty()) {
            boundingBox.union(meshBounds);
          }
        } catch (err) {
          debugLog(`Erro ao expandir bounding box (fallback) para ${mesh.name}:`, err);
        }
      });
    }
    
    // Se ainda estiver vazio, usar uma abordagem baseada em vértices
    if (boundingBox.isEmpty()) {
      debugLog("Bounding box vazio, tentando calcular manualmente");
      
      targetMeshes.forEach(mesh => {
        if (mesh.geometry && mesh.geometry.attributes && mesh.geometry.attributes.position) {
          const positions = mesh.geometry.attributes.position.array;
          for (let i = 0; i < positions.length; i += 3) {
            const vertex = new THREE.Vector3(
              positions[i], 
              positions[i + 1], 
              positions[i + 2]
            );
            
            // Aplicar a matriz do mundo para o cálculo correto
            mesh.updateMatrixWorld();
            vertex.applyMatrix4(mesh.matrixWorld);
            
            boundingBox.expandByPoint(vertex);
          }
        }
      });
    }
    
    // Se mesmo assim o bounding box estiver vazio, usar posição do objeto como último recurso
    if (boundingBox.isEmpty() && targetMeshes.length > 0) {
      debugLog("Usando posição do objeto diretamente como último recurso");
      const targetPosition = new THREE.Vector3();
      targetMeshes[0].getWorldPosition(targetPosition);
      boundingBox.expandByPoint(targetPosition.clone().add(new THREE.Vector3(1, 1, 1)));
      boundingBox.expandByPoint(targetPosition.clone().sub(new THREE.Vector3(1, 1, 1)));
    }
    
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // VERIFICAÇÃO DE SEGURANÇA: Limitar tamanho do bounding box e dimensões
    // para evitar movimentos de câmera extremos
    const limitedMaxDim = Math.min(maxDim, isSketchMode ? 30 : 50);
    
    debugLog(`Bounding box calculado - Centro: [${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}], Tamanho máximo: ${limitedMaxDim.toFixed(2)}`);
    
    // Calcula a posição ideal da câmera para visualizar o objeto
    const fov = camera.fov * (Math.PI / 180);
    const aspect = camera.aspect || 1;
    let distanceToFit = limitedMaxDim / (2 * Math.tan(fov / 2));
    distanceToFit = distanceToFit / Math.min(1, aspect);
    
    // Ajusta a distância para objetos muito pequenos ou muito grandes
    const minDistance = 5; // Distância mínima para objetos pequenos
    const maxDistance = isSketchMode ? 30 : 40; // Distância máxima menor para o modo sketch
    distanceToFit = Math.max(minDistance, Math.min(maxDistance, distanceToFit));
    
    debugLog(`Distância calculada para ajuste: ${distanceToFit.toFixed(2)}`);
    
    // Calcula um ângulo que oferece boa visualização
    const angleHorizontal = Math.PI / 4; // 45 graus
    const angleVertical = Math.PI / 6; // 30 graus
    
    const newCameraPosition = new THREE.Vector3(
      center.x + distanceToFit * Math.sin(angleHorizontal),
      center.y + distanceToFit * Math.sin(angleVertical),
      center.z + distanceToFit * Math.cos(angleHorizontal)
    );
    
    debugLog(`Nova posição da câmera: [${newCameraPosition.x.toFixed(2)}, ${newCameraPosition.y.toFixed(2)}, ${newCameraPosition.z.toFixed(2)}]`);
    
    // Salva a posição e target original da câmera para referência futura
    const originalCameraPosition = camera.position.clone();
    const originalTargetPosition = controls.target.clone();
    
    debugLog(`Posição original da câmera: [${originalCameraPosition.x.toFixed(2)}, ${originalCameraPosition.y.toFixed(2)}, ${originalCameraPosition.z.toFixed(2)}]`);
    
    // Usa o algoritmo inteligente para calcular a trajetória
    // Passando a câmera para resolver o problema com LineSegments2
    const trajectory = calculateSmartTrajectory(
      camera.position.clone(), 
      newCameraPosition.clone(), 
      scene,
      15, // Número de segmentos para suavização da curva
      camera // Passando a câmera para o raycaster
    );
    
    // Adiciona um efeito visual de rastro ao longo da trajetória
    const trailEffect = createTrailEffect(scene, trajectory);
    
    // Animação da câmera ao longo da trajetória
    const tweenObj = { t: 0 };
    
    // Adicionar um tempo limite para garantir que a animação completa
    let animationTimeoutId = setTimeout(() => {
      debugLog("Timeout de segurança acionado");
      
      // Posicionar a câmera diretamente no destino
      camera.position.copy(newCameraPosition);
      controls.target.copy(center);
      camera.lookAt(center);
      controls.update();
      
      // Limpar monitoramento de materiais
      if (materialMonitorInterval) {
        clearInterval(materialMonitorInterval);
      }
      
      // Notificar o SketchRenderer que a transição terminou
      if (isSketchMode && window._debugSketchMode?.setCameraTransition) {
        window._debugSketchMode.setCameraTransition(false);
      }
      
      // Restaurar materiais, apenas se houver problemas
      if (isSketchMode) {
        forceRestoreSketchObjects(scene);
      }
      
      // Salvar dados de posição
      controls.userData = controls.userData || {};
      controls.userData.lastFocusPosition = {
        cameraPosition: camera.position.clone(),
        targetPosition: center.clone(),
        originalPosition: originalCameraPosition,
        originalTarget: originalTargetPosition
      };
      
      resolve(newCameraPosition);
    }, duration + 2000);
    
    try {
      new TWEEN.Tween(tweenObj)
        .to({ t: 1 }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          let pos = trajectory.getPoint(tweenObj.t);
          
          // Animação do look-at - Move gradualmente de onde está olhando para o destino
          const currentLookAt = controls.target.clone();
          const newLookAt = new THREE.Vector3().lerpVectors(currentLookAt, center, Math.pow(tweenObj.t, 0.6));
          
          camera.position.copy(pos);
          controls.target.copy(newLookAt);
          camera.lookAt(newLookAt);
          controls.update();
        })
        .onComplete(() => {
          debugLog("Animação de aproximação concluída");
          
          // Limpar o timeout de segurança já que concluímos com sucesso
          if (animationTimeoutId) {
            clearTimeout(animationTimeoutId);
            animationTimeoutId = null;
          }
          
          // Limpar monitoramento de materiais
          if (materialMonitorInterval) {
            clearInterval(materialMonitorInterval);
          }
          
          // Adiciona um pequeno movimento de "chegada" ao destino
          new TWEEN.Tween(camera.position)
            .to({
              x: newCameraPosition.x,
              y: newCameraPosition.y,
              z: newCameraPosition.z
            }, 500)
            .easing(TWEEN.Easing.Back.Out)
            .onComplete(() => {
              // Notificar o SketchRenderer que a transição terminou
              if (isSketchMode && window._debugSketchMode?.setCameraTransition) {
                window._debugSketchMode.setCameraTransition(false);
              }
              
              // Salva a posição e alvo finais em uma propriedade do controls para uso futuro
              controls.userData = controls.userData || {};
              controls.userData.lastFocusPosition = {
                cameraPosition: camera.position.clone(),
                targetPosition: center.clone(),
                originalPosition: originalCameraPosition,
                originalTarget: originalTargetPosition
              };
              
              resolve(newCameraPosition);
            })
            .start();
        })
        .start();
    } catch (error) {
      debugLog("Erro durante animação de câmera:", error);
      
      // Notificar o SketchRenderer que a transição terminou devido a erro
      if (isSketchMode && window._debugSketchMode?.setCameraTransition) {
        window._debugSketchMode.setCameraTransition(false);
      }
      
      // Em caso de erro, resolver diretamente
      resolve(newCameraPosition);
    }
  });
}

/**
 * Monitora e corrige problemas de materiais durante a transição de câmera no modo sketch
 * Isso é essencial para evitar artefatos visuais durante o movimento
 */
function startSketchMaterialMonitoring(scene, targetMeshes) {
  const sketchGroup = scene.children.find(child => child.name === "SketchModels");
  if (!sketchGroup) return null;
  
  // Armazenamos o estado inicial de todos os materiais
  const initialMaterials = new Map();
  sketchGroup.traverse(obj => {
    if ((obj.isMesh || obj.isLine || obj.isLineSegments || obj.isPoints) && obj.material) {
      initialMaterials.set(obj.uuid, {
        material: obj.material.clone(),
        visible: obj.visible
      });
    }
  });
  
  debugLog(`Monitoramento inicializado para ${initialMaterials.size} objetos`);
  
  // Função para verificar e corrigir problemas
  const checkAndFix = () => {
    let fixedCount = 0;
    sketchGroup.traverse(obj => {
      if (obj.isMesh || obj.isLine || obj.isLineSegments || obj.isPoints) {
        // Corrigir visibilidade
        const initial = initialMaterials.get(obj.uuid);
        if (initial && !obj.visible && initial.visible) {
          obj.visible = true;
          fixedCount++;
        }
        
        // Corrigir materiais ausentes/dispostos
        if (initial && (!obj.material || obj.material.disposed)) {
          obj.material = initial.material.clone();
          fixedCount++;
        }
        
        // Corrigir material sem cor
        if (obj.material && obj.material.color && obj.material.color.r === undefined) {
          if (initial && initial.material.color) {
            obj.material.color = initial.material.color.clone();
            fixedCount++;
          }
        }
      }
    });
    
    if (fixedCount > 0) {
      debugLog(`Corrigidos ${fixedCount} problemas de material/visibilidade`);
    }
  };
  
  // Iniciar o monitoramento
  return setInterval(checkAndFix, 200);
}

/**
 * Restaura objetos sketch ao estado original
 * @param {THREE.Scene} scene - A cena
 * @param {number} duration - Duração da animação
 */
function restoreSketchObjects(scene, duration) {
  debugLog("Restaurando objetos do modo sketch");
  
  // Find the sketch group
  const sketchGroup = scene.children.find(child => child.name === "SketchModels");
  if (!sketchGroup) {
    debugLog("Grupo SketchModels não encontrado!");
    return;
  }
  
  // Counter para objetos restaurados
  let restoredCount = 0;
  
  // Restaurar todos os objetos
  sketchGroup.traverse(obj => {
    if (obj.isMesh || obj.isLine || obj.isLineSegments || obj.isPoints) {
      // Restaurar de destaque
      if (obj.userData._originalHighlight) {
        const orig = obj.userData._originalHighlight;
        
        // Restaurar espessura de linha
        if (obj.material && orig.linewidth !== undefined) {
          if (duration > 0) {
            new TWEEN.Tween({ linewidth: obj.material.linewidth })
              .to({ linewidth: orig.linewidth }, duration)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onUpdate(v => {
                obj.material.linewidth = v.linewidth;
                obj.material.needsUpdate = true;
              })
              .start();
          } else {
            obj.material.linewidth = orig.linewidth;
            obj.material.needsUpdate = true;
          }
        }
        
        // Restaurar opacidade
        if (obj.material && orig.opacity !== undefined) {
          if (duration > 0) {
            new TWEEN.Tween({ opacity: obj.material.opacity })
              .to({ opacity: orig.opacity }, duration)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onUpdate(v => {
                obj.material.opacity = v.opacity;
                obj.material.needsUpdate = true;
              })
              .start();
          } else {
            obj.material.opacity = orig.opacity;
            obj.material.needsUpdate = true;
          }
        }
        
        // Restaurar cor
        if (obj.material && obj.material.color && orig.color) {
          if (duration > 0) {
            new TWEEN.Tween({ 
              r: obj.material.color.r,
              g: obj.material.color.g,
              b: obj.material.color.b
            })
              .to({ 
                r: orig.color.r,
                g: orig.color.g,
                b: orig.color.b
              }, duration)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onUpdate(v => {
                obj.material.color.setRGB(v.r, v.g, v.b);
                obj.material.needsUpdate = true;
              })
              .start();
          } else {
            obj.material.color.copy(orig.color);
            obj.material.needsUpdate = true;
          }
        }
        
        // Restaurar emissive
        if (obj.material && obj.material.emissive && orig.emissive) {
          if (duration > 0) {
            new TWEEN.Tween({ 
              r: obj.material.emissive.r,
              g: obj.material.emissive.g,
              b: obj.material.emissive.b
            })
              .to({ 
                r: orig.emissive.r,
                g: orig.emissive.g,
                b: orig.emissive.b
              }, duration)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onUpdate(v => {
                obj.material.emissive.setRGB(v.r, v.g, v.b);
                obj.material.needsUpdate = true;
              })
              .start();
          } else {
            obj.material.emissive.copy(orig.emissive);
            obj.material.needsUpdate = true;
          }
        }
        
        // Restaurar escala
        if (orig.scale) {
          if (duration > 0) {
            new TWEEN.Tween({ 
              scaleX: obj.scale.x,
              scaleY: obj.scale.y,
              scaleZ: obj.scale.z
            })
              .to({ 
                scaleX: orig.scale.x,
                scaleY: orig.scale.y,
                scaleZ: orig.scale.z
              }, duration)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onUpdate(v => {
                obj.scale.set(v.scaleX, v.scaleY, v.scaleZ);
              })
              .start();
          } else {
            obj.scale.copy(orig.scale);
          }
        }
        
        // Limpar dados de destaque
        delete obj.userData._originalHighlight;
        restoredCount++;
      }
      
      // Restaurar de fade
      if (obj.userData._originalFade) {
        const orig = obj.userData._originalFade;
        
        if (duration > 0) {
          new TWEEN.Tween({ opacity: obj.material.opacity })
            .to({ opacity: orig.opacity }, duration)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(v => {
              obj.material.opacity = v.opacity;
              obj.material.transparent = orig.transparent;
              obj.material.needsUpdate = true;
            })
            .start();
        } else {
          obj.material.opacity = orig.opacity;
          obj.material.transparent = orig.transparent;
          obj.material.needsUpdate = true;
        }
        
        // Limpar dados de fade
        delete obj.userData._originalFade;
        restoredCount++;
      }
    }
  });
  
  debugLog(`${restoredCount} objetos restaurados no modo sketch`);
}

/**
 * Força restauração de objetos no modo sketch para casos de emergência
 */
function forceRestoreSketchObjects(scene) {
  // Tenta primeiro restaurar usando a função normal com duração zero
  restoreSketchObjects(scene, 0);
  
  // Fallback para restauração usando a API de debug do modo sketch
  if (window._debugSketchMode?.forceModelRestore) {
    debugLog("Usando forceModelRestore para restauração de emergência");
    window._debugSketchMode.forceModelRestore();
  }
}

/**
 * Anima (tween) a opacidade de todos os meshes que não sejam do target para um valor desejado.
 * Implementa uma transição suave e inteligente que preserva a profundidade visual.
 * MELHORADO: Maior contraste entre objetos focados e não focados
 *
 * @param {THREE.Scene} scene 
 * @param {Array} targetMeshes - Meshes que NÃO serão afetados (objetos de foco)
 * @param {number} toOpacity - Opacidade final desejada (ex.: 0.15)
 * @param {number} duration - Duração do tween (em ms)
 */
function animateFade(scene, targetMeshes, toOpacity, duration) {
  // Primeiro, identifica todos os materiais que precisam ser alterados
  const materialsToFade = new Map(); // Map de [Material -> Objeto]
  
  scene.traverse((child) => {
    if (child.isMesh && child.material) {
      // Verifica se o mesh está na lista de targets ou é descendente de um mesh na lista de targets
      let isTarget = targetMeshes.includes(child);
      
      if (!isTarget) {
        // Verifica se o mesh é filho de algum target
        let parent = child.parent;
        while (parent && !isTarget) {
          if (targetMeshes.includes(parent)) {
            isTarget = true;
          }
          parent = parent.parent;
        }
      }
      
      if (!isTarget && !temporaryEffects.has(child)) {
        // Adiciona ao mapa de materiais a serem alterados
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            if (!materialsToFade.has(mat)) {
              materialsToFade.set(mat, child);
            }
          });
        } else {
          if (!materialsToFade.has(child.material)) {
            materialsToFade.set(child.material, child);
          }
        }
      }
    }
  });
  
  // Para cada material, cria um tween de opacidade
  materialsToFade.forEach((obj, material) => {
    // Calcula opacidade personalizada baseada na distância ao alvo mais próximo
    let customOpacity = toOpacity;
    
    // Se o objeto estiver muito próximo do alvo, torna-o mais transparente
    if (targetMeshes.length > 0) {
      const objPosition = new THREE.Vector3();
      obj.getWorldPosition(objPosition);
      
      // Encontra o alvo mais próximo
      let minDistance = Infinity;
      targetMeshes.forEach(target => {
        const targetPosition = new THREE.Vector3();
        target.getWorldPosition(targetPosition);
        const distance = objPosition.distanceTo(targetPosition);
        minDistance = Math.min(minDistance, distance);
      });
      
      // Ajusta a opacidade baseada na distância
      // Objetos muito próximos ficam quase invisíveis
      if (minDistance < 5) {
        customOpacity = toOpacity * 0.3;
      } else if (minDistance < 10) {
        customOpacity = toOpacity * 0.7;
      }
    }
    
    // Cria um tween para animação de opacidade
    new TWEEN.Tween({ opacity: material.opacity })
      .to({ opacity: customOpacity }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onStart(() => {
        material.transparent = true;
      })
      .onUpdate((obj) => {
        material.opacity = obj.opacity;
        material.needsUpdate = true;
      })
      .onComplete(() => {
        // Só desativa depthWrite se a opacidade for muito baixa
        // Isso ajuda a manter a profundidade visual mesmo com transparência
        material.depthWrite = customOpacity >= 0.4;
        material.needsUpdate = true;
      })
      .start();
  });
  
  // Destaca os objetos alvo aumentando seu brilho
  targetMeshes.forEach((mesh) => {
    // Função recursiva para processar grupos e meshes
    function enhanceMaterials(obj) {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => {
            // Aumenta a emissividade para dar destaque
            if (mat.emissive) {
              const originalEmissive = mat.emissive.clone();
              new TWEEN.Tween({ r: 0, g: 0, b: 0 })
                .to({ r: 0.3, g: 0.3, b: 0.3 }, duration)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate((v) => {
                  mat.emissive.setRGB(
                    originalEmissive.r + v.r,
                    originalEmissive.g + v.g,
                    originalEmissive.b + v.b
                  );
                })
                .start();
            }
            
            // Garante opacidade total
            new TWEEN.Tween({ opacity: mat.opacity })
              .to({ opacity: 1 }, duration * 0.6)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onStart(() => {
                mat.transparent = true;
                mat.depthWrite = true;
              })
              .onUpdate((obj) => {
                mat.opacity = obj.opacity;
                mat.needsUpdate = true;
              })
              .start();
          });
        } else if (obj.material) {
          // Aumenta a emissividade para dar destaque
          if (obj.material.emissive) {
            const originalEmissive = obj.material.emissive.clone();
            new TWEEN.Tween({ r: 0, g: 0, b: 0 })
                .to({ r: 0.3, g: 0.3, b: 0.3 }, duration)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate((v) => {
                  obj.material.emissive.setRGB(
                    originalEmissive.r + v.r,
                    originalEmissive.g + v.g,
                    originalEmissive.b + v.b
                  );
                })
                .start();
          }
          
          // Garante opacidade total
          new TWEEN.Tween({ opacity: obj.material.opacity })
            .to({ opacity: 1 }, duration * 0.6)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onStart(() => {
              obj.material.transparent = true;
              obj.material.depthWrite = true;
            })
            .onUpdate((o) => {
              obj.material.opacity = o.opacity;
              obj.material.needsUpdate = true;
            })
            .start();
        }
      }
      
      // Processa recursivamente os filhos se for um grupo
      if (obj.children) {
        obj.children.forEach(child => enhanceMaterials(child));
      }
    }
    
    // Inicia o processamento recursivo
    enhanceMaterials(mesh);
  });
}

/**
 * Destaca objetos no modo sketch ajustando espessura das linhas, cores, etc.
 * @param {THREE.Scene} scene - A cena
 * @param {Array} targetMeshes - Objetos a destacar
 * @param {number} duration - Duração da animação
 */
function highlightSketchObjects(scene, targetMeshes, duration) {
  debugLog(`Destacando ${targetMeshes.length} objetos no modo sketch`);
  
  // Encontra o grupo sketch
  const sketchGroup = scene.children.find(child => child.name === "SketchModels");
  if (!sketchGroup) {
    debugLog("Grupo SketchModels não encontrado!");
    return;
  }
  
  // Lista para rastrear nomes de objetos alvo
  const targetNames = targetMeshes.map(mesh => mesh.name.toLowerCase());
  debugLog("Nomes de objetos alvo:", targetNames);
  
  // Objeto para rastrear objetos relacionados no grupo sketch
  const relatedObjects = new Set();
  
  // Encontrar objetos relacionados no grupo sketch
  sketchGroup.traverse(sketchObj => {
    if (sketchObj.isMesh || sketchObj.isLine || sketchObj.isLineSegments || sketchObj.isPoints) {
      const sketchObjName = sketchObj.name.toLowerCase();
      
      // Verificar se o objeto está relacionado ao alvo
      for (const targetName of targetNames) {
        // Verificar diferentes padrões de nome para objetos sketch
        if (
          sketchObjName.includes(targetName) || 
          (sketchObjName.includes("_edges") && sketchObjName.replace("_edges", "").includes(targetName)) ||
          (sketchObjName.includes("_conditional") && sketchObjName.replace("_conditional", "").includes(targetName)) ||
          (sketchObjName.includes("_thick") && sketchObjName.replace("_thick", "").includes(targetName))
        ) {
          relatedObjects.add(sketchObj);
          debugLog(`Objeto relacionado encontrado: ${sketchObj.name}`);
        }
      }
    }
  });
  
  debugLog(`${relatedObjects.size} objetos relacionados encontrados no grupo sketch`);
  
  // Se não encontrou nenhum objeto relacionado, tentar estratégia alternativa
  if (relatedObjects.size === 0) {
    debugLog("Tentando correspondência mais flexível para objetos sketch");
    
    sketchGroup.traverse(sketchObj => {
      if (sketchObj.isMesh || sketchObj.isLine || sketchObj.isLineSegments || sketchObj.isPoints) {
        // Tentar correspondência parcial de substring
        for (const targetName of targetNames) {
          const targetPartial = targetName.replace(/[-_\s]+/g, "").toLowerCase();
          const objNamePartial = sketchObj.name.replace(/[-_\s]+/g, "").toLowerCase();
          
          if (objNamePartial.includes(targetPartial) || targetPartial.includes(objNamePartial)) {
            relatedObjects.add(sketchObj);
            debugLog(`Objeto relacionado (correspondência flexível): ${sketchObj.name}`);
          }
        }
      }
    });
    
    debugLog(`${relatedObjects.size} objetos relacionados após correspondência flexível`);
  }
  
  // Destacar objetos relacionados
  relatedObjects.forEach(obj => {
    // Salvar propriedades originais para restauração posterior
    if (!obj.userData._originalHighlight) {
      obj.userData._originalHighlight = {
        linewidth: obj.material?.linewidth,
        opacity: obj.material?.opacity,
        color: obj.material?.color ? obj.material.color.clone() : null,
        emissive: obj.material?.emissive ? obj.material.emissive.clone() : null,
        scale: obj.scale.clone()
      };
    }
    
    // Destacar linhas
    if (obj.material && obj.material.linewidth !== undefined) {
      new TWEEN.Tween({ linewidth: obj.material.linewidth })
        .to({ linewidth: obj.material.linewidth * 3.0 }, duration) // Linhas mais grossas para maior destaque
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(v => {
          obj.material.linewidth = v.linewidth;
          
          // Atualizar resolução para materiais de linha
          if (obj.material.resolution && scene.userData?.debugRenderer) {
            const size = new THREE.Vector2();
            scene.userData.debugRenderer.getSize(size);
            obj.material.resolution.copy(size);
            obj.material.resolution.multiplyScalar(window.devicePixelRatio);
          }
          
          obj.material.needsUpdate = true;
        })
        .start();
    }
    
    // Aumentar opacidade para melhor visibilidade
    if (obj.material && obj.material.opacity !== undefined) {
      new TWEEN.Tween({ opacity: obj.material.opacity })
        .to({ opacity: 1.0 }, duration)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(v => {
          obj.material.opacity = v.opacity;
          obj.material.transparent = true;
          obj.material.needsUpdate = true;
        })
        .start();
    }
    
    // Destacar cor - Usar cores mais brilhantes e saturadas
    if (obj.material && obj.material.color) {
      const orig = obj.material.color.clone();
      new TWEEN.Tween({ r: orig.r, g: orig.g, b: orig.b })
        .to({ 
          r: Math.min(1, orig.r * 2.0),
          g: Math.min(1, orig.g * 2.0),
          b: Math.min(1, orig.b * 2.0)
        }, duration)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(v => {
          obj.material.color.setRGB(v.r, v.g, v.b);
          obj.material.needsUpdate = true;
        })
        .start();
    }
    
    // Caso especial para materiais de shader que usam uniforms
    if (obj.material && obj.material.uniforms) {
      // Destacar diffuse color para materiais de shader
      if (obj.material.uniforms.diffuse) {
        const origColor = obj.material.uniforms.diffuse.value.clone();
        new TWEEN.Tween({ 
          r: origColor.r, 
          g: origColor.g, 
          b: origColor.b 
        })
          .to({ 
            r: Math.min(1, origColor.r * 2.0),
            g: Math.min(1, origColor.g * 2.0),
            b: Math.min(1, origColor.b * 2.0)
          }, duration)
          .easing(TWEEN.Easing.Cubic.Out)
          .onUpdate(v => {
            obj.material.uniforms.diffuse.value.setRGB(v.r, v.g, v.b);
          })
          .start();
      }
      
      // Destacar opacidade para materiais de shader
      if (obj.material.uniforms.opacity) {
        new TWEEN.Tween({ opacity: obj.material.uniforms.opacity.value })
          .to({ opacity: 1.0 }, duration)
          .easing(TWEEN.Easing.Cubic.Out)
          .onUpdate(v => {
            obj.material.uniforms.opacity.value = v.opacity;
          })
          .start();
      }
    }
    
    // Destacar emissive para meshes
    if (obj.material && obj.material.emissive) {
      const origEmissive = obj.material.emissive.clone();
      new TWEEN.Tween({ 
        r: origEmissive.r, 
        g: origEmissive.g, 
        b: origEmissive.b 
      })
        .to({ 
          r: Math.min(1, origEmissive.r + 0.6),
          g: Math.min(1, origEmissive.g + 0.6),
          b: Math.min(1, origEmissive.b + 0.6)
        }, duration)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(v => {
          obj.material.emissive.setRGB(v.r, v.g, v.b);
          obj.material.needsUpdate = true;
        })
        .start();
    }
    
    // Destacar com escala para objetos não-linha
    if (!(obj.isLine || obj.isLineSegments)) {
      new TWEEN.Tween({ 
        scaleX: obj.scale.x,
        scaleY: obj.scale.y,
        scaleZ: obj.scale.z
      })
        .to({ 
          scaleX: obj.scale.x * 1.1,
          scaleY: obj.scale.y * 1.1,
          scaleZ: obj.scale.z * 1.1
        }, duration)
        .easing(TWEEN.Easing.Elastic.Out)
        .onUpdate(v => {
          obj.scale.set(v.scaleX, v.scaleY, v.scaleZ);
        })
        .start();
    }
  });
  
  // Reduzir opacidade dos objetos não relacionados muito mais para maior contraste
  sketchGroup.traverse(obj => {
    if ((obj.isMesh || obj.isLine || obj.isLineSegments || obj.isPoints) && 
        obj.material && 
        !relatedObjects.has(obj)) {
      
      // Salvar propriedades originais para restauração posterior
      if (!obj.userData._originalFade) {
        obj.userData._originalFade = {
          opacity: obj.material.opacity,
          transparent: obj.material.transparent
        };
      }
      
      // Fade para objetos não relacionados - usar opacidade muito baixa (0.05)
      // para criar contraste dramático com os objetos destacados
      new TWEEN.Tween({ opacity: obj.material.opacity })
        .to({ opacity: 0.05 }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(v => {
          obj.material.opacity = v.opacity;
          obj.material.transparent = true;
          obj.material.needsUpdate = true;
        })
        .start();
    }
  });
}

/**
 * Filtra objetos encontrados para evitar duplicações e objetos fragmentados
 * no modo sketch, selecionando apenas os objetos mais significativos.
 * 
 * @param {Array} objects - Lista de objetos encontrados
 * @param {boolean} isSketchMode - Se estamos no modo sketch
 * @param {string} targetName - Nome do objeto sendo buscado
 * @return {Array} - Lista filtrada de objetos
 */
function filterRelevantObjects(objects, isSketchMode, targetName) {
  if (!objects || objects.length === 0) return [];
  
  debugLog(`Filtrando ${objects.length} objetos encontrados para "${targetName}"`);
  
  // Se não estamos no modo sketch, retorna todos os objetos
  if (!isSketchMode) {
    return objects;
  }
  
  // Cria um mapa para rastrear objetos por nome base (sem sufixos)
  const objectsByBaseName = new Map();
  const specialObjects = []; // Para "Você está aqui" e objetos especiais
  
  // Prioridade de objetos baseada em sufixos (menor = mais importante)
  const suffixPriority = {
    "": 0,                   // Sem sufixo (prioridade máxima)
    "_conditional": 10,      // Bordas condicionais
    "_edges": 20,            // Bordas normais
    "_thick_conditional": 30, // Bordas condicionais grossas
    "_thick_edges": 40       // Bordas normais grossas
  };
  
  // Expressão regular para identificar sufixos conhecidos
  const suffixRegex = /_(?:thick_)?(?:conditional|edges)$/;
  
  // Processar cada objeto
  for (const obj of objects) {
    // Tratamento especial para "Você está aqui" - sempre mantém o original
    if (obj.name.toLowerCase().includes("você_está_aqui") || 
        obj.name.toLowerCase().includes("voce_esta_aqui")) {
      
      // Ignorar as versões com sufixos de borda para "Você está aqui"
      if (!suffixRegex.test(obj.name)) {
        specialObjects.push(obj);
        debugLog(`Objeto especial encontrado: ${obj.name}`);
        continue;
      }
    }
    
    // Para outros objetos, extrair o nome base removendo sufixos conhecidos
    let baseName = obj.name;
    let suffix = "";
    
    const suffixMatch = obj.name.match(suffixRegex);
    if (suffixMatch) {
      suffix = suffixMatch[0];
      baseName = obj.name.replace(suffix, "");
    }
    
    // Se esse nome base ainda não existe no mapa, adicionar
    if (!objectsByBaseName.has(baseName)) {
      objectsByBaseName.set(baseName, []);
    }
    
    // Adicionar objeto ao grupo correspondente
    objectsByBaseName.get(baseName).push({
      object: obj,
      suffix: suffix,
      priority: suffixPriority[suffix] || 999 // Prioridade padrão alta para sufixos desconhecidos
    });
  }
  
  // Selecionar apenas o objeto de maior prioridade (menor valor) de cada grupo
  const filteredObjects = [];
  
  objectsByBaseName.forEach((objectGroup, baseName) => {
    // Ordenar por prioridade
    objectGroup.sort((a, b) => a.priority - b.priority);
    
    // Adicionar apenas o objeto de maior prioridade
    if (objectGroup.length > 0) {
      filteredObjects.push(objectGroup[0].object);
      debugLog(`Selecionado objeto ${objectGroup[0].object.name} de grupo ${baseName}`);
    }
  });
  
  // Adicionar objetos especiais
  filteredObjects.push(...specialObjects);
  
  debugLog(`Objetos após filtragem: ${filteredObjects.length}`);
  return filteredObjects;
}

/**
 * Função melhorada de busca que funciona tanto no modo normal quanto no sketch
 * @param {string} targetName - Nome (ou parte do nome) do objeto alvo
 * @param {THREE.Scene} scene - Cena para busca
 * @returns {Array} - Array de objetos encontrados
 */
export function findObjectsByName(targetName, scene) {
  if (!scene || !targetName) return [];
  
  // Verificar cache primeiro para buscas repetidas
  const cacheKey = `${targetName}:${scene.uuid}`;
  if (objectSearchCache.has(cacheKey)) {
    const cached = objectSearchCache.get(cacheKey);
    if (cached.timestamp > Date.now() - 5000) { // Cache de 5 segundos
      debugLog(`Usando resultados em cache para "${targetName}"`);
      return cached.objects;
    }
  }
  
  debugLog(`Buscando objetos com nome: "${targetName}"`);
  
  const targetMeshes = [];
  const normalizedTargetName = targetName.trim().replace(/[-_\s]+/g, "_").toLowerCase();
  
  // Detectar modo atual
  const sketchModeInfo = window._debugSketchMode?.getSketchStatus?.();
  const isSketchMode = sketchModeInfo?.currentMode === 'sketch' && sketchModeInfo?.sketchGroupVisible;
  
  debugLog(`Modo atual: ${isSketchMode ? 'sketch' : 'normal'}`);
  
  // Se temos acesso à API de debug do modo sketch, usá-la para busca
  if (window._debugSketchMode?.findObjectByName) {
    const results = window._debugSketchMode.findObjectByName(targetName);
    debugLog("Resultados da API de debug:", results);
    
    // Se estamos no modo sketch, priorizar objetos do sketch
    if (isSketchMode && results.inSketchGroup.length > 0) {
      debugLog(`Encontrados ${results.inSketchGroup.length} objetos no grupo sketch`);
      
      // Converter resultados em objetos reais
      results.inSketchGroup.forEach(info => {
        scene.traverse(obj => {
          if (obj.uuid === info.uuid) {
            targetMeshes.push(obj);
          }
        });
      });
    } 
    // Senão, usar objetos da cena normal
    else if (results.inScene.length > 0) {
      debugLog(`Encontrados ${results.inScene.length} objetos na cena principal`);
      
      // Converter resultados em objetos reais
      results.inScene.forEach(info => {
        scene.traverse(obj => {
          if (obj.uuid === info.uuid) {
            targetMeshes.push(obj);
          }
        });
      });
    }
    
    // Se encontramos objetos, filtrar e retornar
    if (targetMeshes.length > 0) {
      const filteredObjects = filterRelevantObjects(targetMeshes, isSketchMode, targetName);
      // Armazenar no cache
      objectSearchCache.set(cacheKey, {
        objects: filteredObjects,
        timestamp: Date.now()
      });
      
      debugLog(`Retornando ${filteredObjects.length} objetos encontrados via API`);
      return filteredObjects;
    }
  }
  
  // Se não encontramos via API ou não temos acesso a ela, fazer busca tradicional
  debugLog("Realizando busca tradicional por objetos");
  
  // Função de busca recursiva otimizada
  const searchObject = (object) => {
    if (object.isMesh || object.isGroup) {
      // Normaliza os nomes para comparação mais flexível
      const normalizedName = object.name.trim().replace(/[-_\s]+/g, "_").toLowerCase();
      
      // Aceita correspondências parciais ou palavras-chave
      if (normalizedName.includes(normalizedTargetName) || 
          normalizedTargetName.includes(normalizedName)) {
        targetMeshes.push(object);
        debugLog(`Objeto encontrado: ${object.name} (${object.uuid.substring(0, 8)})`);
      }
    }
    
    // Busca recursivamente em filhos
    if (object.children && object.children.length > 0) {
      object.children.forEach(child => searchObject(child));
    }
  };
  
  // Buscar em todos os objetos de primeiro nível na cena
  scene.children.forEach(child => searchObject(child));
  
  // Verificar especificamente o grupo de sketch, se estivermos no modo sketch
  if (isSketchMode) {
    const sketchGroup = scene.children.find(child => child.name === "SketchModels");
    if (sketchGroup) {
      debugLog("Buscando especificamente no grupo SketchModels");
      searchObject(sketchGroup);
    }
  }
  
  const filteredObjects = filterRelevantObjects(targetMeshes, isSketchMode, targetName);
  // Armazenar no cache
  objectSearchCache.set(cacheKey, {
    objects: filteredObjects,
    timestamp: Date.now()
  });
  
  debugLog(`Total de objetos encontrados: ${filteredObjects.length}`);
  return filteredObjects;
}

/**
 * Verifica colisões utilizando raycasting para detecção de obstáculos mais precisa.
 * @param {THREE.Scene} scene - A cena para verificação
 * @param {THREE.Vector3} origin - Ponto de origem do raio
 * @param {THREE.Vector3} direction - Direção de verificação
 * @param {number} distance - Distância máxima de verificação
 * @param {THREE.Camera} [camera] - Câmera para configuração do raycaster (necessário para LineSegments2)
 * @returns {boolean} - True se houver colisão, False caso contrário
 */
function checkRayCollision(scene, origin, direction, distance = 5, camera = null) {
  if (!scene) return false;
  
  try {
    // Normaliza a direção para evitar erros
    const normalizedDirection = direction.clone().normalize();
    
    // Cria o raycaster com os parâmetros fornecidos
    const raycaster = new THREE.Raycaster(origin, normalizedDirection, 0, distance);
    
    // Define a câmera no raycaster para compatibilidade com LineSegments2
    if (camera) {
      raycaster.camera = camera;
    }
    
    // Filtrar apenas os objetos relevantes para colisão (prédios, paredes, etc.)
    const collidableObjects = [];
    scene.traverse((child) => {
      // Verificações de segurança para evitar erros com objetos inválidos
      if (!child || !child.visible) return;
      
      // Verifica se é um objeto válido para colisão e se não é um objeto especial a ser ignorado
      const isValidMesh = child.isMesh && 
                          child.material && 
                          (!child.material.transparent || child.material.opacity > 0.5);
      
      // Ignoramos LineSegments2 se não tivermos câmera para evitar erros
      const isLineSegments2 = child.isLineSegments2 || 
                              (child.type && child.type === 'LineSegments2');
      
      if (isLineSegments2 && !camera) {
        return; // Pula LineSegments2 quando não há câmera disponível
      }
      
      // Ignoramos objetos especiais
      const isSpecialObject = child.name && (
                              child.name.toLowerCase().includes("você_está_aqui") ||
                              child.name.toLowerCase().includes("voce_esta_aqui") ||
                              temporaryEffects.has(child));
      
      if ((isValidMesh || (isLineSegments2 && camera)) && !isSpecialObject) {
        collidableObjects.push(child);
      }
    });
    
    // Se não há objetos colidíveis, retorna falso
    if (collidableObjects.length === 0) return false;
    
    // Executa a interseção e retorna o resultado
    const intersects = raycaster.intersectObjects(collidableObjects);
    return intersects.length > 0;
  } catch (error) {
    // Em caso de erro, reporta no console e retorna falso como fallback seguro
    console.warn("Error in checkRayCollision:", error);
    return false;
  }
}

/**
 * Calcula uma trajetória inteligente de A até B evitando colisões.
 * @param {THREE.Vector3} start - Ponto inicial
 * @param {THREE.Vector3} end - Ponto final
 * @param {THREE.Scene} scene - Cena para verificação de colisões
 * @param {number} segments - Número de segmentos para cálculo da curva
 * @param {THREE.Camera} [camera] - Câmera opcional para raycasting
 * @returns {THREE.CatmullRomCurve3} - Curva de navegação
 */
function calculateSmartTrajectory(start, end, scene, segments = 12, camera = null) {
  // Verificações de segurança para parâmetros de entrada
  if (!start || !end || !scene) {
    console.warn("Invalid parameters in calculateSmartTrajectory");
    // Retorna uma curva direta se os parâmetros são inválidos
    return new THREE.CatmullRomCurve3([
      start ? start.clone() : new THREE.Vector3(0, 0, 0),
      end ? end.clone() : new THREE.Vector3(0, 0, 10)
    ]);
  }
  
  try {
    // Array para os pontos da curva
    const points = [start.clone()];
    
    // Vetor da direção direta
    const direct = end.clone().sub(start).normalize();
    const distance = start.distanceTo(end);
    
    // Adiciona uma altura mínima à trajetória para evitar objetos no solo
    const baseHeightOffset = Math.max(3, distance * 0.15);
    
    // Encontra um ponto intermediário "seguro" acima
    const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
    const up = new THREE.Vector3(0, 1, 0);
    const heightFactor = Math.min(distance * 0.3, 15); // Altura proporcional à distância, com limite
    midPoint.add(up.clone().multiplyScalar(heightFactor + baseHeightOffset));
    
    // Verifica uma área maior para o ponto médio para garantir que está livre de colisões
    let safetyIterations = 0;
    const maxSafetyIterations = 5;
    const downDirection = new THREE.Vector3(0, -1, 0);
    
    while (checkRayCollision(scene, midPoint, downDirection, 3, camera) && 
           safetyIterations < maxSafetyIterations) {
      // Se houver colisão, tente elevar mais o ponto médio e ligeramente deslocar no plano XZ
      midPoint.y += 2.5;
      midPoint.x += (Math.random() - 0.5) * 4;
      midPoint.z += (Math.random() - 0.5) * 4;
      safetyIterations++;
    }
    
    points.push(midPoint);
    
    // Gera pontos adicionais para curva mais suave com detecção adaptativa de colisões
    const subSegments = Math.max(5, Math.ceil(distance / 10)); // Mais segmentos para distâncias maiores
    
    // Primeiro, descida controlada do ponto alto até próximo ao destino
    for (let i = 1; i < subSegments - 1; i++) {
      const t = i / subSegments;
      const point = new THREE.Vector3().lerpVectors(midPoint, end, t);
      
      // Ajusta altura para uma descida mais gradual (função não-linear)
      const heightOffset = Math.pow(1 - t, 2) * baseHeightOffset;
      point.y += heightOffset;
      
      // Aplica pequena variação para evitar obstáculos detectados
      safetyIterations = 0;
      
      while (checkRayCollision(scene, point, downDirection, 2, camera) && 
             safetyIterations < maxSafetyIterations) {
        // Se detectar colisão, desviar adaptivamente
        const avoidanceHeight = 2 + (safetyIterations * 1.5);
        const avoidanceLateral = 1 + safetyIterations * 0.8;
        
        const avoidance = new THREE.Vector3(
          (Math.random() - 0.5) * avoidanceLateral * 2,
          avoidanceHeight,
          (Math.random() - 0.5) * avoidanceLateral * 2
        );
        point.add(avoidance);
        safetyIterations++;
      }
      
      points.push(point);
    }
    
    // Adiciona pontos finais para garantir uma aproximação suave ao destino
    const approachPoint = new THREE.Vector3().lerpVectors(
      points[points.length - 1], 
      end, 
      0.6
    );
    
    // Ajusta a altura apenas um pouco acima do destino
    approachPoint.y = end.y + 1.5;
    points.push(approachPoint);
    
    // Ponto final
    points.push(end.clone());
    
    // Cria uma curva suave pelos pontos calculados
    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
  } catch (error) {
    console.warn("Error in calculateSmartTrajectory:", error);
    
    // Em caso de erro, retorna uma trajetória simples e direta
    const midPoint = new THREE.Vector3(
      (start.x + end.x) / 2,
      Math.max(start.y, end.y) + 10,
      (start.z + end.z) / 2
    );
    
    return new THREE.CatmullRomCurve3([
      start.clone(),
      midPoint,
      end.clone()
    ]);
  }
}

/**
 * Cria um rastro de partículas no trajeto da câmera para efeito visual
 * @param {THREE.Scene} scene - A cena
 * @param {THREE.CatmullRomCurve3} trajectory - Curva do trajeto
 * @param {THREE.Color} color - Cor do rastro
 * @returns {THREE.Points} - O sistema de partículas criado
 */
function createTrailEffect(scene, trajectory, color = new THREE.Color(0x4285f4)) {
  // Gerar pontos ao longo da trajetória
  const points = trajectory.getPoints(50);
  
  // Criar geometria de partículas
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  // Criar texturas para partículas mais suaves
  const sprite = new THREE.TextureLoader().load(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xOdTWsmQAAAV8SURBVFhHvZd7TFNXHMfvfW2h0PJoC6jIcAxfqGNu8TGdUZn7Q+N0ZjNTriCKOB8MmVOZ4QFF8IlvcCozPubmclnila2YaLZkw8zoYkx8brqBk8GGY4ioIN7d33m3FWm99Dbxm3xzbs/j9/uec889t1e1a9cuOY1S+Xx3FAqFFX+HUPnpnUXJ0dHRbHx8PGUwGCgtfciE4ufn9wzxtWvXdqMvD0pKSmJycnKYqqoqbhR+B8rn+fvDCkApKSksHl+GZaG8vHzmwIEDX6E/J5SRkcEcOXKEuXz5sqSpqYmprq5mhW7Eg3Q5OTnJPXv27Dxw4MCXAQEB3FAKCwunlpeXH0L/biglJYUtKipiCgsLWYwKq3xCxFZhJNjDhw9z2MyMjIwEKpL/tHfv3t2obTNEoLS0tP9HfurUKamiooKBOGK4bt06+uzZs0xlZSXz888/s6mpqQ7v7aKiokK6c+cOAwHNli1bJmJaRsXSjZMnT36AWpOg0NBQdteuXdyXX7hwgcFOZxGXL1tCaLV+lNGopwwGgwRpTMHBwZRer5egbKLi6Eb5hQsXhqE+CRo/fjyLbcQfwoyMjAiDQU9hpCm9Xkft3LmTQewxm0zU7Nkmaty4cRRG3CWAw8ZdvXqV7ujoYK5duyY9evSIPX78OLNnzx7JYDCwZrOZRXxpaKgktWDBAmbEiBFUVFQUheh3CbCwIe9HbREUFxfHbtmyhSstLeWwgRMTExNpHHkWi0JYJKFkJGT5uK9fv57Zv38/U1ZWxqalpUni4uLYlJQUdu7cuSzuCZqF1uUsiA2qRW0ShBMDO50TPwMHDmhiYmJotVot6fV6FrseCkKHDh1KBQUFUdh4ynEhgHUVEktFRUUSRCj04qGIdnfBzZs3B6K2CJo1axbbs2dPt7TYdH3xNanQC6FCL0lISAhsNkuwHvggCpowYQI7adIk6vPPN1MREd0REDFixIh5qG0ShA3IYLTcjVGh8vPzqW++Ypats2aNNHr0aAZa1OjRisMfitomaNq0aWx0dDSHUWGmTp1K+fv7S3q9H4VriTGZIgOhRZ0+ffp91DZBH374IYvdzyFOqG+//Zb68ssvpZCQEDo0NBRBDKVMpkDqvfcm0OPHj+fvBJvNxgwaNIiTUwFSUlJYaHEY9R9DixLxUFTchAYNGrQKtU0Q4pMtLS2lcNIRoaGhNEYsGY2+EicMLYrChuXvBHRn0tPTaUyLnAoQHR3N4vS0HDt2jMMJSS1fvlxydDAMw/Tp08fBAkdHs9lMY7rkVIDw8HAWd4DDW9F89OhRCXeC3DlIp9PRiYmJbgEu/a5du1YuwVMB8B2KKpxQxcXFEt6GDkXPnj1pLEJ44YUXwtRqtf0lLHgc4AxhNBopJZwKUFNTwy5cuJArLy/nPvz++++prVu3SrhsKWw6CYsyJSUlUYGBgRQu1+foS63GxkYKlyW1bNkyOR2grKyMtdls3CpfunTJ8dKhp0yZQmPRSVifIi5XkTNF8ZJXVVVRCxcupF566SUOrQA0uoTW1lauHSeiBJGJp5+QXq93DIvRUTt27KAQmZgO99C8du2aC67HUSBUKsdnJJMxYnqJgwoMDKBGjhxJI2U5Dj8wHH6XLl2S76yCUDZBCrjGKaPRl3r99TjKbA53HHwxMTE0TkQOl6rj5HMHDjcWj8FhaQ7CAsPFQw8ZMoTGaeq2+3EayriWFXHv3j1+BMSdO3eoP/74g+rs7MT/nOXnz59vuH//fjVqr0T9NB6NaWlpMbhPDm9sbLzS2dl5A3UbFCdUB/4eE21tbXfw9yZet1y+fLkei+spKCgIPnjw4Mfnzp1bf/z48S+wK9ajH68eof13nDx5ct2hQ4c/OXbs2AfYkW8/efIkDI81I+h7g/8AVJlEhPYeHRkAAAAASUVORK5CYII='
  );
  
  // Parâmetros para as partículas
  const material = new THREE.PointsMaterial({
    size: 0.5,
    map: sprite,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  // Adicionar cores variadas para efeito de gradiente ao longo do caminho
  const colors = [];
  
  for (let i = 0; i < points.length; i++) {
    const t = i / points.length;
    // Gradiente de azul para branco
    const pointColor = new THREE.Color().lerpColors(
      color,
      new THREE.Color(0xffffff),
      t
    );
    colors.push(pointColor.r, pointColor.g, pointColor.b);
  }
  
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  
  // Criar o sistema de partículas
  const particles = new THREE.Points(geometry, material);
  particles.name = "cameraTrailParticles";
  particles.userData.isTemporaryEffect = true; // Marca como efeito temporário
  scene.add(particles);
  temporaryEffects.add(particles);
  
  // Animar as partículas desaparecendo gradualmente
  const fadeOut = new TWEEN.Tween({ opacity: 1 })
    .to({ opacity: 0 }, 3000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate((obj) => {
      material.opacity = obj.opacity;
    })
    .onComplete(() => {
      scene.remove(particles);
      temporaryEffects.delete(particles);
    })
    .delay(1000)
    .start();
  
  return particles;
}

/**
 * Cria uma animação de pulsação para o marcador "Você está aqui"
 * com efeitos visuais aprimorados para chamar atenção
 * 
 * @param {THREE.Object3D} marker - O objeto "Você_está_aqui"
 * @param {THREE.Scene} scene - A cena
 * @param {number} duration - Duração em ms
 * @returns {Promise} - Resolve quando a animação terminar
 */
function animateYouAreHereMarker(marker, scene, duration = 3000) {
  if (!marker) return Promise.resolve();
  
  // Cancela qualquer animação anterior
  if (youAreHerePulseAnimation) {
    youAreHerePulseAnimation.stop();
  }
  
  // Limpar efeitos temporários relacionados ao marcador
  scene.children.forEach(child => {
    if (child.name && (
        child.name.includes("youAreHereEffect") || 
        child.name.includes("youAreHereLight"))) {
      scene.remove(child);
      temporaryEffects.delete(child);
    }
  });
  
  return new Promise((resolve) => {
    // Garante que o marcador está visível
    marker.visible = true;
    
    // Obtém a posição global do marcador
    const markerPosition = new THREE.Vector3();
    marker.getWorldPosition(markerPosition);
    
    // 1. Adiciona uma luz pontual sobre o marcador
    const light = new THREE.PointLight(0x4285f4, 2, 10);
    light.name = "youAreHereLight";
    light.userData.isTemporaryEffect = true;
    light.position.copy(markerPosition.clone().add(new THREE.Vector3(0, 2, 0)));
    scene.add(light);
    temporaryEffects.add(light);
    
    // 2. Adiciona um anel de partículas ao redor do marcador
    const ringGeometry = new THREE.RingGeometry(1.5, 2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x4285f4,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.name = "youAreHereEffectRing";
    ringMesh.userData.isTemporaryEffect = true;
    ringMesh.rotation.x = Math.PI / 2; // Horizontal
    ringMesh.position.copy(markerPosition.clone().add(new THREE.Vector3(0, 0.1, 0)));
    scene.add(ringMesh);
    temporaryEffects.add(ringMesh);
    
    // 3. Adiciona uma esfera semitransparente como efeito de destaque
    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4285f4,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = "youAreHereEffectSphere";
    sphere.userData.isTemporaryEffect = true;
    sphere.position.copy(markerPosition);
    scene.add(sphere);
    temporaryEffects.add(sphere);
    
    // 4. Adiciona uma seta apontando para baixo (indicador visual)
    const arrowGeometry = new THREE.ConeGeometry(0.5, 1.5, 16);
    const arrowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.name = "youAreHereEffectArrow";
    arrow.userData.isTemporaryEffect = true;
    arrow.rotation.x = Math.PI; // Apontando para baixo
    arrow.position.copy(markerPosition.clone().add(new THREE.Vector3(0, 3, 0)));
    scene.add(arrow);
    temporaryEffects.add(arrow);
    
    // 5. Sistema de partículas em espiral
    const spiralPoints = [];
    const numPoints = 100;
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      const angle = t * Math.PI * 6;
      const radius = 2 * (1 - t);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = t * 3;
      spiralPoints.push(new THREE.Vector3(x, y, z));
    }
    
    const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints);
    const spiralMaterial = new THREE.PointsMaterial({
      color: 0x4285f4,
      size: 0.2,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });
    
    const spiral = new THREE.Points(spiralGeometry, spiralMaterial);
    spiral.name = "youAreHereEffectSpiral";
    spiral.userData.isTemporaryEffect = true;
    spiral.position.copy(markerPosition);
    scene.add(spiral);
    temporaryEffects.add(spiral);
    
    // Anima o marcador - pulsando e girando
    const initialScale = marker.scale.clone();
    const originalY = marker.position.y;
    
    // Tween de pulsação e efeitos
    youAreHerePulseAnimation = new TWEEN.Tween({
      scaleX: initialScale.x,
      scaleY: initialScale.y,
      scaleZ: initialScale.z,
      sphereScale: 0.5,
      sphereOpacity: 0.3,
      lightIntensity: 0,
      ringRotation: 0,
      ringScale: 0.5,
      ringOpacity: 0.6,
      arrowY: arrow.position.y,
      spiralRotation: 0,
      y: originalY
    })
    .to({
      scaleX: initialScale.x * 1.4,
      scaleY: initialScale.y * 1.4,
      scaleZ: initialScale.z * 1.4,
      sphereScale: 1.5,
      sphereOpacity: 0.7,
      lightIntensity: 4,
      ringRotation: Math.PI * 2,
      ringScale: 1.2,
      ringOpacity: 0.9,
      arrowY: arrow.position.y + 1,
      spiralRotation: Math.PI,
      y: originalY + 0.5
    }, duration / 2)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .yoyo(true)
    .repeat(1)
    .onUpdate((obj) => {
      // Animar o marcador
      marker.scale.set(obj.scaleX, obj.scaleY, obj.scaleZ);
      marker.position.y = obj.y;
      
      // Animar a esfera
      sphere.scale.set(obj.sphereScale, obj.sphereScale, obj.sphereScale);
      material.opacity = obj.sphereOpacity;
      
      // Animar a luz
      light.intensity = obj.lightIntensity;
      
      // Animar o anel
      ringMesh.rotation.z = obj.ringRotation;
      ringMesh.scale.set(obj.ringScale, obj.ringScale, obj.ringScale);
      ringMaterial.opacity = obj.ringOpacity;
      
      // Animar a seta
      arrow.position.y = obj.arrowY;
      
      // Animar a espiral
      spiral.rotation.y = obj.spiralRotation;
    })
    .onComplete(() => {
      // Limpa todos os efeitos visuais adicionados com fade out suave
      
      // Fade out suave dos efeitos
      new TWEEN.Tween({ opacity: 1 })
        .to({ opacity: 0 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate((obj) => {
          material.opacity = obj.opacity * 0.7;
          ringMaterial.opacity = obj.opacity * 0.9;
          arrowMaterial.opacity = obj.opacity * 0.8;
          spiralMaterial.opacity = obj.opacity * 0.6;
          light.intensity = obj.opacity * 4;
        })
        .onComplete(() => {
          // Remover os efeitos da cena
          scene.remove(sphere);
          scene.remove(ringMesh);
          scene.remove(arrow);
          scene.remove(spiral);
          scene.remove(light);
          
          temporaryEffects.delete(sphere);
          temporaryEffects.delete(ringMesh);
          temporaryEffects.delete(arrow);
          temporaryEffects.delete(spiral);
          temporaryEffects.delete(light);
          
          resolve();
        })
        .start();
    })
    .start();
  });
}