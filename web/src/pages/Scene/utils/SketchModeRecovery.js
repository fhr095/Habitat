/**
 * SketchModeRecovery.js
 * Sistema de recuperação para o modo sketch, garantindo que a visibilidade do modelo 
 * seja restaurada corretamente ao alternar entre os modos.
 */

// Cache global para persistência entre remontagens de componentes
const GlobalModeCache = window._sketchModeGlobalCache = window._sketchModeGlobalCache || {
    originalModel: null,
    modelVisibilityMap: new Map(),
    originalMaterials: new Map(),
    sketchActive: false,
    pendingRestore: false,
    sceneReference: null,
    initialVisibility: new Map(),
    recoveryCallbacks: [],
    monitoringActive: false
  };
  
  /**
   * Registra o modelo original com seu estado inicial de visibilidade
   */
  export function registerOriginalModel(model, scene) {
    if (!model) return;
    
    // Armazenar referência ao modelo e à cena
    GlobalModeCache.originalModel = model;
    GlobalModeCache.sceneReference = scene;
    
    // Registrar visibilidade inicial de todos os objetos
    GlobalModeCache.initialVisibility.clear();
    model.traverse(obj => {
      if (obj.isMesh || obj.isGroup) {
        GlobalModeCache.initialVisibility.set(obj.uuid, {
          visible: obj.visible,
          name: obj.name || 'unnamed'
        });
      }
    });
    
    console.log("[SketchRecovery] Modelo original registrado com", 
      GlobalModeCache.initialVisibility.size, "objetos");
    
    // Iniciar monitoramento se ainda não estiver ativo
    startMonitoring();
  }
  
  /**
   * Captura o material original de um objeto
   */
  export function captureOriginalMaterial(object) {
    if (!object || !object.isMesh || !object.material) return;
    
    // Pular se já temos este material
    if (GlobalModeCache.originalMaterials.has(object.uuid)) return;
    
    try {
      // Clone do material
      const originalMaterial = object.material.clone();
      
      // Informações adicionais
      const materialInfo = {
        name: object.name,
        materialType: object.material.type,
        hasColor: object.material.color !== undefined,
        colorValue: object.material.color ? object.material.color.getHexString() : null,
        timestamp: Date.now()
      };
      
      // Armazenar no cache global
      GlobalModeCache.originalMaterials.set(object.uuid, {
        material: originalMaterial,
        info: materialInfo
      });
      
      return true;
    } catch (err) {
      console.error("[SketchRecovery] Erro ao capturar material:", err);
      return false;
    }
  }
  
  /**
   * Força a restauração do modelo original
   */
  export function forceModelRestoration() {
    console.log("[SketchRecovery] Iniciando restauração forçada");
    
    if (!GlobalModeCache.originalModel) {
      console.warn("[SketchRecovery] Nenhum modelo original registrado para restaurar");
      return false;
    }
    
    const model = GlobalModeCache.originalModel;
    const scene = GlobalModeCache.sceneReference;
    
    // 1. Verificar se o modelo está na cena
    if (scene && model.parent !== scene) {
      scene.add(model);
      console.log("[SketchRecovery] Modelo readicionado à cena");
    }
    
    // 2. Restaurar visibilidade
    model.visible = true;
    
    let materialRestoreCount = 0;
    let visibilityRestoreCount = 0;
    
    // 3. Restaurar visibilidade e materiais de todos os objetos
    model.traverse(obj => {
      if (obj.isMesh || obj.isGroup) {
        // Remover flags de modo sketch
        if (obj.userData && obj.userData._hiddenBySketchMode) {
          delete obj.userData._hiddenBySketchMode;
        }
        
        // Restaurar visibilidade
        const initialState = GlobalModeCache.initialVisibility.get(obj.uuid);
        if (initialState) {
          // No caso de objetos especiais como "Plane" que devem permanecer ocultos
          if (obj.name === "Plane") {
            obj.visible = false;
          } else {
            obj.visible = initialState.visible !== false; // Default para true se não especificado
          }
          visibilityRestoreCount++;
        } else {
          // Se não temos estado inicial, assumir visível exceto para "Plane"
          obj.visible = obj.name !== "Plane";
        }
        
        // Restaurar material se for um mesh
        if (obj.isMesh && GlobalModeCache.originalMaterials.has(obj.uuid)) {
          const originalData = GlobalModeCache.originalMaterials.get(obj.uuid);
          if (originalData && originalData.material) {
            obj.material = originalData.material.clone();
            materialRestoreCount++;
          }
        }
      }
    });
    
    // 4. Atualizar estado global
    GlobalModeCache.sketchActive = false;
    GlobalModeCache.pendingRestore = false;
    
    console.log(`[SketchRecovery] Restauração concluída: ${visibilityRestoreCount} visibilidade, ${materialRestoreCount} materiais`);
    
    // 5. Executar callbacks de recuperação
    GlobalModeCache.recoveryCallbacks.forEach(callback => {
      try {
        callback(model);
      } catch (err) {
        console.error("[SketchRecovery] Erro em callback de recuperação:", err);
      }
    });
    
    return true;
  }
  
  /**
   * Adiciona um callback para ser executado durante a recuperação
   */
  export function addRecoveryCallback(callback) {
    if (typeof callback === 'function') {
      GlobalModeCache.recoveryCallbacks.push(callback);
      return true;
    }
    return false;
  }
  
  /**
   * Inicia monitoramento contínuo para detecção e restauração automática
   */
  function startMonitoring() {
    if (GlobalModeCache.monitoringActive) return;
    
    GlobalModeCache.monitoringActive = true;
    console.log("[SketchRecovery] Iniciando monitoramento de visibilidade");
    
    // Verificar a cada segundo se o modelo está visível
    const monitoringInterval = setInterval(() => {
      const model = GlobalModeCache.originalModel;
      
      // Pular se não temos modelo ou se o modo sketch está ativo
      if (!model || GlobalModeCache.sketchActive) return;
      
      // Verificar se o modelo está visível
      if (!model.visible || !model.parent) {
        console.warn("[SketchRecovery] Detectada perda de visibilidade do modelo, restaurando...");
        forceModelRestoration();
      }
      
      // Verificar se há algum objeto invisível que deveria estar visível
      let invisibleObjectsCount = 0;
      model.traverse(obj => {
        if ((obj.isMesh || obj.isGroup) && 
            obj.name !== "Plane" && 
            !obj.visible) {
          invisibleObjectsCount++;
        }
      });
      
      if (invisibleObjectsCount > 10) {
        console.warn(`[SketchRecovery] Detectados ${invisibleObjectsCount} objetos invisíveis, restaurando...`);
        forceModelRestoration();
      }
    }, 2000);  // Verificar a cada 2 segundos
    
    // Função global de emergência para depuração
    window.forceModelRestore = forceModelRestoration;
    
    // Retornar função de limpeza
    return () => {
      clearInterval(monitoringInterval);
      GlobalModeCache.monitoringActive = false;
    };
  }
  
  export default {
    registerOriginalModel,
    captureOriginalMaterial,
    forceModelRestoration,
    addRecoveryCallback
  };