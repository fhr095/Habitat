// SketchRenderer.jsx - Versão Otimizada
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
const DEBUG = false;
const debugLog = (...args) => {
  if (DEBUG) console.log(...args);
};

// API para debugging do modo sketch (exportação global)
// Será usada pelo FocusOnObject para melhor integração
window._debugSketchMode = {
  getSketchStatus: () => {
    return null; // Substituído em runtime
  },
  findObjectByName: (name) => {
    return { inScene: [], inSketchGroup: [] }; // Substituído em runtime
  }
};

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
    originalObjects: new Map(), // Mapa para armazenar visualidade original dos objetos
    originalBackground: null // Para armazenar o background original da cena
  });
  
  // Referência para o marcador "Você está aqui"
  const youAreHereRef = useRef(null);
  
  // Flag para controlar a inicialização
  const initializedRef = useRef(false);
  
  // Atualizar a API de debug global com o status atual
  useMemo(() => {
    window._debugSketchMode.getSketchStatus = () => ({
      currentMode,
      sketchGroupVisible: sketchSceneRef.current.sketchGroup?.visible || false,
      sketchConfig
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
              type: obj.type
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
              type: obj.type
            });
          }
        });
      }
      
      return result;
    };
  }, [currentMode, sketchConfig, scene]);
  
  /**
   * Encontra o marcador "Você está aqui" no objeto fornecido
   * @param {THREE.Object3D} object - Objeto para buscar o marcador
   * @returns {THREE.Object3D|null} - O marcador encontrado ou null
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
   * Mescla objetos em uma única geometria para o modo sketch
   * @param {THREE.Object3D} object - Objeto a ser mesclado
   * @returns {THREE.Group|null} - Grupo contendo a geometria mesclada
   */
  const mergeObject = (object) => {
    if (!object) return null;
    
    try {
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

      if (geometry.length === 0) return null;

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
      
      return group;
    } catch (err) {
      console.error("Error merging object:", err);
      return null;
    }
  };
  
  /**
   * Cria o modelo com bordas para o modo sketch
   * @param {THREE.Object3D} originalModel - Modelo original mesclado
   * @param {THREE.Group} sketchGroup - Grupo que conterá o modelo sketch
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
   * @param {THREE.Object3D} originalModel - Modelo original mesclado
   * @param {THREE.Group} sketchGroup - Grupo que conterá o modelo sketch
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
   * @param {THREE.Object3D} originalModel - Modelo original mesclado
   * @param {THREE.Group} sketchGroup - Grupo que conterá o modelo sketch
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
          
          c.material = new THREE.MeshBasicMaterial({ color: sketchConfig.modelColor });
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
            transparent: true,
            opacity: 1.0
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
    } catch (err) {
      console.error("Error creating background models:", err);
    }
  };
  
  /**
   * Configura o chão (plano) para o modo sketch
   * @param {THREE.Group} sketchGroup - Grupo que conterá o modelo sketch
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
   * @param {THREE.Group} sketchGroup - Grupo que conterá o modelo sketch
   * @returns {THREE.DirectionalLight|null} - A luz criada ou null em caso de erro
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
   * para posterior restauração
   */
  const saveOriginalVisibility = () => {
    sketchSceneRef.current.originalObjects.clear();
    
    scene.traverse(object => {
      if (object.isMesh || object.isGroup) {
        // Armazena estado completo do objeto
        sketchSceneRef.current.originalObjects.set(object.uuid, {
          visible: object.visible,
          userData: { ...object.userData },
          position: object.position.clone(),
          rotation: object.rotation.clone(),
          scale: object.scale.clone()
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
              
          sketchSceneRef.current.originalObjects.get(object.uuid).materialData = materialData;
        }
      }
    });
    
    debugLog(`Original visibility state captured for ${sketchSceneRef.current.originalObjects.size} objects`);
  };
  
  /**
   * Restaura a visibilidade original dos objetos após sair do modo sketch
   */
  const restoreOriginalVisibility = () => {
    scene.traverse(object => {
      if ((object.isMesh || object.isGroup) && 
          sketchSceneRef.current.originalObjects.has(object.uuid)) {
        const original = sketchSceneRef.current.originalObjects.get(object.uuid);
        
        // Restaura visibilidade
        object.visible = original.visible;
        
        // Restaura propriedades de transformação
        if (original.position) object.position.copy(original.position);
        if (original.rotation) object.rotation.copy(original.rotation);
        if (original.scale) object.scale.copy(original.scale);
        
        // Restaura userData mas preserva propriedades novas que possam ter sido adicionadas
        if (original.userData) {
          object.userData = { 
            ...object.userData, 
            ...original.userData,
            // Remove explicitamente flags do modo sketch
            _hiddenBySketchMode: undefined
          };
        }
        
        // Restaura propriedades do material para meshes
        if (object.isMesh && object.material && original.materialData) {
          if (Array.isArray(object.material) && Array.isArray(original.materialData)) {
            // Trata array de materiais
            for (let i = 0; i < Math.min(object.material.length, original.materialData.length); i++) {
              const mat = object.material[i];
              const origMat = original.materialData[i];
              
              mat.opacity = origMat.opacity;
              mat.transparent = origMat.transparent;
              mat.depthWrite = origMat.depthWrite;
              
              if (mat.color && origMat.color) {
                mat.color.copy(origMat.color);
              }
              
              if (mat.emissive && origMat.emissive) {
                mat.emissive.copy(origMat.emissive);
              }
              
              mat.needsUpdate = true;
            }
          } else if (!Array.isArray(object.material) && !Array.isArray(original.materialData)) {
            // Trata material único
            const mat = object.material;
            const origMat = original.materialData;
            
            mat.opacity = origMat.opacity;
            mat.transparent = origMat.transparent;
            mat.depthWrite = origMat.depthWrite;
            
            if (mat.color && origMat.color) {
              mat.color.copy(origMat.color);
            }
            
            if (mat.emissive && origMat.emissive) {
              mat.emissive.copy(origMat.emissive);
            }
            
            mat.needsUpdate = true;
          }
        }
      }
    });
    
    // Remove explicitamente flags que possam ter sido definidos
    scene.traverse(object => {
      if (object.userData && object.userData._hiddenBySketchMode) {
        delete object.userData._hiddenBySketchMode;
      }
    });
    
    debugLog("Original visibility state restored");
  };
  
  /**
   * Oculta os modelos originais durante o modo sketch
   */
  const hideOriginalModels = () => {
    // Primeiro, salva o estado original
    saveOriginalVisibility();
    
    debugLog("Hiding original models for sketch mode");
    
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
      debugLog("Creating merged model from:", modelRef.current);
      try {
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
      } catch (err) {
        console.error("Error updating sketch scene:", err);
      }
    }
  };
  
  // Controle da visibilidade com base no modo atual
  useEffect(() => {
    debugLog("Modo de visualização alterado:", currentMode);
    
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
    } else {
      // Saindo do modo sketch
      
      // Restaura visibilidade original dos modelos
      restoreOriginalVisibility();
      
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
      scene.children.forEach(child => {
        if (child.userData && child.userData.isTemporaryEffect) {
          scene.remove(child);
        }
      });
    };
    
    clearTemporaryEffects();
    
  }, [currentMode, scene, world]);
  
  // Efeito para atualizar a cena quando as configurações mudam
  // Reduzido número de dependências para evitar renderizações desnecessárias
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
    currentMode
  ]);
  
  // Efeito para limpar a cena quando o componente é desmontado
  useEffect(() => {
    return () => {
      // Restaura a visibilidade original dos modelos uma última vez quando o componente desmonta
      restoreOriginalVisibility();
      
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
      
      // Reset das referências
      sketchSceneRef.current = {
        edgesModel: null,
        originalModel: null,
        backgroundModel: null,
        conditionalModel: null,
        shadowModel: null,
        floor: null,
        depthModel: null,
        sketchGroup: null,
        originalObjects: new Map()
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
      } else if (world && world.scene) {
        world.scene.background = new THREE.Color('#dddddd');
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
      
      // Reseta a API de debug global
      window._debugSketchMode = {
        getSketchStatus: () => null,
        findObjectByName: () => ({ inScene: [], inSketchGroup: [] })
      };
    };
  }, []);
  
  return null; // Este componente não renderiza nada visualmente, apenas manipula a cena Three.js
};

// Memoizar o componente para evitar renderizações desnecessárias
export default React.memo(SketchRenderer);