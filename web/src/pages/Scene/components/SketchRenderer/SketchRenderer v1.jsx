// SketchRenderer.jsx
import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

// Importações do código de exemplo adaptadas para o projeto
import { OutsideEdgesGeometry } from './sketch/OutsideEdgesGeometry.js';
import { ConditionalEdgesGeometry } from './sketch/ConditionalEdgesGeometry.js';
import { ConditionalEdgesShader } from './sketch/ConditionalEdgesShader.js';
import { ConditionalLineSegmentsGeometry } from './sketch/ConditionalLineSegmentsGeometry.js';
import { ConditionalLineMaterial } from './sketch/ConditionalLineMaterial.js';
import { ColoredShadowMaterial } from './sketch/ColoredShadowMaterial.js';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext.jsx';

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
    sketchGroup: null // Novo grupo para conter todos os elementos do sketch
  });
  
  // Flag para controlar a inicialização
  const initializedRef = useRef(false);
  
  // Referência para armazenar a visibilidade original dos modelos
  const originalVisibilityRef = useRef({});
  
  // Função para mesclar objetos em uma única geometria
  const mergeObject = (object) => {
    if (!object) return null;
    
    try {
      object.updateMatrixWorld(true);

      const geometry = [];
      object.traverse(c => {
        if (c.isMesh) {
          const g = c.geometry.clone();
          g.applyMatrix4(c.matrixWorld);
          for (const key in g.attributes) {
            if (key !== 'position' && key !== 'normal') {
              g.deleteAttribute(key);
            }
          }
          geometry.push(g.toNonIndexed());
        }
      });

      if (geometry.length === 0) return null;

      // Correção na chamada das funções usando o namespace completo
      const mergedGeometries = BufferGeometryUtils.mergeGeometries(geometry, false);
      const mergedGeometry = BufferGeometryUtils.mergeVertices(mergedGeometries);
      
      // Centralizar a geometria
      const center = new THREE.Vector3();
      mergedGeometry.computeBoundingBox();
      mergedGeometry.boundingBox.getCenter(center);
      mergedGeometry.translate(-center.x, -center.y, -center.z);

      const group = new THREE.Group();
      const mesh = new THREE.Mesh(mergedGeometry);
      group.add(mesh);
      return group;
    } catch (err) {
      console.error("Error merging object:", err);
      return null;
    }
  };
  
  // Função para criar o modelo com bordas
  const initEdgesModel = (originalModel, sketchGroup) => {
    if (!originalModel || !scene) return;
    
    const { edgesModel } = sketchSceneRef.current;
    
    // Remove o modelo anterior se existir
    if (edgesModel && edgesModel.parent) {
      edgesModel.parent.remove(edgesModel);
      edgesModel.traverse(c => {
        if (c.isMesh) {
          if (Array.isArray(c.material)) {
            c.material.forEach(m => m.dispose());
          } else if (c.material) {
            c.material.dispose();
          }
        }
      });
    }
    
    // Cria uma cópia do modelo e adiciona ao grupo sketch em vez da cena
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
          // Correção na chamada das funções usando o namespace completo
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
  
  // Função para criar o modelo com bordas condicionais
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
    
    // Cria uma cópia do modelo e adiciona ao grupo sketch em vez da cena
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
        // Correção na chamada das funções usando o namespace completo
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
  
  // Função para criar o modelo de fundo e as sombras
  const initBackgroundModel = (originalModel, sketchGroup) => {
    if (!originalModel || !scene) return;
    
    const { backgroundModel, shadowModel, depthModel } = sketchSceneRef.current;
    
    // Remove modelos anteriores se existirem
    if (backgroundModel && backgroundModel.parent) {
      backgroundModel.parent.remove(backgroundModel);
      backgroundModel.traverse(c => {
        if (c.isMesh && c.material) {
          c.material.dispose();
        }
      });
    }
    
    if (shadowModel && shadowModel.parent) {
      shadowModel.parent.remove(shadowModel);
      shadowModel.traverse(c => {
        if (c.isMesh && c.material) {
          c.material.dispose();
        }
      });
    }
    
    if (depthModel && depthModel.parent) {
      depthModel.parent.remove(depthModel);
      depthModel.traverse(c => {
        if (c.isMesh && c.material) {
          c.material.dispose();
        }
      });
    }
    
    try {
      // Cria o modelo de fundo
      const newBackgroundModel = originalModel.clone();
      newBackgroundModel.traverse(c => {
        if (c.isMesh) {
          c.material = new THREE.MeshBasicMaterial({ color: sketchConfig.modelColor });
          c.material.polygonOffset = true;
          c.material.polygonOffsetFactor = 1;
          c.material.polygonOffsetUnits = 1;
          c.renderOrder = 2;
        }
      });
      sketchGroup.add(newBackgroundModel);
      sketchSceneRef.current.backgroundModel = newBackgroundModel;
      
      // Cria o modelo com sombras
      const newShadowModel = originalModel.clone();
      newShadowModel.traverse(c => {
        if (c.isMesh) {
          c.material = new ColoredShadowMaterial({ 
            color: sketchConfig.modelColor, 
            shininess: 1.0,
            shadowColor: sketchConfig.shadowColor
          });
          c.material.polygonOffset = true;
          c.material.polygonOffsetFactor = 1;
          c.material.polygonOffsetUnits = 1;
          c.receiveShadow = true;
          c.renderOrder = 2;
        }
      });
      sketchGroup.add(newShadowModel);
      sketchSceneRef.current.shadowModel = newShadowModel;
      
      // Cria o modelo para o buffer de profundidade
      const newDepthModel = originalModel.clone();
      newDepthModel.traverse(c => {
        if (c.isMesh) {
          c.material = new THREE.MeshBasicMaterial({ color: sketchConfig.modelColor });
          c.material.polygonOffset = true;
          c.material.polygonOffsetFactor = 1;
          c.material.polygonOffsetUnits = 1;
          c.material.colorWrite = false;
          c.renderOrder = 1;
        }
      });
      sketchGroup.add(newDepthModel);
      sketchSceneRef.current.depthModel = newDepthModel;
    } catch (err) {
      console.error("Error creating background models:", err);
    }
  };
  
  // Configura o chão (plano)
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
  
  // Configura luz direcional
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
  
  // Função para salvar a visibilidade original dos modelos na cena
  const saveOriginalVisibility = () => {
    if (!scene) return;
    
    scene.traverse(object => {
      if (object.isMesh || object.isGroup) {
        originalVisibilityRef.current[object.uuid] = object.visible;
      }
    });
  };
  
  // Função para restaurar a visibilidade original
  const restoreOriginalVisibility = () => {
    if (!scene) return;
    
    scene.traverse(object => {
      if ((object.isMesh || object.isGroup) && originalVisibilityRef.current[object.uuid] !== undefined) {
        object.visible = originalVisibilityRef.current[object.uuid];
      }
    });
  };
  
  // Função para ocultar os modelos originais quando o modo sketch está ativo
  const hideOriginalModels = () => {
    if (!scene || !modelRef.current) return;
    
    // Salva a visibilidade original primeiro
    saveOriginalVisibility();
    
    // Oculta o modelo original para evitar sobreposição
    if (modelRef.current) {
      modelRef.current.traverse(object => {
        if (object.isMesh) {
          object.visible = false;
        }
      });
    }
  };
  
  // Função de atualização principal
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
      console.log("Creating merged model from:", modelRef.current);
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
              c.material.color.set(sketchConfig.modelColor);
              c.material.shadowColor.set(sketchConfig.shadowColor);
            }
          });
        }
        
        if (depthModel) {
          depthModel.traverse(c => {
            if (c.isMesh && c.material) {
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
    const sketchVisible = currentMode === 'sketch';
    
    if (sketchVisible) {
      // Salva a cor de fundo original antes de mudar
      if (scene) {
        sketchSceneRef.current.originalBackground = scene.background ? scene.background.clone() : null;
        hideOriginalModels(); // Oculta modelos originais
        updateSketchScene(); // Inicializa ou atualiza a cena sketch
      }
    } else {
      // Restaura a visibilidade original dos modelos
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
    
    // Atualize a visibilidade do grupo sketch com base no modo
    if (sketchSceneRef.current.sketchGroup) {
      sketchSceneRef.current.sketchGroup.visible = sketchVisible;
    }
    
  }, [currentMode, scene, world]);
  
  // Efeito para limpar a cena quando o componente é desmontado
  useEffect(() => {
    return () => {
      // Restaura a visibilidade original dos modelos
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
        sketchGroup: null
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
      
      initializedRef.current = false;
    };
  }, []);
  
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
  
  return null; // Este componente não renderiza nada visualmente, apenas manipula a cena Three.js
};

export default React.memo(SketchRenderer); // Memorizar o componente para evitar rerenderizações desnecessárias