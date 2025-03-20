/**
 * ObjectLocationMapper.js - Sistema para mapear objetos entre modo normal e sketch
 * 
 * Este componente mantém um mapeamento entre objetos no modo normal e suas
 * representações no modo sketch, facilitando a busca e manipulação entre modos.
 */

// Mapeamento de objetos normais para objetos sketch
const normalToSketchMap = new Map();
// Mapeamento inverso (sketch para normal)
const sketchToNormalMap = new Map();
// Cache de busca por nome para acelerar lookups repetidos
const nameSearchCache = new Map();

// Habilitar logs para debugging
const DEBUG = false;
const debugLog = (message, ...args) => {
  if (DEBUG) console.log(`%c[ObjectMapper] ${message}`, "background: #3f5f2a; color: #fff; padding: 2px 6px;", ...args);
};

/**
 * Limpa todos os mapeamentos e caches
 */
function clearAllMappings() {
  normalToSketchMap.clear();
  sketchToNormalMap.clear();
  nameSearchCache.clear();
  debugLog("Todos os mapeamentos limpos");
}

/**
 * Constrói mapeamentos entre objetos do modelo normal e objetos do modo sketch
 * @param {THREE.Object3D} normalModel - O modelo no modo normal
 * @param {THREE.Scene} sceneWithSketch - A cena contendo o grupo sketch
 */
function buildMappings(normalModel, sceneWithSketch) {
  if (!normalModel || !sceneWithSketch) {
    console.warn("Não foi possível construir mapeamento: modelo ou cena inválidos");
    return;
  }
  
  // Limpa mapeamentos anteriores
  clearAllMappings();
  
  // Encontra o grupo sketch
  const sketchGroup = sceneWithSketch.children.find(child => child.name === "SketchModels");
  if (!sketchGroup) {
    debugLog("Grupo SketchModels não encontrado!");
    return;
  }
  
  // Coleta todos os objetos do modelo normal
  const normalObjects = [];
  normalModel.traverse((obj) => {
    if (obj.isMesh || obj.isGroup) {
      normalObjects.push(obj);
    }
  });
  
  debugLog(`Encontrados ${normalObjects.length} objetos no modelo normal`);
  
  // Expressão regular para identificar sufixos conhecidos
  const suffixRegex = /_(?:thick_)?(?:conditional|edges)$/;
  
  // Para cada objeto no modelo normal, tenta encontrar correspondentes no modo sketch
  normalObjects.forEach(normalObj => {
    const normalName = normalObj.name.toLowerCase();
    if (!normalName) return; // Ignora objetos sem nome
    
    const sketchMatches = [];
    
    // Busca no grupo sketch
    sketchGroup.traverse(sketchObj => {
      if (sketchObj.isMesh || sketchObj.isLine || sketchObj.isLineSegments || sketchObj.isPoints) {
        let sketchName = sketchObj.name.toLowerCase();
        let baseName = sketchName;
        
        // Remove sufixos conhecidos
        const suffixMatch = sketchName.match(suffixRegex);
        if (suffixMatch) {
          baseName = sketchName.replace(suffixMatch[0], "");
        }
        
        // Verifica se há correspondência
        if (baseName === normalName || 
            baseName.includes(normalName) || 
            normalName.includes(baseName)) {
          sketchMatches.push({
            object: sketchObj,
            baseName: baseName,
            suffix: suffixMatch ? suffixMatch[0] : ""
          });
        }
      }
    });
    
    // Se encontrou correspondências, armazena no mapeamento
    if (sketchMatches.length > 0) {
      debugLog(`Encontradas ${sketchMatches.length} correspondências para "${normalName}"`);
      normalToSketchMap.set(normalObj.uuid, sketchMatches.map(match => ({
        uuid: match.object.uuid,
        name: match.object.name,
        baseName: match.baseName,
        suffix: match.suffix
      })));
      
      // Armazena também o mapeamento inverso
      sketchMatches.forEach(match => {
        sketchToNormalMap.set(match.object.uuid, {
          uuid: normalObj.uuid,
          name: normalObj.name
        });
      });
    }
  });
  
  debugLog(`Mapeamento construído com ${normalToSketchMap.size} objetos normais e correspondências no modo sketch`);
}

/**
 * Encontra objetos correspondentes a um nome em ambos os modos
 * @param {string} name - Nome ou parte do nome do objeto a ser procurado
 * @param {THREE.Scene} scene - A cena para busca
 * @param {string} mode - 'normal', 'sketch' ou 'auto' (detecta automaticamente)
 * @returns {Object} - Objeto com resultados em ambos os modos
 */
