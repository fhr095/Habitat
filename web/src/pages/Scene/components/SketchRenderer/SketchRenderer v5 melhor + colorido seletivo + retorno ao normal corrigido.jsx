// SketchRenderer.jsx - Correção do problema de propriedade indefinida
import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

// Importações das geometrias e materiais personalizados
import { OutsideEdgesGeometry } from './sketch/OutsideEdgesGeometry.js';
import { ConditionalEdgesGeometry } from './sketch/ConditionalEdgesGeometry.js';
import { ConditionalEdgesShader, createCompatibleMaterial } from './sketch/ConditionalEdgesShader.js';
import { ConditionalLineSegmentsGeometry } from './sketch/ConditionalLineSegmentsGeometry.js';
import { ConditionalLineMaterial } from './sketch/ConditionalLineMaterial.js';
import { ColoredShadowMaterial } from './sketch/ColoredShadowMaterial.js';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext.jsx';

// Habilitar/desabilitar logs para debugging
const DEBUG = true;
const debugLog = (...args) => {
  if (DEBUG) console.log("[SketchRenderer]", ...args);
};

// Cache global persistente para referências e estados de modelo (sobrevive entre remontagens)
window._sketchModeGlobalCache = window._sketchModeGlobalCache || {
  originalModel: null,
  modelVisibilityMap: new Map(),
  originalMaterials: new Map(),
  sketchActive: false,
  pendingRestore: false,
  sceneReference: null // Nova propriedade para manter referência à cena
};

const GlobalCache = window._sketchModeGlobalCache;

// Garantir que maps estejam inicializados
if (!GlobalCache.originalMaterials) {
  GlobalCache.originalMaterials = new Map();
}

if (!GlobalCache.modelVisibilityMap) {
  GlobalCache.modelVisibilityMap = new Map();
}

// API para debugging do modo sketch
window._debugSketchMode = {
  getSketchStatus: () => {
    return null; // Substituído em runtime
  },
  findObjectByName: (name) => {
    return { inScene: [], inSketchGroup: [] }; // Substituído em runtime
  },
  // Função melhorada para forçar restauração do modelo
  forceModelRestore: () => {
    if (GlobalCache.originalModel) {
      const scene = GlobalCache.sceneReference;
      
      if (scene && GlobalCache.originalModel.parent !== scene) {
        scene.add(GlobalCache.originalModel);
        console.log("Modelo adicionado de volta à cena via forceModelRestore");
      }
      
      forceModelVisibility(GlobalCache.originalModel);
      console.log("Restauração forçada do modelo executada");
      return true;
    }
    return false;
  }
};

// Função de utilidade para forçar visibilidade do modelo (pode ser chamada de qualquer lugar)
function forceModelVisibility(model) {
  if (!model) return false;
  
  model.visible = true;
  let count = 0;
  
  model.traverse(child => {
    if (child.isMesh || child.isGroup) {
      // Forçar visibilidade
      if (!child.visible) {
        child.visible = true;
        count++;
      }
      
      // Remover flag de ocultação
      if (child.userData && child.userData._hiddenBySketchMode) {
        delete child.userData._hiddenBySketchMode;
        count++;
      }
      
      // Restaurar material original se disponível e for um mesh
      if (child.isMesh && GlobalCache.originalMaterials && GlobalCache.originalMaterials.has(child.uuid)) {
        const originalData = GlobalCache.originalMaterials.get(child.uuid);
        if (originalData && originalData.material) {
          child.material = originalData.material;
          count++;
        }
      }
    }
  });
  
  return count > 0;
}

// Função de utilidade para clonar material com preservação completa das propriedades
function deepCloneMaterial(material) {
  if (!material) return null;
  
  if (Array.isArray(material)) {
    return material.map(m => deepCloneMaterial(m));
  }
  
  // Clone básico do material
  const clone = material.clone();
  
  // Preservar mapas e texturas importantes
  const mapsToPreserve = [
    'map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 
    'emissiveMap', 'envMap', 'lightMap', 'metalnessMap', 
    'normalMap', 'roughnessMap', 'specularMap'
  ];
  
  mapsToPreserve.forEach(mapName => {
    if (material[mapName]) {
      clone[mapName] = material[mapName];
      // Também preservamos a transformação do mapa, se existir
      if (material[`${mapName}Offset`]) clone[`${mapName}Offset`] = material[`${mapName}Offset`].clone();
      if (material[`${mapName}Repeat`]) clone[`${mapName}Repeat`] = material[`${mapName}Repeat`].clone();
      if (material[`${mapName}Rotation`]) clone[`${mapName}Rotation`] = material[`${mapName}Rotation`];
    }
  });
  
  // Garantir atualização do material
  clone.needsUpdate = true;
  
  return clone;
}

