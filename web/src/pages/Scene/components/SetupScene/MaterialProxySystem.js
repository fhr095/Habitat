// MaterialProxySystem.js
// Sistema que preserva materiais originais e cria proxies para efeitos visuais
import * as THREE from 'three';

class MaterialProxySystem {
  constructor() {
    this.originalMaterials = new WeakMap();
    this.proxyMaterials = new WeakMap();
    this.debugEnabled = false;
  }
  
  // Registra um material para proteção
  register(object) {
    if (!object.isMesh || this.originalMaterials.has(object)) return;
    
    try {
      // Armazena o material original
      const origMaterial = Array.isArray(object.material) 
        ? object.material.map(m => this.cloneWithMaps(m))
        : this.cloneWithMaps(object.material);
      
      this.originalMaterials.set(object, origMaterial);
      
      if (this.debugEnabled) {
        console.log(`MaterialProxy: Registrado material original para ${object.name || 'objeto sem nome'}`);
      }
    } catch (error) {
      console.error(`Erro ao registrar material para ${object.name || 'objeto sem nome'}:`, error);
    }
  }
  
  // Registra todos os materiais na cena
  registerScene(scene) {
    const startTime = performance.now();
    let count = 0;
    
    scene.traverse(object => {
      if (object.isMesh && !this.originalMaterials.has(object)) {
        this.register(object);
        count++;
      }
    });
    
    const duration = performance.now() - startTime;
    if (this.debugEnabled) {
      console.log(`MaterialProxy: Registrados ${count} materiais em ${duration.toFixed(2)}ms`);
    }
    
    return count;
  }
  
  // Cria um clone completo do material com todos os mapas
  cloneWithMaps(material) {
    if (!material) return null;
    
    // Cria um clone básico
    const clone = material.clone();
    
    // Preserva todos os mapas cruciais
    this.preserveMaps(material, clone);
    
    // Marca como material original
    clone.userData = clone.userData || {};
    clone.userData.isOriginalMaterial = true;
    
    return clone;
  }
  
  // Cria um proxy para o material que será modificado pelos efeitos
  createProxy(object, effectType) {
    if (!this.originalMaterials.has(object)) {
      this.register(object);
    }
    
    const original = this.originalMaterials.get(object);
    
    // Cria um material que será usado para o efeito específico
    const proxyMaterial = Array.isArray(original)
      ? original.map(m => this.createEffectMaterial(m, effectType))
      : this.createEffectMaterial(original, effectType);
    
    // Armazena o proxy para referência
    this.proxyMaterials.set(object, {
      material: proxyMaterial,
      effectType
    });
    
    return proxyMaterial;
  }
  
  // Cria um material específico para o efeito desejado
  createEffectMaterial(material, effectType) {
    if (!material) return null;
    
    const proxy = material.clone();
    
    // Preserva mapas importantes
    this.preserveMaps(material, proxy);
    
    // Configurações específicas baseadas no tipo de efeito
    switch (effectType) {
      case 'bloom':
        // Configura para bloom sem perder propriedades visuais
        if (proxy.emissive) {
          proxy.userData.originalEmissive = proxy.emissive.clone();
          proxy.userData.originalEmissiveIntensity = proxy.emissiveIntensity;
        }
        break;
        
      case 'environment':
        // Configura para environment mapping
        if (proxy.isMeshStandardMaterial || proxy.isMeshPhysicalMaterial) {
          // Preserva a intensidade do environment map original
          proxy.userData.originalEnvMapIntensity = proxy.envMapIntensity;
        }
        break;
        
      case 'darkMaterial':
        // Material escuro específico para renderização de bloom
        // Importante: preserva apenas as propriedades necessárias para identificação
        proxy.transparent = material.transparent;
        proxy.opacity = material.opacity;
        proxy.visible = material.visible;
        break;
    }
    
    // Marca como proxy
    proxy.userData = proxy.userData || {};
    proxy.userData.isProxyMaterial = true;
    proxy.userData.effectType = effectType;
    proxy.userData.createdAt = Date.now();
    
    return proxy;
  }
  
  // Aplica um efeito ao objeto, retornando o material de proxy
  applyEffect(object, effectType, effectParams = {}) {
    if (!object || !object.isMesh) return null;
    
    try {
      // Se já existe um proxy para este efeito, reutiliza
      const existingProxy = this.proxyMaterials.get(object);
      if (existingProxy && existingProxy.effectType === effectType) {
        // Atualiza parâmetros no proxy existente
        this.configureEffectParams(existingProxy.material, effectType, effectParams);
        object.material = existingProxy.material;
        return existingProxy.material;
      }
      
      // Cria um novo proxy para o efeito
      const proxyMaterial = this.createProxy(object, effectType);
      
      // Aplica parâmetros específicos do efeito
      this.configureEffectParams(proxyMaterial, effectType, effectParams);
      
      // Substitui o material do objeto pelo proxy
      const previousMaterial = object.material;
      object.material = proxyMaterial;
      
      // Limpa material anterior se não for o original
      if (previousMaterial && 
          previousMaterial !== this.originalMaterials.get(object) && 
          previousMaterial.dispose) {
        previousMaterial.dispose();
      }
      
      if (this.debugEnabled) {
        console.log(`MaterialProxy: Aplicado efeito '${effectType}' para ${object.name || 'objeto sem nome'}`);
      }
      
      return proxyMaterial;
    } catch (error) {
      console.error(`Erro ao aplicar efeito ${effectType} para ${object.name || 'objeto sem nome'}:`, error);
      return null;
    }
  }
  
