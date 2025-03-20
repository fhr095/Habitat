// ObjectReferenceMapper.js
// Utilitário para gerenciar referências entre objetos normais e em modo sketch

import * as THREE from 'three';

/**
 * Classe para mapear entre UUIDs de objetos originais e seus correspondentes no modo sketch
 * para manter referências consistentes entre modos de visualização.
 */
class ObjectReferenceMapper {
  constructor() {
    this.normalToSketchMap = new Map();
    this.sketchToNormalMap = new Map();
    this.nameToObjectsMap = new Map();
    this.initialized = false;
    
    // Expor globalmente para acesso do FocusOnObject
    window._objectMapper = this;
  }
  
  /**
   * Constrói mapeamentos de referência entre objetos da cena normal e da cena sketch
   * @param {THREE.Object3D} normalSceneObject - Objeto da cena regular (normalmente modelRef.current)
   * @param {THREE.Scene} scene - Cena completa para encontrar grupo sketch
   */
  buildMappings(normalSceneObject, scene) {
    if (!normalSceneObject || !scene) {
      console.warn("ObjectReferenceMapper: Faltando objetos para construir mapeamentos");
      return;
    }
    
    console.log("ObjectReferenceMapper: Construindo mapeamentos entre objetos normal/sketch");
    
    // Limpar mapeamentos existentes
    this.normalToSketchMap.clear();
    this.sketchToNormalMap.clear();
    this.nameToObjectsMap.clear();
    
    // Encontrar o grupo sketch
    const sketchGroup = scene.children.find(child => child.name === "SketchModels");
    if (!sketchGroup) {
      console.warn("ObjectReferenceMapper: Grupo SketchModels não encontrado na cena");
      return;
    }
    
    // Construir mapeamentos baseados em nome
    this._mapObjectsByName(normalSceneObject);
    this._mapObjectsByName(sketchGroup);
    
    // Construir mapeamentos diretos entre objetos com os mesmos nomes
    this._buildDirectMappings();
    
    this.initialized = true;
    console.log(`ObjectReferenceMapper: Mapeamentos construídos - ${this.normalToSketchMap.size} normal->sketch, ${this.sketchToNormalMap.size} sketch->normal`);
    
    // Armazenar referência também na cena para acesso facilitado
    if (scene.userData) {
      scene.userData._objectMapper = this;
    }
  }
  