const SketchRenderer = ({ modelRef, scene, camera, renderer, world }) => {
  const { sketchConfig, currentMode } = useVisualizationMode();
  
  // Referências para os objetos da cena sketch
  const sketchSceneRef = useRef({
    edgesModel: null,
    originalModel: null,
    backgroundModel: null,
    conditionalModel: null,
    shadowModel: null,
    floor: null,
    depthModel: null,
    sketchGroup: null, // Grupo para conter todos os elementos do sketch
    originalObjects: new Map(), // Mapa para armazenar visibilidade original dos objetos
    originalBackground: null, // Para armazenar o background original da cena
    preservedMaterialMeshes: new Map(), // Mapa para armazenar meshes com materiais preservados
    objectLookup: new Map(), // Mapa para busca rápida de objetos por UUID
    modelVisibilityMap: new Map(), // Mapa para rastrear visibilidade de objetos no modelo
    originalMaterials: new Map() // Importante: inicializar este mapa
  });
  
  // Verificar se os Maps estão inicializados corretamente
  useMemo(() => {
    if (!sketchSceneRef.current.originalMaterials) {
      sketchSceneRef.current.originalMaterials = new Map();
    }
    if (!sketchSceneRef.current.originalObjects) {
      sketchSceneRef.current.originalObjects = new Map();
    }
    if (!sketchSceneRef.current.modelVisibilityMap) {
      sketchSceneRef.current.modelVisibilityMap = new Map();
    }
  }, []);
  
  // Referência para o marcador "Você está aqui"
  const youAreHereRef = useRef(null);
  
  // Referência para o modelo original para evitar perda
  const originalModelRef = useRef(null);
  
  // Flag para controlar a inicialização
  const initializedRef = useRef(false);
  
  // Flag para rastrear a última transição de modo
  const lastModeRef = useRef(null);
  
  // Manter a referência à cena no cache global
  useEffect(() => {
    if (scene) {
      GlobalCache.sceneReference = scene;
    }
  }, [scene]);
  
  // Atualizar a API de debug global com o status atual
  useMemo(() => {
    window._debugSketchMode.getSketchStatus = () => ({
      currentMode,
      sketchGroupVisible: sketchSceneRef.current.sketchGroup?.visible || false,
      sketchConfig,
      modelRefExists: !!modelRef.current,
      originalModelRefExists: !!originalModelRef.current,
      globalCacheExists: !!GlobalCache.originalModel,
      pendingRestore: GlobalCache.pendingRestore
    });
    
    window._debugSketchMode.findObjectByName = (name) => {
      const normalizedName = name.toLowerCase().trim();
      const result = {
        inScene: [],
        inSketchGroup: []
      };
      
      // Buscar na cena principal
      if (scene) {
        scene.traverse(obj => {
          if ((obj.isMesh || obj.isGroup) && 
              obj.name.toLowerCase().includes(normalizedName)) {
            result.inScene.push({
              name: obj.name,
              uuid: obj.uuid,
              type: obj.type,
              visible: obj.visible
            });
          }
        });
      }
      
      // Buscar no grupo sketch
      if (sketchSceneRef.current.sketchGroup) {
        sketchSceneRef.current.sketchGroup.traverse(obj => {
          if ((obj.isMesh || obj.isLine || obj.isLineSegments || obj.isPoints) && 
              obj.name.toLowerCase().includes(normalizedName)) {
            result.inSketchGroup.push({
              name: obj.name,
              uuid: obj.uuid,
              type: obj.type,
              visible: obj.visible
            });
          }
        });
      }
      
      return result;
    };
  }, [currentMode, sketchConfig, scene, modelRef.current]);
  
  /**
   * Encontra o marcador "Você está aqui" no objeto fornecido
   */
  const findYouAreHereMarker = (object) => {
    if (!object) return null;
    
    let marker = null;
    object.traverse((child) => {
      if (child.isMesh || child.isGroup) {
        const name = child.name.toLowerCase();
        if (name.includes("você_está_aqui") || name.includes("voce_esta_aqui")) {
          marker = child;
        }
      }
    });
    return marker;
  };
  
  /**
   * Salva o estado completo do modelo para restauração posterior
   */
  const saveModelState = (model) => {
    if (!model) {
      debugLog("Não há modelo para salvar o estado");
      return;
    }
    
    debugLog("Salvando estado completo do modelo");
    
    // Salvar referência no cache global
    GlobalCache.originalModel = model;
    
    // Armazenar referência segura ao modelo original
    if (!originalModelRef.current) {
      originalModelRef.current = model;
    }
    
    // Limpar mapa existente
    const modelVisibilityMap = sketchSceneRef.current.modelVisibilityMap;
    modelVisibilityMap.clear();
    
    // Salvar o estado de visibilidade de todos os objetos do modelo
    model.traverse(obj => {
      // Inclui meshes, grupos e objetos
      modelVisibilityMap.set(obj.uuid, {
        visible: obj.visible,
        position: obj.position.clone(),
        rotation: obj.rotation.clone(),
        scale: obj.scale.clone(),
        parent: obj.parent ? obj.parent.uuid : null,
      });
    });
    
    // Salvar no cache global
    GlobalCache.modelVisibilityMap = new Map(modelVisibilityMap);
    
    debugLog(`Estado do modelo salvo com ${modelVisibilityMap.size} objetos (também salvo no cache global)`);
  };
  
  /**
   * Captura e indexa todos os objetos no modelo para referência futura
   */
  const buildObjectLookup = (object) => {
    if (!object) return;
    
    const lookup = sketchSceneRef.current.objectLookup;
    lookup.clear();
    
    // Recursivamente atravessar o objeto e armazenar todas as meshes
    object.traverse(child => {
      if (child.isMesh) {
        lookup.set(child.uuid, {
          object: child,
          name: child.name,
          originalPosition: child.position.clone(),
          originalRotation: child.rotation.clone(),
          originalScale: child.scale.clone(),
          originalMatrix: child.matrix.clone(),
          originalWorldMatrix: child.matrixWorld.clone()
        });
      }
    });
    
    debugLog(`Lookup de objetos construído com ${lookup.size} entries`);
  };
  
  /**
   * Captura o material original de um objeto para preservação
   * CORREÇÃO: Verifica se os Maps estão inicializados antes de chamar .has()
   */
  const captureOriginalMaterial = (mesh) => {
    if (!mesh || !mesh.isMesh || !mesh.material) return;
    
    // Garantir que os Maps estão inicializados
    const localMaterialMap = sketchSceneRef.current.originalMaterials || new Map();
    const globalMaterialMap = GlobalCache.originalMaterials || new Map();
    
    // Segurança: atribuir os Maps ao contexto se não existirem
    if (!sketchSceneRef.current.originalMaterials) {
      sketchSceneRef.current.originalMaterials = localMaterialMap;
    }
    
    if (!GlobalCache.originalMaterials) {
      GlobalCache.originalMaterials = globalMaterialMap;
    }
    
    // Se já capturamos este material, não o capturamos novamente
    if (localMaterialMap.has(mesh.uuid) || globalMaterialMap.has(mesh.uuid)) {
      return;
    }
    
    try {
      // Clone profundo do material com preservação completa de propriedades
      const clonedMaterial = deepCloneMaterial(mesh.material);
      
      // Capturar a matriz mundial para uso posterior
      mesh.updateWorldMatrix(true, false);
      const worldMatrix = mesh.matrixWorld.clone();
      
      // Armazenar informações adicionais sobre o material para referência
      const materialInfo = {
        hasTexture: false,
        hasColor: false,
        isTransparent: false,
        colorValue: null,
        originalGeometry: mesh.geometry.clone()
      };
      
      // Verificar propriedades importantes (para materiais múltiplos ou único)
      if (Array.isArray(mesh.material)) {
        materialInfo.hasTexture = mesh.material.some(m => m.map !== null);
        materialInfo.hasColor = mesh.material.some(m => m.color !== undefined);
        materialInfo.isTransparent = mesh.material.some(m => m.transparent);
        
        // Capturar valores de cor para debugging
        if (materialInfo.hasColor) {
          materialInfo.colorValue = mesh.material
            .filter(m => m.color)
            .map(m => m.color.getHexString());
        }
      } else {
        materialInfo.hasTexture = mesh.material.map !== null;
        materialInfo.hasColor = mesh.material.color !== undefined;
        materialInfo.isTransparent = mesh.material.transparent;
        
        // Capturar valor de cor para debugging
        if (materialInfo.hasColor && mesh.material.color) {
          materialInfo.colorValue = mesh.material.color.getHexString();
          debugLog(`Cor capturada para ${mesh.name}: #${materialInfo.colorValue}`);
        }
      }
      
      // Dados do material original
      const materialData = {
        material: clonedMaterial,
        info: materialInfo,
        name: mesh.name,
        worldMatrix: worldMatrix,
        visible: mesh.visible
      };
      
      // Armazenar no mapa local
      localMaterialMap.set(mesh.uuid, materialData);
      
      // Armazenar no cache global também
      globalMaterialMap.set(mesh.uuid, materialData);
      
      debugLog(`Material original capturado para: ${mesh.name} (${mesh.uuid.substring(0, 8)})`);
    } catch (err) {
      console.error(`Erro ao capturar material para ${mesh.name || 'objeto sem nome'}:`, err);
    }
  };
  
  /**
   * Mescla objetos em uma única geometria para o modo sketch
   */
  const mergeObject = (object) => {
    if (!object) return null;
    
    try {
      debugLog("Iniciando mesclagem de objetos para modo sketch");
      
      // Salvar estado do modelo para restauração posterior
      saveModelState(object);
      
      // Construir lookup de objetos para uso futuro em preservação de materiais
      buildObjectLookup(object);
      
      // Salvar a transformação global do objeto original
      object.updateWorldMatrix(true, false);
      
      // Procurar o marcador "Você está aqui" no objeto original e salvar sua posição global
      const youAreHereMarker = findYouAreHereMarker(object);
      if (youAreHereMarker) {
        youAreHereRef.current = {
          name: youAreHereMarker.name,
          position: new THREE.Vector3(),
          worldMatrix: new THREE.Matrix4()
        };
        youAreHereMarker.updateWorldMatrix(true, false);
        youAreHereMarker.getWorldPosition(youAreHereRef.current.position);
        youAreHereRef.current.worldMatrix.copy(youAreHereMarker.matrixWorld);
        
        debugLog("Você está aqui encontrado:", youAreHereMarker.name);
      }
      
      // Atualizar a matriz mundial para cálculos corretos
      object.updateMatrixWorld(true);

      // Coletar geometrias de todos os meshes
      const geometry = [];
      object.traverse(c => {
        if (c.isMesh) {
          // Capturar materiais originais se a preservação estiver ativada
          captureOriginalMaterial(c);
          
          const g = c.geometry.clone();
          g.applyMatrix4(c.matrixWorld);
          
          // Remover atributos desnecessários para reduzir memória
          for (const key in g.attributes) {
            if (key !== 'position' && key !== 'normal') {
              g.deleteAttribute(key);
            }
          }
          geometry.push(g.toNonIndexed());
        }
      });

      if (geometry.length === 0) {
        debugLog("Nenhuma geometria encontrada para mesclar");
        return null;
      }

      // Mesclar geometrias sem centralizar para preservar posição global
      const mergedGeometries = BufferGeometryUtils.mergeGeometries(geometry, false);
      const mergedGeometry = BufferGeometryUtils.mergeVertices(mergedGeometries);
      
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(mergedGeometry);
      group.add(mesh);
      
      // Recriar o marcador "Você está aqui" no grupo mesclado
      if (youAreHereRef.current) {
        const markerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x4285f4 });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.name = youAreHereRef.current.name;
        marker.position.copy(youAreHereRef.current.position);
        
        group.add(marker);
      }
      
      debugLog("Mesclagem de objetos concluída com sucesso");
      return group;
    } catch (err) {
      console.error("Erro ao mesclar objetos:", err);
      return null;
    }
  };
  
  /**
   * Cria meshes com materiais originais preservados
   */
  const createPreservedMaterialMeshes = (sketchGroup) => {
    if (!sketchConfig.preserveOriginalMaterials || !modelRef.current || !scene) {
      debugLog("Preservação de materiais desativada ou modelo não disponível");
      return;
    }
    
    debugLog("Criando meshes com materiais preservados");
    
    // Limpar meshes preservadas anteriores
    sketchSceneRef.current.preservedMaterialMeshes.forEach((mesh) => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    sketchSceneRef.current.preservedMaterialMeshes.clear();
    
    // Usar materiais originais do cache local ou global
    const localMaterialMap = sketchSceneRef.current.originalMaterials || new Map();
    const globalMaterialMap = GlobalCache.originalMaterials || new Map();
    
    const originalMaterials = localMaterialMap.size > 0 
      ? localMaterialMap 
      : globalMaterialMap;
      
    const { objectLookup } = sketchSceneRef.current;
    const preservedCount = {
      total: 0,
      specificObjects: 0,
      globalPreservation: 0
    };
    
    // Processar cada objeto original que foi capturado
    originalMaterials.forEach((originalData, objectUuid) => {
      const { material: originalMaterial, info, name, worldMatrix } = originalData;
      
      // Verificar se este objeto específico deve ser preservado ou se a preservação global está ativa
      const isSpecificPreservation = sketchConfig.preservedObjects.includes(objectUuid);
      const isGlobalPreservation = Object.values(sketchConfig.preservedMaterialTypes).some(v => v === true);
      
      if (isSpecificPreservation || isGlobalPreservation) {
        try {
          // Obter a geometria original ou criar uma nova se não estiver disponível
          let geometry;
          
          // Tentar usar a geometria original armazenada
          if (info.originalGeometry) {
            geometry = info.originalGeometry.clone();
            // Aplicar transformação global, se disponível
            if (worldMatrix) {
              geometry.applyMatrix4(worldMatrix);
            }
          } 
          // Fallback: usar geometria do lookup de objetos
          else if (objectLookup.has(objectUuid)) {
            const objectData = objectLookup.get(objectUuid);
            const originalObject = objectData.object;
            geometry = originalObject.geometry.clone();
            // Aplicar transformação global
            originalObject.updateWorldMatrix(true, false);
            geometry.applyMatrix4(originalObject.matrixWorld);
          }
          // Fallback final: buscar o objeto na cena
          else {
            debugLog(`Objeto ${name} (${objectUuid.substring(0, 8)}) não encontrado no lookup, buscando na cena...`);
            let foundObject = null;
            scene.traverse(obj => {
              if (obj.uuid === objectUuid) {
                foundObject = obj;
              }
            });
            
            if (foundObject && foundObject.geometry) {
              geometry = foundObject.geometry.clone();
              foundObject.updateWorldMatrix(true, false);
              geometry.applyMatrix4(foundObject.matrixWorld);
            } else {
              debugLog(`Não foi possível encontrar geometria para o objeto ${name}`);
              return; // Pular este objeto
            }
          }
          
          // Criar material baseado nas configurações de preservação
          let material;
          
          // Se este objeto específico deve ser preservado, usamos seu material original completo
          if (isSpecificPreservation) {
            material = deepCloneMaterial(originalMaterial);
            preservedCount.specificObjects++;
            debugLog(`Preservação específica para ${name} (${objectUuid.substring(0, 8)})`);
          } 
          // Caso contrário, criamos um material com as propriedades selecionadas
          else if (isGlobalPreservation) {
            // Base: material standard ou básico dependendo se a iluminação está ativada
            material = sketchConfig.lit 
              ? new THREE.MeshStandardMaterial({ 
                  side: THREE.DoubleSide, 
                  roughness: 0.7,
                  metalness: 0.3
                })
              : new THREE.MeshBasicMaterial({ 
                  side: THREE.DoubleSide
                });
            
            // Aplicar propriedades específicas baseado nas configurações
            const origMat = Array.isArray(originalMaterial) ? originalMaterial[0] : originalMaterial;
            
            if (sketchConfig.preservedMaterialTypes.colors && origMat.color) {
              material.color = origMat.color.clone();
              debugLog(`Preservando cor para ${name}: #${origMat.color.getHexString()}`);
            } else {
              material.color = new THREE.Color(sketchConfig.modelColor);
            }
            
            if (sketchConfig.preservedMaterialTypes.textures && origMat.map) {
              material.map = origMat.map;
              // Copiar transformações de textura, se existirem
              if (origMat.mapOffset) material.mapOffset = origMat.mapOffset.clone();
              if (origMat.mapRepeat) material.mapRepeat = origMat.mapRepeat.clone();
              
              // Definir precisamos recalcular UVs
              if (!geometry.attributes.uv && material.map) {
                debugLog(`Aviso: Geometria sem coordenadas UV para textura em ${name}`);
              }
            }
            
            if (sketchConfig.preservedMaterialTypes.metalness && 
                'metalness' in origMat && 
                'metalness' in material) {
              material.metalness = origMat.metalness;
            }
            
            if (sketchConfig.preservedMaterialTypes.roughness && 
                'roughness' in origMat && 
                'roughness' in material) {
              material.roughness = origMat.roughness;
            }
            
            if (sketchConfig.preservedMaterialTypes.opacity) {
              material.transparent = origMat.transparent;
              material.opacity = origMat.opacity;
            } else {
              material.transparent = sketchConfig.opacity !== 1.0;
              material.opacity = sketchConfig.opacity;
            }
            
            preservedCount.globalPreservation++;
          }
          
          // Garantir que o material tenha atualizações necessárias
          if (material) {
            material.needsUpdate = true;
          } else {
            debugLog(`Material não criado para ${name}`);
            return; // Pular este objeto
          }
          
          // Criar a mesh com a geometria e material preparados
          const preservedMesh = new THREE.Mesh(geometry, material);
          preservedMesh.name = name + "_preserved";
          
          // Configurações de renderização para integração com o modo sketch
          preservedMesh.renderOrder = 3;  // Renderiza sobre os elementos do sketch
          
          // Adicionar ao grupo sketch e armazenar referência
          sketchGroup.add(preservedMesh);
          sketchSceneRef.current.preservedMaterialMeshes.set(objectUuid, preservedMesh);
          
          preservedCount.total++;
        } catch (err) {
          console.error(`Erro ao criar mesh preservada para ${name || objectUuid}:`, err);
        }
      }
    });
    
    debugLog(`Meshes preservadas criadas: ${preservedCount.total} total (${preservedCount.specificObjects} específicas, ${preservedCount.globalPreservation} globais)`);
  };

  /**
   * Cria o modelo com bordas para o modo sketch
   */
  const initEdgesModel = (originalModel, sketchGroup) => {
    if (!originalModel || !scene) return;
    
    const { edgesModel } = sketchSceneRef.current;
    
    // Remove o modelo anterior se existir
    if (edgesModel && edgesModel.parent) {
      edgesModel.parent.remove(edgesModel);
      edgesModel.traverse(c => {
        if (c.isMesh && c.material) {
          if (Array.isArray(c.material)) {
            c.material.forEach(m => m.dispose());
          } else {
            c.material.dispose();
          }
        }
      });
    }
    
    // Cria uma cópia do modelo e adiciona ao grupo sketch
    const newEdgesModel = originalModel.clone();
    sketchGroup.add(newEdgesModel);
    sketchSceneRef.current.edgesModel = newEdgesModel;
    
    // Sai se não quisermos mostrar bordas
    if (sketchConfig.display === 'NONE') {
      newEdgesModel.visible = false;
      return;
    }
    
    // Encontra todas as meshes
    const meshes = [];
    newEdgesModel.traverse(c => {
      if (c.isMesh) {
        meshes.push(c);
      }
    });
    
    // Processa cada mesh
    for (const mesh of meshes) {
      if (!mesh.parent) continue;
      
      const parent = mesh.parent;
      
      // Cria geometria de bordas dependendo do tipo escolhido
      let lineGeom;
      try {
        if (sketchConfig.display === 'THRESHOLD_EDGES') {
          lineGeom = new THREE.EdgesGeometry(mesh.geometry, sketchConfig.threshold);
        } else {
          const mergeGeom = mesh.geometry.clone();
          mergeGeom.deleteAttribute('uv');
          mergeGeom.deleteAttribute('uv2');
          lineGeom = new OutsideEdgesGeometry(BufferGeometryUtils.mergeVertices(mergeGeom, 1e-3));
        }
        
        // Cria linhas normais
        const line = new THREE.LineSegments(
          lineGeom, 
          new THREE.LineBasicMaterial({ color: sketchConfig.lineColor })
        );
        line.position.copy(mesh.position);
        line.scale.copy(mesh.scale);
        line.rotation.copy(mesh.rotation);
        
        // Cria linhas grossas
        const thickLineGeom = new LineSegmentsGeometry().fromEdgesGeometry(lineGeom);
        const thickLines = new LineSegments2(
          thickLineGeom, 
          new LineMaterial({ 
            color: sketchConfig.lineColor, 
            linewidth: sketchConfig.thickness 
          })
        );
        thickLines.position.copy(mesh.position);
        thickLines.scale.copy(mesh.scale);
        thickLines.rotation.copy(mesh.rotation);
        
        // Preserva o nome original da mesh para compatibilidade com focusOnObject
        if (mesh.name) {
          line.name = mesh.name + "_edges";
          thickLines.name = mesh.name + "_thick_edges";
        }
        
        // Substitui a mesh original pelas linhas
        parent.remove(mesh);
        parent.add(line);
        parent.add(thickLines);
        
        // Configura visibilidade baseada nas preferências do usuário
        line.visible = !sketchConfig.useThickLines;
        thickLines.visible = sketchConfig.useThickLines;
        
        // Atualiza a resolução para os renderizadores de linhas grossas
        if (thickLines.material && thickLines.material.resolution && renderer) {
          const size = new THREE.Vector2();
          renderer.getSize(size);
          thickLines.material.resolution.copy(size);
          thickLines.material.resolution.multiplyScalar(window.devicePixelRatio);
        }
      } catch (err) {
        console.error("Error creating edges for mesh:", err);
      }
    }
  };
  
  /**
   * Cria o modelo com bordas condicionais para o modo sketch
   */
  const initConditionalModel = (originalModel, sketchGroup) => {
    if (!originalModel || !scene) return;
    
    const { conditionalModel } = sketchSceneRef.current;
    
    // Remove o modelo anterior se existir
    if (conditionalModel && conditionalModel.parent) {
      conditionalModel.parent.remove(conditionalModel);
      conditionalModel.traverse(c => {
        if (c.isMesh && c.material) {
          c.material.dispose();
        }
      });
    }
    
    // Cria uma cópia do modelo e adiciona ao grupo sketch
    const newConditionalModel = originalModel.clone();
    sketchGroup.add(newConditionalModel);
    sketchSceneRef.current.conditionalModel = newConditionalModel;
    newConditionalModel.visible = sketchConfig.displayConditionalEdges;
    
    // Encontra todas as meshes
    const meshes = [];
    newConditionalModel.traverse(c => {
      if (c.isMesh) {
        meshes.push(c);
      }
    });
    
    // Processa cada mesh
    for (const mesh of meshes) {
      if (!mesh.parent) continue;
      
      const parent = mesh.parent;
      
      try {
        // Remove tudo menos o atributo de posição
        const mergedGeom = mesh.geometry.clone();
        for (const key in mergedGeom.attributes) {
          if (key !== 'position') {
            mergedGeom.deleteAttribute(key);
          }
        }
        
        // Cria a geometria de bordas condicionais e material associado
        const lineGeom = new ConditionalEdgesGeometry(BufferGeometryUtils.mergeVertices(mergedGeom));
        const material = new THREE.ShaderMaterial(ConditionalEdgesShader);
        material.uniforms.diffuse.value.set(sketchConfig.lineColor);
        
        // Cria os objetos de segmentos de linha e substitui a mesh
        const line = new THREE.LineSegments(lineGeom, material);
        line.position.copy(mesh.position);
        line.scale.copy(mesh.scale);
        line.rotation.copy(mesh.rotation);
        
        const thickLineGeom = new ConditionalLineSegmentsGeometry().fromConditionalEdgesGeometry(lineGeom);
        const thickLines = new LineSegments2(
          thickLineGeom, 
          new ConditionalLineMaterial({ 
            color: sketchConfig.lineColor, 
            linewidth: sketchConfig.thickness 
          })
        );
        thickLines.position.copy(mesh.position);
        thickLines.scale.copy(mesh.scale);
        thickLines.rotation.copy(mesh.rotation);
        
        // Preserva o nome original da mesh para compatibilidade com focusOnObject
        if (mesh.name) {
          line.name = mesh.name + "_conditional";
          thickLines.name = mesh.name + "_thick_conditional";
        }
        
        parent.remove(mesh);
        parent.add(line);
        parent.add(thickLines);
        
        // Configura visibilidade baseada nas preferências do usuário
        line.visible = !sketchConfig.useThickLines;
        thickLines.visible = sketchConfig.useThickLines;
        
        // Atualiza a resolução para os renderizadores de linhas grossas
        if (thickLines.material && thickLines.material.resolution && renderer) {
          const size = new THREE.Vector2();
          renderer.getSize(size);
          thickLines.material.resolution.copy(size);
          thickLines.material.resolution.multiplyScalar(window.devicePixelRatio);
        }
      } catch (err) {
        console.error("Error creating conditional edges for mesh:", err);
      }
    }
  };
  
  /**
   * Cria o modelo de fundo e as sombras para o modo sketch
   */
  const initBackgroundModel = (originalModel, sketchGroup) => {
    if (!originalModel || !scene) return;
    
    const { backgroundModel, shadowModel, depthModel } = sketchSceneRef.current;
    
    // Remove modelos anteriores se existirem
    [backgroundModel, shadowModel, depthModel].forEach(model => {
      if (model && model.parent) {
        model.parent.remove(model);
        model.traverse(c => {
          if (c.isMesh && c.material) {
            c.material.dispose();
          }
        });
      }
    });
    
    try {
      // Cria o modelo de fundo
      const newBackgroundModel = originalModel.clone();
      newBackgroundModel.traverse(c => {
        if (c.isMesh) {
          // Preservar nome original para compatibilidade com focusOnObject
          const originalName = c.name;
          
          c.material = new THREE.MeshBasicMaterial({ 
            color: sketchConfig.modelColor,
            transparent: sketchConfig.opacity !== 1.0,
            opacity: sketchConfig.opacity
          });
          c.material.polygonOffset = true;
          c.material.polygonOffsetFactor = 1;
          c.material.polygonOffsetUnits = 1;
          c.renderOrder = 2;
          
          // Restaurar nome
          c.name = originalName;
        }
      });
      sketchGroup.add(newBackgroundModel);
      sketchSceneRef.current.backgroundModel = newBackgroundModel;
      
      // Cria o modelo com sombras
      const newShadowModel = originalModel.clone();
      newShadowModel.traverse(c => {
        if (c.isMesh) {
          // Preservar nome original
          const originalName = c.name;
          
          // Usar um MeshBasicMaterial simples em vez do shader complexo
          c.material = new ColoredShadowMaterial({ 
            color: sketchConfig.modelColor, 
            shadowColor: sketchConfig.shadowColor,
            transparent: sketchConfig.opacity !== 1.0,
            opacity: sketchConfig.opacity
          });
          c.material.polygonOffset = true;
          c.material.polygonOffsetFactor = 1;
          c.material.polygonOffsetUnits = 1;
          c.receiveShadow = true;
          c.renderOrder = 2;
          
          // Restaurar nome
          c.name = originalName;
        }
      });
      sketchGroup.add(newShadowModel);
      sketchSceneRef.current.shadowModel = newShadowModel;
      
      // Cria o modelo para o buffer de profundidade
      const newDepthModel = originalModel.clone();
      newDepthModel.traverse(c => {
        if (c.isMesh) {
          // Preservar nome original
          const originalName = c.name;
          
          c.material = new THREE.MeshBasicMaterial({ color: sketchConfig.modelColor });
          c.material.polygonOffset = true;
          c.material.polygonOffsetFactor = 1;
          c.material.polygonOffsetUnits = 1;
          c.material.colorWrite = false;
          c.renderOrder = 1;
          
          // Restaurar nome
          c.name = originalName;
        }
      });
      sketchGroup.add(newDepthModel);
      sketchSceneRef.current.depthModel = newDepthModel;
      
      // Ajustar visibilidade com base nas configurações de iluminação
      newBackgroundModel.visible = !sketchConfig.lit;
      newShadowModel.visible = sketchConfig.lit;
    } catch (err) {
      console.error("Error creating background models:", err);
    }
  };
  
  /**
   * Configura o chão (plano) para o modo sketch
   */
  const initFloor = (sketchGroup) => {
    if (!scene) return;
    
    if (sketchSceneRef.current.floor && sketchSceneRef.current.floor.parent) {
      sketchSceneRef.current.floor.parent.remove(sketchSceneRef.current.floor);
    }
    
    try {
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(),
        new THREE.ShadowMaterial({ 
          color: sketchConfig.shadowColor, 
          opacity: sketchConfig.opacity, 
          transparent: true 
        })
      );
      
      floor.rotation.x = -Math.PI / 2;
      floor.scale.setScalar(20);
      floor.receiveShadow = true;
      
      // Posiciona o chão na base do modelo
      if (sketchSceneRef.current.originalModel) {
        const box = new THREE.Box3().setFromObject(sketchSceneRef.current.originalModel);
        floor.position.y = box.min.y;
      }
      
      sketchGroup.add(floor);
      sketchSceneRef.current.floor = floor;
    } catch (err) {
      console.error("Error creating floor:", err);
    }
  };
  
  /**
   * Configura luz direcional para o modo sketch
   */
  const setupDirectionalLight = (sketchGroup) => {
    if (!scene) return null;
    
    // Remove luzes existentes
    scene.children.forEach(child => {
      if (child.isDirectionalLight && child.userData.isSketchLight) {
        scene.remove(child);
      }
    });
    
    try {
      // Cria uma nova luz direcional
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
      dirLight.position.set(5, 10, 5);
      dirLight.castShadow = true;
      dirLight.shadow.bias = -1e-10;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.userData.isSketchLight = true;
      
      const shadowCam = dirLight.shadow.camera;
      shadowCam.left = shadowCam.bottom = -1;
      shadowCam.right = shadowCam.top = 1;
      
      sketchGroup.add(dirLight);
      
      return dirLight;
    } catch (err) {
      console.error("Error setting up directional light:", err);
      return null;
    }
  };
  
  /**
   * Salva a visibilidade original dos objetos na cena
   */
  const saveOriginalVisibility = () => {
    const originalObjects = sketchSceneRef.current.originalObjects;
    originalObjects.clear();
    
    // Armazenar a referência ao modelo original para restauração
    if (modelRef.current && !originalModelRef.current) {
      originalModelRef.current = modelRef.current;
      debugLog("Referência ao modelo original salva para restauração");
    }
    
    // Também salvar no cache global
    if (modelRef.current) {
      GlobalCache.originalModel = modelRef.current;
    }
    
    // Primeiro registrar todos os objetos da cena
    scene.traverse(object => {
      if (object.isMesh || object.isGroup) {
        // Armazena estado completo do objeto
        originalObjects.set(object.uuid, {
          visible: object.visible,
          userData: { ...object.userData },
          position: object.position.clone(),
          rotation: object.rotation.clone(),
          scale: object.scale.clone(),
          parent: object.parent ? object.parent.uuid : null
        });
        
        // Para meshes, armazena também o estado do material
        if (object.isMesh && object.material) {
          const materialData = Array.isArray(object.material) 
            ? object.material.map(m => ({
                opacity: m.opacity,
                transparent: m.transparent,
                depthWrite: m.depthWrite,
                color: m.color ? m.color.clone() : null,
                emissive: m.emissive ? m.emissive.clone() : null
              }))
            : {
                opacity: object.material.opacity,
                transparent: object.material.transparent,
                depthWrite: object.material.depthWrite,
                color: object.material.color ? object.material.color.clone() : null,
                emissive: object.material.emissive ? object.material.emissive.clone() : null
              };
              
          originalObjects.get(object.uuid).materialData = materialData;
        }
      }
    });
    
    debugLog(`Estado original de visibilidade capturado para ${originalObjects.size} objetos`);
  };
  
  /**
   * FUNÇÃO CRÍTICA: Restaura a visibilidade original dos objetos após sair do modo sketch
   * Esta função é projetada para funcionar mesmo durante a desmontagem
   */
  const restoreOriginalVisibility = (forceRestore = false) => {
    debugLog("Restaurando visibilidade original" + (forceRestore ? " (forçado)" : ""));
    
    // Sempre use o cache global como fonte de verdade
    const originalObjects = sketchSceneRef.current.originalObjects;
    const modelVisibilityMap = GlobalCache.modelVisibilityMap;
    
    // PARTE 1: Restaurar a visibilidade do modelo original
    let activeModel = null;
    
    // Verificar modelos em ordem de prioridade - GlobalCache é a primeira opção
    if (GlobalCache.originalModel) {
      debugLog("Usando GlobalCache.originalModel para restauração");
      activeModel = GlobalCache.originalModel;
    }
    else if (originalModelRef.current) {
      debugLog("Usando originalModelRef.current para restauração");
      activeModel = originalModelRef.current;
    }
    else if (modelRef.current) {
      debugLog("Usando modelRef.current para restauração");
      activeModel = modelRef.current;
    }
    
    if (activeModel) {
      // Garantir que o modelo esteja na cena
      if (scene && activeModel.parent !== scene) {
        debugLog("Adicionando modelo de volta à cena");
        scene.add(activeModel);
      }
      
      // Forçar visibilidade do modelo principal
      activeModel.visible = true;
      
      // Restaurar a visibilidade de todos os objetos do modelo
      let visibilityCounter = 0;
      activeModel.traverse(obj => {
        if (obj.isMesh || obj.isGroup) {
          // 1. Forçar visibilidade diretamente
          obj.visible = true;
          
          // 2. Remover flags de ocultação
          if (obj.userData && obj.userData._hiddenBySketchMode) {
            delete obj.userData._hiddenBySketchMode;
          }
          
          // 3. Restaurar material original se disponível para meshes
          if (obj.isMesh && GlobalCache.originalMaterials && 
              GlobalCache.originalMaterials.has && GlobalCache.originalMaterials.has(obj.uuid)) {
            const origMaterial = GlobalCache.originalMaterials.get(obj.uuid);
            if (origMaterial && origMaterial.material) {
              obj.material = origMaterial.material;
            }
          }
          
          visibilityCounter++;
        }
      });
      
      debugLog(`Forçada visibilidade para ${visibilityCounter} objetos no modelo`);
      
      // Atualizar modelo global para possível uso futuro
      GlobalCache.originalModel = activeModel;
      
      // Atualizar modelRef se necessário
      if (modelRef.current !== activeModel && modelRef.current) {
        modelRef.current = activeModel;
      }
    } else {
      debugLog("ALERTA: Nenhum modelo disponível para restaurar");
      return false;
    }
    
    // PARTE 2: Limpar todas as flags e estados de modo sketch
    if (scene) {
      scene.traverse(object => {
        if (object.userData && object.userData._hiddenBySketchMode) {
          object.visible = true;
          delete object.userData._hiddenBySketchMode;
        }
      });
    }
    
    // Limpa status global
    GlobalCache.sketchActive = false;
    GlobalCache.pendingRestore = false;
    
    debugLog("Restauração de visibilidade concluída com sucesso");
    
    return true;
  };
  
  /**
   * Oculta os modelos originais durante o modo sketch
   */
  const hideOriginalModels = () => {
    // Primeiro, salva o estado original
    saveOriginalVisibility();
    
    // Salvar o estado específico do modelo principal
    if (modelRef.current) {
      saveModelState(modelRef.current);
    }
    
    debugLog("Ocultando modelos originais para o modo sketch");
    
    // Agora oculta o modelo original com rastreamento de estado adequado
    if (modelRef.current) {
      modelRef.current.traverse(object => {
        if (object.isMesh || object.isGroup) {
          // Armazena estado de visibilidade original no userData
          object.userData = object.userData || {};
          object.userData._originalVisibility = object.visible;
          
          // Oculta o objeto
          object.visible = false;
          
          // Adiciona uma flag para lembrar que foi ocultado pelo modo sketch
          object.userData._hiddenBySketchMode = true;
        }
      });
    }
    
    // Atualiza estado global
    GlobalCache.sketchActive = true;
  };
  
  /**
   * Função principal para atualizar a cena em modo sketch
   */
  const updateSketchScene = () => {
    // Não fazer nada se não estamos no modo sketch
    if (currentMode !== 'sketch') {
      return;
    }
    
    // Se não temos um grupo sketch, crie-o primeiro
    if (!sketchSceneRef.current.sketchGroup) {
      const group = new THREE.Group();
      group.name = "SketchModels";
      scene.add(group);
      sketchSceneRef.current.sketchGroup = group;
    }
    
    const sketchGroup = sketchSceneRef.current.sketchGroup;
    
    if (!sketchSceneRef.current.originalModel || !modelRef.current) {
      // Se ainda não tivermos um modelo mesclado, crie-o a partir do modelo atual
      debugLog("Creating merged model from reference model");
      try {
        // Armazenar referência segura ao modelo original
        if (!originalModelRef.current && modelRef.current) {
          originalModelRef.current = modelRef.current;
        }
        
        // Também no cache global
        GlobalCache.originalModel = modelRef.current;
        
        // Oculta os modelos originais durante o modo sketch
        hideOriginalModels();
        
        const mergedModel = mergeObject(modelRef.current);
        if (mergedModel) {
          sketchSceneRef.current.originalModel = mergedModel;
          
          // Inicializa os componentes do sketch no grupo sketch
          initBackgroundModel(mergedModel, sketchGroup);
          initEdgesModel(mergedModel, sketchGroup);
          initConditionalModel(mergedModel, sketchGroup);
          initFloor(sketchGroup);
          setupDirectionalLight(sketchGroup);
          
          // Criar meshes com materiais originais preservados se estiver ativado
          if (sketchConfig.preserveOriginalMaterials) {
            createPreservedMaterialMeshes(sketchGroup);
          }
          
          initializedRef.current = true;
        }
      } catch (err) {
        console.error("Error creating sketch scene:", err);
      }
    } else if (initializedRef.current) {
      // Atualiza os componentes existentes com as novas configurações
      const { 
        backgroundModel, 
        shadowModel, 
        depthModel, 
        conditionalModel, 
        edgesModel,
        floor 
      } = sketchSceneRef.current;
      
      try {
        // Atualiza cores e opacidade
        if (backgroundModel) {
          backgroundModel.visible = !sketchConfig.lit;
          backgroundModel.traverse(c => {
            if (c.isMesh && c.material) {
              c.material.transparent = sketchConfig.opacity !== 1.0;
              c.material.opacity = sketchConfig.opacity;
              c.material.color.set(sketchConfig.modelColor);
            }
          });
        }
        
        if (shadowModel) {
          shadowModel.visible = sketchConfig.lit;
          shadowModel.traverse(c => {
            if (c.isMesh && c.material) {
              c.material.transparent = sketchConfig.opacity !== 1.0;
              c.material.opacity = sketchConfig.opacity;
              
              // Verificar se o material tem as propriedades que queremos alterar
              if (c.material.color) {
                c.material.color.set(sketchConfig.modelColor);
              }
              
              // Se for ColoredShadowMaterial, atualizar a shadowColor
              if (c.material.shadowColor) {
                c.material.shadowColor.set(sketchConfig.shadowColor);
              }
            }
          });
        }
        
        if (depthModel) {
          depthModel.traverse(c => {
            if (c.isMesh && c.material && c.material.color) {
              c.material.color.set(sketchConfig.modelColor);
            }
          });
        }
        
        // Atualiza as linhas condicionais
        if (conditionalModel) {
          conditionalModel.visible = sketchConfig.displayConditionalEdges;
          conditionalModel.traverse(c => {
            if (c.material && c.material.resolution && renderer) {
              renderer.getSize(c.material.resolution);
              c.material.resolution.multiplyScalar(window.devicePixelRatio);
              c.material.linewidth = sketchConfig.thickness;
            }
            
            if (c.material) {
              c.visible = c instanceof LineSegments2 ? sketchConfig.useThickLines : !sketchConfig.useThickLines;
              if (c.material.uniforms && c.material.uniforms.diffuse) {
                c.material.uniforms.diffuse.value.set(sketchConfig.lineColor);
              } else if (c.material.color) {
                c.material.color.set(sketchConfig.lineColor);
              }
            }
          });
        }
        
        // Atualiza as bordas normais
        if (edgesModel) {
          edgesModel.traverse(c => {
            if (c.material && c.material.resolution && renderer) {
              renderer.getSize(c.material.resolution);
              c.material.resolution.multiplyScalar(window.devicePixelRatio);
              c.material.linewidth = sketchConfig.thickness;
            }
            
            if (c.material) {
              c.visible = c instanceof LineSegments2 ? sketchConfig.useThickLines : !sketchConfig.useThickLines;
              if (c.material.color) {
                c.material.color.set(sketchConfig.lineColor);
              }
            }
          });
        }
        
        // Atualiza o chão
        if (floor) {
          floor.material.color.set(sketchConfig.shadowColor);
          floor.material.opacity = sketchConfig.opacity;
          floor.visible = sketchConfig.lit;
          
          // Atualiza a posição do chão
          if (sketchSceneRef.current.originalModel) {
            const box = new THREE.Box3().setFromObject(sketchSceneRef.current.originalModel);
            floor.position.y = box.min.y;
          }
        }
        
        // Atualiza a cor de fundo da cena
        if (scene && scene.background) {
          scene.background.set(sketchConfig.backgroundColor);
        }
        
        // Recria ou atualiza as meshes de materiais preservados se a configuração mudou
        if (sketchConfig.preserveOriginalMaterials) {
          createPreservedMaterialMeshes(sketchGroup);
        } else {
          // Remove meshes de materiais preservados se a funcionalidade foi desativada
          sketchSceneRef.current.preservedMaterialMeshes.forEach((mesh) => {
            if (mesh.parent) {
              mesh.parent.remove(mesh);
            }
            if (mesh.geometry) {
              mesh.geometry.dispose();
            }
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          });
          sketchSceneRef.current.preservedMaterialMeshes.clear();
        }
      } catch (err) {
        console.error("Error updating sketch scene:", err);
      }
    }
  };
  
  // COMPONENTE DE MONITORAMENTO PARA GARANTIR QUE O MODELO PERMANEÇA VISÍVEL NO MODO NORMAL
  // Este efeito é executado apenas uma vez para monitorar alterações de modo no contexto global
  useEffect(() => {
    function watchModeChanges() {
      // Verifica a cada 100ms se há uma mudança pendente de modo
      const intervalId = setInterval(() => {
        // Se estamos no modo normal mas o cache global ainda pensa que estamos no modo sketch
        if (currentMode === 'normal' && GlobalCache.sketchActive) {
          debugLog("Detectada mudança de sketch -> normal sem restauração adequada!");
          
          // Marca como pendente se ainda não estiver
          if (!GlobalCache.pendingRestore) {
            GlobalCache.pendingRestore = true;
            
            // Tenta forçar restauração
            const restored = restoreOriginalVisibility(true);
            if (restored) {
              debugLog("Restauração forçada bem-sucedida");
              GlobalCache.pendingRestore = false;
            } else {
              debugLog("Falha na restauração forçada, tentando novamente em breve");
            }
          }
        }
      }, 100);
      
      return () => clearInterval(intervalId);
    }
    
    const cleanup = watchModeChanges();
    return cleanup;
  }, []);
  
  // Controle da visibilidade com base no modo atual
  useEffect(() => {
    debugLog(`Modo de visualização alterado: ${lastModeRef.current} -> ${currentMode}`);
    
    // Rastrear a transição de modo (normal -> sketch ou sketch -> normal)
    const previousMode = lastModeRef.current;
    lastModeRef.current = currentMode;
    
    const sketchVisible = currentMode === 'sketch';
    
    if (sketchVisible) {
      // Entrando no modo sketch
      if (scene) {
        // Salva o fundo original antes de mudar
        sketchSceneRef.current.originalBackground = scene.background ? scene.background.clone() : null;
        
        // Oculta modelos originais e salva seu estado
        hideOriginalModels();
        
        // Inicializa ou atualiza a cena sketch
        updateSketchScene();
        
        // Armazena referência do renderer para uso em funções de destaque
        if (scene.userData) {
          scene.userData.debugRenderer = renderer;
        }
      }
    } else if (previousMode === 'sketch') {
      // Saindo do modo sketch (estava no modo sketch antes)
      debugLog("Saindo do modo sketch, restaurando modelo original");
      
      // Restaura visibilidade original dos modelos - PONTO CRÍTICO
      // Este será executado mesmo que o componente esteja prestes a ser desmontado
      restoreOriginalVisibility(true); // Forçar restauração
      
      // Aqui implementamos uma "última chance" de garantir que o modelo esteja visível
      const activeModel = modelRef.current || originalModelRef.current || GlobalCache.originalModel;
      if (activeModel) {
        // Se o modelo não está na cena, adiciona-o
        if (scene && activeModel.parent !== scene) {
          scene.add(activeModel);
          debugLog("Modelo adicionado de volta à cena através da transição");
        }
        
        // Força visibilidade
        activeModel.visible = true;
        
        activeModel.traverse(obj => {
          if (obj.isMesh || obj.isGroup) {
            obj.visible = true;
            if (obj.userData && obj.userData._hiddenBySketchMode) {
              delete obj.userData._hiddenBySketchMode;
            }
          }
        });
      }
      
      // Oculta o grupo sketch
      if (sketchSceneRef.current.sketchGroup) {
        sketchSceneRef.current.sketchGroup.visible = false;
      }
      
      // Restaura o fundo original
      if (scene && sketchSceneRef.current.originalBackground) {
        scene.background = sketchSceneRef.current.originalBackground;
      } else if (scene) {
        scene.background = new THREE.Color('#dddddd');
      }
      
      // Garante que os controles da câmera funcionem no modo normal
      if (world && world.controls) {
        world.controls.enabled = true;
      }
    }
    
    // Atualiza a visibilidade do grupo sketch com base no modo
    if (sketchSceneRef.current.sketchGroup) {
      sketchSceneRef.current.sketchGroup.visible = sketchVisible;
    }
    
    // Limpa quaisquer efeitos temporários ao mudar de modo
    const clearTemporaryEffects = () => {
      if (!scene) return;
      
      scene.children.forEach(child => {
        if (child.userData && child.userData.isTemporaryEffect) {
          scene.remove(child);
        }
      });
    };
    
    clearTemporaryEffects();
    
  }, [currentMode, scene, world]);
  
  // Efeito para atualizar a cena quando as configurações mudam
  useEffect(() => {
    if (scene && renderer && camera && modelRef.current && currentMode === 'sketch') {
      // Garante que a cena tenha um background antes de tentar atualizá-lo
      if (scene && !scene.background) {
        scene.background = new THREE.Color(sketchConfig.backgroundColor);
      }
      
      updateSketchScene();
    }
  }, [
    sketchConfig.backgroundColor,
    sketchConfig.modelColor,
    sketchConfig.lineColor,
    sketchConfig.shadowColor,
    sketchConfig.lit,
    sketchConfig.opacity,
    sketchConfig.display,
    sketchConfig.displayConditionalEdges,
    sketchConfig.thickness,
    sketchConfig.useThickLines,
    sketchConfig.preserveOriginalMaterials,
    sketchConfig.preservedMaterialTypes,
    sketchConfig.preservedObjects,
    currentMode
  ]);
  
  // Efeito para limpar a cena quando o componente é desmontado
  useEffect(() => {
    return () => {
      debugLog("Limpando componente SketchRenderer");
      
      try {
        // PARTE CRÍTICA: Restaurar visibilidade durante desmontagem
        if (currentMode === 'sketch') {
          debugLog("Restaurando modelo durante desmontagem (modo sketch ativo)");
          
          // Marca no cache global que a restauração é necessária
          GlobalCache.pendingRestore = true;
          
          // Restaurar imediatamente, mesmo durante desmontagem
          try {
            // Primeiro tentar usando nosso método interno
            const restored = restoreOriginalVisibility(true);
            
            if (!restored) {
              debugLog("Falha na primeira tentativa de restauração, tentando restauração manual");
              
              // Restauração manual de emergência como último recurso
              if (GlobalCache.originalModel) {
                GlobalCache.originalModel.visible = true;
                
                GlobalCache.originalModel.traverse(obj => {
                  if (obj.isMesh || obj.isGroup) {
                    obj.visible = true;
                    if (obj.userData && obj.userData._hiddenBySketchMode) {
                      delete obj.userData._hiddenBySketchMode;
                    }
                  }
                });
                
                // Garantir que o modelo esteja na cena
                if (GlobalCache.sceneReference && 
                    GlobalCache.originalModel.parent !== GlobalCache.sceneReference) {
                  GlobalCache.sceneReference.add(GlobalCache.originalModel);
                  debugLog("Modelo original adicionado de volta à cena através da referência global");
                }
                
                debugLog("Restauração manual de emergência concluída");
              }
            }
          } catch (restoreError) {
            console.error("Erro durante restauração:", restoreError);
          }
        } else if (currentMode === 'normal') {
          // No modo normal, simplesmente garantimos que o modelo esteja visível
          const activeModel = modelRef.current || originalModelRef.current || GlobalCache.originalModel;
          
          if (activeModel) {
            debugLog("Garantindo visibilidade final durante desmontagem (modo normal)");
            
            // Se o modelo não está na cena, adiciona-o
            if (scene && activeModel.parent !== scene) {
              scene.add(activeModel);
            }
            
            // Força visibilidade
            activeModel.visible = true;
            
            // Force visibilidade de todos os filhos
            activeModel.traverse(obj => {
              if (obj.isMesh || obj.isGroup) {
                obj.visible = true;
                
                // Remover qualquer flag de ocultação
                if (obj.userData && obj.userData._hiddenBySketchMode) {
                  delete obj.userData._hiddenBySketchMode;
                }
              }
            });
          }
        }
        
        // Limpa todos os objetos adicionados pelo modo sketch
        if (sketchSceneRef.current.sketchGroup && sketchSceneRef.current.sketchGroup.parent) {
          sketchSceneRef.current.sketchGroup.parent.remove(sketchSceneRef.current.sketchGroup);
          
          sketchSceneRef.current.sketchGroup.traverse(child => {
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m && m.dispose && m.dispose());
              } else if (child.material && child.material.dispose) {
                child.material.dispose();
              }
            }
            if (child.geometry && child.geometry.dispose) {
              child.geometry.dispose();
            }
          });
        }
        
        // Limpa meshes de materiais preservados
        sketchSceneRef.current.preservedMaterialMeshes.forEach((mesh) => {
          if (mesh.parent) {
            mesh.parent.remove(mesh);
          }
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
        
        // Reset das referências locais (mantém o cache global)
        sketchSceneRef.current = {
          edgesModel: null,
          originalModel: null,
          backgroundModel: null,
          conditionalModel: null,
          shadowModel: null,
          floor: null,
          depthModel: null,
          sketchGroup: null,
          originalObjects: new Map(),
          originalMaterials: new Map(),
          preservedMaterialMeshes: new Map(),
          objectLookup: new Map(),
          modelVisibilityMap: new Map()
        };
        
        // Remove luzes direcionais
        if (scene) {
          scene.children.forEach(child => {
            if (child.isDirectionalLight && child.userData.isSketchLight) {
              scene.remove(child);
            }
          });
        }
        
        // Restaura a cor de fundo original
        if (scene && sketchSceneRef.current.originalBackground) {
          scene.background = sketchSceneRef.current.originalBackground;
        } else if (scene) {
          scene.background = new THREE.Color('#dddddd');
        }
        
        // Habilita os controles novamente
        if (world && world.controls) {
          world.controls.enabled = true;
        }
        
        // Limpa quaisquer efeitos temporários
        if (scene) {
          scene.children.forEach(child => {
            if (child.userData && child.userData.isTemporaryEffect) {
              scene.remove(child);
            }
          });
        }
        
        initializedRef.current = false;
        lastModeRef.current = null;
        originalModelRef.current = null;
        
        // Atualizações de estado global finais
        GlobalCache.sketchActive = false;
      } catch (err) {
        console.error("Erro durante limpeza do SketchRenderer:", err);
      }
      
      debugLog("Limpeza do componente SketchRenderer concluída");
    };
  }, []);
  
  return null; // Este componente não renderiza nada visualmente, apenas manipula a cena Three.js
};

// Memoizar o componente para evitar renderizações desnecessárias
export default React.memo(SketchRenderer);