  // Aplica um efeito a todos os objetos que correspondem a determinados critérios
  applyEffectToScene(scene, effectType, effectParams = {}, filter = null) {
    let count = 0;
    
    scene.traverse(object => {
      if (!object.isMesh) return;
      
      // Aplica filtro personalizado se fornecido
      if (filter && !filter(object)) return;
      
      this.applyEffect(object, effectType, effectParams);
      count++;
    });
    
    if (this.debugEnabled) {
      console.log(`MaterialProxy: Aplicado efeito '${effectType}' a ${count} objetos na cena`);
    }
    
    return count;
  }
  
  // Remove efeitos e restaura o material original
  removeEffect(object) {
    if (!object || !object.isMesh || !this.originalMaterials.has(object)) return null;
    
    try {
      const original = this.originalMaterials.get(object);
      
      // Limpa o material atual se for um proxy
      if (object.material !== original && object.material.dispose) {
        // Verifica se é um material proxy pelo userData
        if (object.material.userData && object.material.userData.isProxyMaterial) {
          object.material.dispose();
        }
      }
      
      // Restaura o material original
      object.material = Array.isArray(original) 
        ? original.map(m => m.clone()) 
        : original.clone();
      
      // Garante que todos os mapas sejam atualizados
      if (Array.isArray(object.material)) {
        object.material.forEach(m => {
          if (m) m.needsUpdate = true;
        });
      } else if (object.material) {
        object.material.needsUpdate = true;
      }
      
      // Remove referência de proxy
      this.proxyMaterials.delete(object);
      
      if (this.debugEnabled) {
        console.log(`MaterialProxy: Restaurado material original para ${object.name || 'objeto sem nome'}`);
      }
      
      return object.material;
    } catch (error) {
      console.error(`Erro ao remover efeito para ${object.name || 'objeto sem nome'}:`, error);
      return null;
    }
  }
  
  // Remove efeitos de todos os objetos na cena
  removeEffectsFromScene(scene) {
    let count = 0;
    
    scene.traverse(object => {
      if (object.isMesh && this.proxyMaterials.has(object)) {
        this.removeEffect(object);
        count++;
      }
    });
    
    if (this.debugEnabled) {
      console.log(`MaterialProxy: Removidos efeitos de ${count} objetos na cena`);
    }
    
    return count;
  }
  
  // Cria um material escuro para renderização de passes de bloom
  getDarkMaterial() {
    if (!this._darkMaterial) {
      this._darkMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        fog: false
      });
      this._darkMaterial.userData.isDarkMaterial = true;
    }
    
    return this._darkMaterial;
  }
  
  // Aplica material escuro para todos os objetos que não estão no layer de bloom
  applyDarkMaterial(scene, bloomLayer) {
    this._tempMaterials = this._tempMaterials || {};
    
    scene.traverse(object => {
      if (object.isMesh && !object.layers.test(bloomLayer)) {
        // Armazena material atual
        this._tempMaterials[object.uuid] = object.material;
        
        // Aplica material escuro
        object.material = this.getDarkMaterial();
      }
    });
  }
  
  // Restaura materiais originais após renderização de bloom
  restoreMaterials(scene) {
    if (!this._tempMaterials) return;
    
    scene.traverse(object => {
      if (object.isMesh && this._tempMaterials[object.uuid]) {
        object.material = this._tempMaterials[object.uuid];
        delete this._tempMaterials[object.uuid];
      }
    });
  }
  
  // Utilitários para preservar mapas e propriedades
  preserveMaps(source, target) {
    if (!source || !target) return target;
    
    // Lista de mapas importantes a preservar
    const mapProperties = [
      'map', 'normalMap', 'roughnessMap', 'metalnessMap', 
      'emissiveMap', 'alphaMap', 'aoMap', 'lightMap', 'envMap',
      'bumpMap', 'displacementMap', 'specularMap'
    ];
    
    mapProperties.forEach(mapName => {
      if (source[mapName]) {
        target[mapName] = source[mapName];
      }
    });
    
    // Preserva outras propriedades importantes
    target.transparent = source.transparent;
    target.opacity = source.opacity;
    target.side = source.side;
    target.visible = source.visible;
    target.colorWrite = source.colorWrite;
    target.depthWrite = source.depthWrite;
    target.depthTest = source.depthTest;
    
    return target;
  }
  
  // Configuração de parâmetros específicos para cada efeito
  configureEffectParams(material, effectType, params) {
    const materials = Array.isArray(material) ? material : [material];
    
    materials.forEach(mat => {
      if (!mat) return;
      
      switch (effectType) {
        case 'bloom':
          if (params.emissiveIntensity !== undefined && mat.emissiveIntensity !== undefined) {
            mat.emissiveIntensity = params.emissiveIntensity;
          }
          
          if (params.emissiveColor && mat.emissive) {
            mat.emissive = new THREE.Color(params.emissiveColor);
          }
          break;
          
        case 'environment':
          if ((mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) && 
              params.envMapIntensity !== undefined) {
            mat.envMapIntensity = params.envMapIntensity;
          }
          break;
          
        // Outros efeitos podem ser adicionados aqui
      }
      
      mat.needsUpdate = true;
    });
  }
  
  // Limpa todos os recursos alocados pelo sistema
  dispose() {
    // Limpar referências para evitar vazamentos de memória
    this.originalMaterials = new WeakMap();
    this.proxyMaterials = new WeakMap();
    
    if (this._darkMaterial) {
      this._darkMaterial.dispose();
      this._darkMaterial = null;
    }
    
    this._tempMaterials = {};
  }
}

// Instância singleton para uso global
export const materialProxySystem = new MaterialProxySystem();