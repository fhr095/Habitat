// MaterialManager.js
// Sistema de gerenciamento e preservação de materiais

import * as THREE from 'three';

class MaterialManager {
  constructor() {
    this.originalMaterials = new Map();
    this.modifiedTimestamps = new Map();
    this.debugEnabled = true;
    this.initialized = false;
  }

  // Captura todos os materiais originais da cena
  captureOriginalMaterials(scene) {
    const timestamp = performance.now();
    if (this.initialized) {
      this.logDebug(`Recapturando materiais originais em ${timestamp.toFixed(2)}ms`);
    } else {
      this.logDebug(`Iniciando captura de materiais originais em ${timestamp.toFixed(2)}ms`);
      this.initialized = true;
    }

    scene.traverse(object => {
      if (!object.isMesh || !object.material) return;

      // Gera uma chave única para o material que inclui o UUID do objeto
      const key = object.uuid;
      
      // Se já capturamos este material, não o capturamos novamente
      if (this.originalMaterials.has(key)) return;
      
      // Clone profundo do material (para arrays de materiais também)
      const materialClone = this.cloneMaterialDeep(object.material);
      
      // Registra quando o material foi capturado
      this.modifiedTimestamps.set(key, {
        capturedAt: timestamp,
        lastModified: timestamp,
        modificationCount: 0
      });
      
      // Armazena o material clonado
      this.originalMaterials.set(key, {
        material: materialClone,
        maps: this.extractMaps(object.material)
      });
      
      this.logDebug(`Capturado material original para: ${object.name || 'Objeto sem nome'} (${key})`);
    });
    
    this.logDebug(`Captura de materiais concluída em ${performance.now() - timestamp}ms. Total: ${this.originalMaterials.size} materiais.`);
  }
  
  // Cria um clone profundo do material
  cloneMaterialDeep(material) {
    if (Array.isArray(material)) {
      return material.map(m => this.cloneMaterialDeep(m));
    }
    
    const clone = material.clone();
    
    // Clona manualmente propriedades que o clone() normal pode não capturar completamente
    if (material.map) clone.map = material.map;
    if (material.normalMap) clone.normalMap = material.normalMap;
    if (material.roughnessMap) clone.roughnessMap = material.roughnessMap;
    if (material.metalnessMap) clone.metalnessMap = material.metalnessMap;
    if (material.emissiveMap) clone.emissiveMap = material.emissiveMap;
    if (material.alphaMap) clone.alphaMap = material.alphaMap;
    if (material.aoMap) clone.aoMap = material.aoMap;
    if (material.lightMap) clone.lightMap = material.lightMap;
    if (material.envMap) clone.envMap = material.envMap;
    
    // Preserva as opacidades e flags
    clone.transparent = material.transparent;
    clone.opacity = material.opacity;
    clone.alphaTest = material.alphaTest;
    clone.side = material.side;
    
    return clone;
  }

  // Extrai todos os mapas de um material para armazenamento separado
  extractMaps(material) {
    if (Array.isArray(material)) {
      return material.map(m => this.extractMaps(m));
    }
    
    const maps = {};
    
    if (material.map) maps.map = material.map;
    if (material.normalMap) maps.normalMap = material.normalMap;
    if (material.roughnessMap) maps.roughnessMap = material.roughnessMap;
    if (material.metalnessMap) maps.metalnessMap = material.metalnessMap;
    if (material.emissiveMap) maps.emissiveMap = material.emissiveMap;
    if (material.alphaMap) maps.alphaMap = material.alphaMap;
    if (material.aoMap) maps.aoMap = material.aoMap;
    if (material.lightMap) maps.lightMap = material.lightMap;
    if (material.envMap) maps.envMap = material.envMap;
    
    return maps;
  }