function findObjectsByName(name, scene, mode = 'auto') {
  if (!name || !scene) {
    return { normalObjects: [], sketchObjects: [] };
  }
  
  // Normaliza o nome para busca
  const normalizedName = name.trim().toLowerCase();
  
  // Verifica o cache primeiro
  const cacheKey = `${normalizedName}:${scene.uuid}:${mode}`;
  if (nameSearchCache.has(cacheKey)) {
    const cached = nameSearchCache.get(cacheKey);
    if (cached.timestamp > Date.now() - 10000) { // Cache de 10 segundos
      debugLog(`Usando resultados em cache para "${normalizedName}"`);
      return cached.results;
    }
  }
  
  // Se modo é 'auto', tenta detectar o modo atual
  const currentMode = mode === 'auto' ? 
    (window._debugSketchMode?.getSketchStatus?.()?.currentMode || 'normal') : 
    mode;
  
  const isSketchMode = currentMode === 'sketch';
  debugLog(`Buscando "${normalizedName}" no modo ${isSketchMode ? 'sketch' : 'normal'}`);
  
  // Encontra o grupo sketch se estamos no modo sketch
  const sketchGroup = isSketchMode ? 
    scene.children.find(child => child.name === "SketchModels") : 
    null;
  
  // Resultado da busca
  const result = {
    normalObjects: [],
    sketchObjects: []
  };
  
  // Função para verificar correspondência de nome
  const nameMatches = (objName, searchName) => {
    if (!objName) return false;
    
    const lowerName = objName.toLowerCase();
    return lowerName.includes(searchName) || searchName.includes(lowerName);
  };
  
  // Busca objetos no modo normal
  scene.traverse(obj => {
    if ((obj.isMesh || obj.isGroup) && nameMatches(obj.name, normalizedName)) {
      // Verifica se não é um objeto do grupo sketch
      const isSketchObject = sketchGroup && (obj === sketchGroup || sketchGroup.getObjectById(obj.id));
      if (!isSketchObject) {
        result.normalObjects.push(obj);
      }
    }
  });
  
  // Se estamos no modo sketch, busca objetos no grupo sketch
  if (isSketchMode && sketchGroup) {
    sketchGroup.traverse(obj => {
      // Remover sufixos para comparação
      let baseName = obj.name || "";
      baseName = baseName.toLowerCase().replace(/_(?:thick_)?(?:conditional|edges)$/, "");
      
      if (nameMatches(baseName, normalizedName) || nameMatches(obj.name, normalizedName)) {
        result.sketchObjects.push(obj);
      }
    });
    
    // Para objetos normais encontrados, busca correspondências no modo sketch usando o mapeamento
    if (result.normalObjects.length > 0 && normalToSketchMap.size > 0) {
      result.normalObjects.forEach(normalObj => {
        const sketchMatches = normalToSketchMap.get(normalObj.uuid);
        if (sketchMatches) {
          sketchMatches.forEach(match => {
            // Encontra o objeto real na cena a partir do UUID
            sketchGroup.traverse(obj => {
              if (obj.uuid === match.uuid && !result.sketchObjects.includes(obj)) {
                result.sketchObjects.push(obj);
              }
            });
          });
        }
      });
    }
  }
  
  // Armazena resultado no cache
  nameSearchCache.set(cacheKey, {
    timestamp: Date.now(),
    results: result
  });
  
  debugLog(`Encontrados ${result.normalObjects.length} objetos normais e ${result.sketchObjects.length} objetos sketch`);
  return result;
}

/**
 * Encontra todos os objetos sketch correspondentes a um objeto normal
 * @param {THREE.Object3D} normalObject - O objeto normal
 * @param {THREE.Scene} scene - A cena contendo o grupo sketch
 * @returns {Array} - Array de objetos sketch correspondentes
 */
function findSketchObjectsForNormalObject(normalObject, scene) {
  if (!normalObject || !scene) return [];
  
  // Se o mapeamento não foi construído, tenta construí-lo primeiro
  if (normalToSketchMap.size === 0) {
    // Encontra o modelo raiz do objeto normal
    let modelRoot = normalObject;
    while (modelRoot.parent && modelRoot.parent !== scene) {
      modelRoot = modelRoot.parent;
    }
    
    buildMappings(modelRoot, scene);
  }
  
  // Verifica se temos um mapeamento para este objeto
  const matches = normalToSketchMap.get(normalObject.uuid);
  if (!matches || matches.length === 0) {
    debugLog(`Nenhuma correspondência sketch encontrada para ${normalObject.name}`);
    return [];
  }
  
  // Encontra o grupo sketch
  const sketchGroup = scene.children.find(child => child.name === "SketchModels");
  if (!sketchGroup) return [];
  
  // Converte UUIDs em objetos reais
  const sketchObjects = [];
  matches.forEach(match => {
    sketchGroup.traverse(obj => {
      if (obj.uuid === match.uuid) {
        sketchObjects.push(obj);
      }
    });
  });
  
  debugLog(`Encontrados ${sketchObjects.length} objetos sketch para ${normalObject.name}`);
  return sketchObjects;
}

/**
 * Encontra o objeto normal correspondente a um objeto sketch
 * @param {THREE.Object3D} sketchObject - O objeto sketch
 * @param {THREE.Scene} scene - A cena contendo o modelo normal
 * @returns {THREE.Object3D|null} - O objeto normal correspondente ou null
 */
function findNormalObjectForSketchObject(sketchObject, scene) {
  if (!sketchObject || !scene) return null;
  
  // Se o mapeamento não foi construído, não podemos fazer a busca inversa facilmente
  if (sketchToNormalMap.size === 0) {
    debugLog("Mapeamento sketch->normal não disponível. Use buildMappings primeiro.");
    return null;
  }
  
  // Verifica se temos um mapeamento para este objeto
  const match = sketchToNormalMap.get(sketchObject.uuid);
  if (!match) {
    debugLog(`Nenhuma correspondência normal encontrada para ${sketchObject.name}`);
    return null;
  }
  
  // Busca o objeto normal na cena
  let normalObject = null;
  scene.traverse(obj => {
    if (obj.uuid === match.uuid) {
      normalObject = obj;
    }
  });
  
  return normalObject;
}

// Exporta as funções públicas
export const objectLocationMapper = {
  buildMappings,
  findObjectsByName,
  findSketchObjectsForNormalObject,
  findNormalObjectForSketchObject,
  clearAllMappings
};

// Adiciona ao objeto global window._debugSketchMode para acesso de debugging
if (window._debugSketchMode) {
  window._debugSketchMode.objectMapper = objectLocationMapper;
}