  /**
   * Mapeia objetos pelos seus nomes para consulta
   * @param {THREE.Object3D} root - Objeto raiz para percorrer
   * @private
   */
  _mapObjectsByName(root) {
    if (!root) return;
    
    const processObject = (object) => {
      if (object.name) {
        // Normaliza e limpa o nome para correspondência mais robusta
        const normalizedName = object.name.toLowerCase()
          .replace(/[-_\s]+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
        
        // Adiciona ao mapa baseado em nome
        if (!this.nameToObjectsMap.has(normalizedName)) {
          this.nameToObjectsMap.set(normalizedName, []);
        }
        this.nameToObjectsMap.get(normalizedName).push({
          object: object,
          isSketch: this._hasSketchModeParent(object)
        });
      }
      
      // Processa filhos recursivamente
      if (object.children && object.children.length > 0) {
        object.children.forEach(child => processObject(child));
      }
    };
    
    processObject(root);
  }
  
  /**
   * Constrói mapeamentos diretos entre objetos normal e sketch
   * @private
   */
  _buildDirectMappings() {
    // Para cada objeto nomeado, mapeia entre versões normal e sketch
    this.nameToObjectsMap.forEach((objects, name) => {
      // Pula nomes com apenas um objeto (sem correspondência)
      if (objects.length < 2) return;
      
      // Separa objetos normais e sketch
      const normalObjects = objects.filter(item => !item.isSketch).map(item => item.object);
      const sketchObjects = objects.filter(item => item.isSketch).map(item => item.object);
      
      // Pula se não tivermos pelo menos um de cada tipo
      if (normalObjects.length === 0 || sketchObjects.length === 0) return;
      
      // Cria mapeamentos entre cada par normal/sketch
      normalObjects.forEach(normalObj => {
        sketchObjects.forEach(sketchObj => {
          this.normalToSketchMap.set(normalObj.uuid, sketchObj);
          this.sketchToNormalMap.set(sketchObj.uuid, normalObj);
        });
      });
    });
  }
  
  /**
   * Verifica se um objeto tem um pai SketchModels
   * @param {THREE.Object3D} object - Objeto para verificar
   * @returns {boolean} - True se tem pai sketch
   * @private
   */
  _hasSketchModeParent(object) {
    let current = object;
    while (current && current.parent) {
      if (current.parent.name === "SketchModels") {
        return true;
      }
      current = current.parent;
    }
    return false;
  }
  
  /**
   * Obtém o objeto equivalente no outro modo
   * @param {THREE.Object3D} object - Objeto para encontrar equivalente
   * @param {String} currentMode - Modo de visualização atual ('normal' ou 'sketch')
   * @returns {THREE.Object3D|null} - Objeto equivalente ou null se não encontrado
   */
  getEquivalentObject(object, currentMode) {
    if (!object) return null;
    
    // Se não estamos inicializados, retorna null
    if (!this.initialized) return null;
    
    // Busca o objeto equivalente com base no modo atual
    if (currentMode === 'normal') {
      return this.normalToSketchMap.get(object.uuid) || null;
    } else {
      return this.sketchToNormalMap.get(object.uuid) || null;
    }
  }
  
  /**
   * Encontra objetos pelo nome em ambos os modos
   * @param {String} targetName - Nome a procurar
   * @param {THREE.Scene} scene - A cena
   * @param {String} currentMode - Modo de visualização atual
   * @returns {Array} - Array de objetos correspondentes
   */
  findObjectsByName(targetName, scene, currentMode) {
    if (!targetName || !scene) return [];
    
    // Se não estamos inicializados e temos objetos suficientes, inicialize agora
    if (!this.initialized && currentMode === 'sketch') {
      const sketchGroup = scene.children.find(child => child.name === "SketchModels");
      // Busca o objeto original - é mais complexo, tentamos encontrar qualquer referência
      let originalObject = null;
      scene.traverse(obj => {
        if (!originalObject && obj.isMesh && !this._hasSketchModeParent(obj)) {
          originalObject = obj;
        }
      });
      
      if (sketchGroup && originalObject) {
        this.buildMappings(originalObject, scene);
      }
    }
    
    // Normaliza o nome alvo para correspondência mais robusta
    const normalizedTargetName = targetName.toLowerCase()
      .replace(/[-_\s]+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    
    const results = [];
    
    // MELHORIA: Busca mais flexível com correspondência parcial
    this.nameToObjectsMap.forEach((objects, name) => {
      if (name.includes(normalizedTargetName) || normalizedTargetName.includes(name)) {
        // Filtra objetos com base no modo atual
        const filteredObjects = objects
          .filter(item => currentMode === 'sketch' ? item.isSketch : !item.isSketch)
          .map(item => item.object);
        
        results.push(...filteredObjects);
      }
    });
    
    // Se não encontramos nada e temos 'edges' ou 'conditional' no nome alvo,
    // tente buscar com uma versão mais limpa do nome
    if (results.length === 0 && 
        (normalizedTargetName.includes("_edges") || 
         normalizedTargetName.includes("_conditional") ||
         normalizedTargetName.includes("_thick"))) {
      
      // Remove sufixos de modo sketch para encontrar o objeto base
      const cleanName = normalizedTargetName
        .replace("_edges", "")
        .replace("_conditional", "")
        .replace("_thick", "");
      
      // Tenta novamente com o nome limpo
      this.nameToObjectsMap.forEach((objects, name) => {
        if (name.includes(cleanName) || cleanName.includes(name)) {
          const filteredObjects = objects
            .filter(item => currentMode === 'sketch' ? item.isSketch : !item.isSketch)
            .map(item => item.object);
          
          results.push(...filteredObjects);
        }
      });
    }
    
    // MELHORIA: Busca por tokens em nomes
    if (results.length === 0) {
      // Dividir o nome em tokens para busca mais flexível
      const tokens = normalizedTargetName.split('_').filter(t => t.length > 2);
      
      if (tokens.length > 0) {
        console.log(`ObjectMapper: Tentando busca por tokens: ${tokens.join(', ')}`);
        
        // Buscar objetos que contenham qualquer um dos tokens
        this.nameToObjectsMap.forEach((objects, name) => {
          for (const token of tokens) {
            if (name.includes(token)) {
              const filteredObjects = objects
                .filter(item => currentMode === 'sketch' ? item.isSketch : !item.isSketch)
                .map(item => item.object);
              
              results.push(...filteredObjects);
              break;
            }
          }
        });
      }
    }
    
    // Busca de fallback no caso do mapeamento não encontrar nada
    if (results.length === 0) {
      console.log(`ObjectReferenceMapper: Usando busca fallback para '${targetName}'`);
      
      // Busca recursiva direta na cena
      const searchResults = [];
      const sketchGroup = scene.children.find(child => child.name === "SketchModels");
      
      const searchObject = (root) => {
        if (!root) return;
        
        if (root.name) {
          const normalizedName = root.name.toLowerCase()
            .replace(/[-_\s]+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
          
          if (normalizedName.includes(normalizedTargetName) || 
              normalizedTargetName.includes(normalizedName)) {
            searchResults.push(root);
          }
        }
        
        if (root.children && root.children.length > 0) {
          root.children.forEach(child => searchObject(child));
        }
      };
      
      // Busca no grupo sketch se estamos no modo sketch
      if (currentMode === 'sketch' && sketchGroup) {
        searchObject(sketchGroup);
      } else {
        // Busca em toda a cena exceto no grupo sketch se estamos no modo normal
        scene.children.forEach(child => {
          if (child.name !== "SketchModels") {
            searchObject(child);
          }
        });
      }
      
      results.push(...searchResults);
    }
    
    return results;
  }
  
  /**
   * Redefine o mapeador, limpando todos os mapeamentos existentes
   */
  reset() {
    this.normalToSketchMap.clear();
    this.sketchToNormalMap.clear();
    this.nameToObjectsMap.clear();
    this.initialized = false;
    console.log("ObjectReferenceMapper: Reset completo");
  }
}

// Exporta instância singleton para uso em toda a aplicação
export const objectMapper = new ObjectReferenceMapper();