  // Monitora alterações nos materiais da cena
  monitorMaterialChanges(scene, label = 'Verificação padrão') {
    const timestamp = performance.now();
    this.logDebug(`\n[${label}] Monitorando alterações de materiais em ${timestamp.toFixed(2)}ms`);
    
    // Conta as alterações
    let changedMaterials = 0;
    let missingMaps = 0;
    let modifiedMeshes = [];
    
    scene.traverse(object => {
      if (!object.isMesh || !object.material) return;
      
      const key = object.uuid;
      
      // Se não temos o original, não podemos comparar
      if (!this.originalMaterials.has(key)) return;
      
      const original = this.originalMaterials.get(key);
      const current = object.material;
      
      // Função para verificar se um material foi modificado
      const checkModified = (orig, curr, mapName, objId) => {
        // Verifica se o mapa original existe mas não está no material atual
        if (orig[mapName] && !curr[mapName]) {
          missingMaps++;
          this.logDebug(`✗ [${label}] Mapa perdido: ${mapName} em ${object.name || objId}`);
          return true;
        }
        return false;
      };
      
      let isModified = false;
      
      // Verifica alterações em arrays de materiais
      if (Array.isArray(current) && Array.isArray(original.material)) {
        for (let i = 0; i < Math.min(current.length, original.material.length); i++) {
          const origMat = original.material[i];
          const currMat = current[i];
          const origMaps = original.maps[i];
          
          // Verifica cada tipo de mapa
          for (const mapName in origMaps) {
            if (checkModified(origMaps, currMat, mapName, key)) {
              isModified = true;
            }
          }
        }
      } 
      // Verifica alterações em materiais únicos
      else if (!Array.isArray(current) && !Array.isArray(original.material)) {
        for (const mapName in original.maps) {
          if (checkModified(original.maps, current, mapName, key)) {
            isModified = true;
          }
        }
      }
      
      // Se detectamos modificações, atualizamos as estatísticas
      if (isModified) {
        changedMaterials++;
        modifiedMeshes.push(object.name || key);
        
        // Atualiza o timestamp de modificação
        const timeData = this.modifiedTimestamps.get(key) || 
                         { capturedAt: timestamp, modificationCount: 0 };
        
        timeData.lastModified = timestamp;
        timeData.modificationCount += 1;
        this.modifiedTimestamps.set(key, timeData);
      }
    });
    
    // Log final
    this.logDebug(`[${label}] Verificação concluída em ${performance.now() - timestamp}ms`);
    this.logDebug(`[${label}] Materiais alterados: ${changedMaterials}, Mapas perdidos: ${missingMaps}`);
    
    if (modifiedMeshes.length > 0) {
      this.logDebug(`[${label}] Objetos modificados: ${modifiedMeshes.join(', ')}`);
    }
    
    return { changedMaterials, missingMaps, modifiedMeshes };
  }

  // Restaura os materiais originais
  restoreOriginalMaterials(scene, force = false) {
    const timestamp = performance.now();
    this.logDebug(`\nRestaurando materiais originais ${force ? '(forçado)' : ''} em ${timestamp.toFixed(2)}ms`);
    
    let restoredCount = 0;
    
    scene.traverse(object => {
      if (!object.isMesh || !object.material) return;
      
      const key = object.uuid;
      
      // Se não temos o original, não podemos restaurar
      if (!this.originalMaterials.has(key)) return;
      
      const original = this.originalMaterials.get(key);
      const timeData = this.modifiedTimestamps.get(key);
      
      // Só restaura se force=true ou se foi modificado
      const shouldRestore = force || 
                          (timeData && timeData.lastModified > timeData.capturedAt);
      
      if (shouldRestore) {
        // Restaura o material
        if (Array.isArray(object.material) && Array.isArray(original.material)) {
          // Descarta os materiais atuais para evitar vazamentos de memória
          object.material.forEach(mat => {
            if (mat && mat.dispose) mat.dispose();
          });
          
          // Clone os materiais originais
          object.material = original.material.map(mat => mat.clone());
          
          // Restaura todos os mapas
          object.material.forEach((mat, i) => {
            const maps = original.maps[i];
            for (const mapName in maps) {
              mat[mapName] = maps[mapName];
            }
            mat.needsUpdate = true;
          });
        } 
        else if (!Array.isArray(object.material) && !Array.isArray(original.material)) {
          // Descarta o material atual
          if (object.material && object.material.dispose) {
            object.material.dispose();
          }
          
          // Clone o material original
          object.material = original.material.clone();
          
          // Restaura todos os mapas
          for (const mapName in original.maps) {
            object.material[mapName] = original.maps[mapName];
          }
          
          object.material.needsUpdate = true;
        }
        
        restoredCount++;
        this.logDebug(`✓ Restaurado material para: ${object.name || key}`);
      }
    });
    
    this.logDebug(`Restauração concluída em ${performance.now() - timestamp}ms. Restaurados: ${restoredCount} materiais.`);
    return restoredCount;
  }

  // Log de depuração
  logDebug(message) {
    if (this.debugEnabled) {
      console.log(`MaterialManager: ${message}`);
    }
  }
}

// Instância singleton para uso em toda a aplicação
export const materialManager = new MaterialManager();