// FocusOnObject.jsx
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

// Mapa global para armazenar os materiais originais (usando o UUID como chave)
const originalMaterialsMap = new Map();
// Referência para a animação de pulsação do "Você está aqui"
let youAreHerePulseAnimation = null;
// Referência para os objetos de efeito adicionados temporariamente na cena
const temporaryEffects = new Set();

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
 * Verifica colisões utilizando raycasting para detecção de obstáculos mais precisa.
 * @param {THREE.Scene} scene - A cena para verificação
 * @param {THREE.Vector3} origin - Ponto de origem do raio
 * @param {THREE.Vector3} direction - Direção de verificação
 * @param {number} distance - Distância máxima de verificação
 * @returns {boolean} - True se houver colisão, False caso contrário
 */
function checkRayCollision(scene, origin, direction, distance = 5) {
  const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0, distance);
  
  // Filtrar apenas os objetos relevantes para colisão (prédios, paredes, etc.)
  const collidableObjects = [];
  scene.traverse((child) => {
    if (child.isMesh && 
        child.visible && 
        (!child.material.transparent || child.material.opacity > 0.5) &&
        !child.name.toLowerCase().includes("você_está_aqui") &&
        !child.name.toLowerCase().includes("voce_esta_aqui") &&
        !temporaryEffects.has(child)) {
      collidableObjects.push(child);
    }
  });
  
  const intersects = raycaster.intersectObjects(collidableObjects);
  return intersects.length > 0;
}

/**
 * Verifica colisões esféricas ao redor de um ponto
 * @param {THREE.Scene} scene - A cena
 * @param {THREE.Vector3} position - Posição central
 * @param {number} radius - Raio da esfera de colisão
 * @returns {boolean} - True se houver colisão
 */
function checkSphereCollision(scene, position, radius = 2) {
  // Verifica em várias direções para melhor cobertura
  const directions = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(1, 1, 0).normalize(),
    new THREE.Vector3(-1, 1, 0).normalize(),
    new THREE.Vector3(1, -1, 0).normalize(),
    new THREE.Vector3(-1, -1, 0).normalize(),
    new THREE.Vector3(0, 1, 1).normalize(),
    new THREE.Vector3(0, 1, -1).normalize(),
    new THREE.Vector3(0, -1, 1).normalize(),
    new THREE.Vector3(0, -1, -1).normalize(),
    new THREE.Vector3(1, 0, 1).normalize(),
    new THREE.Vector3(-1, 0, 1).normalize(),
    new THREE.Vector3(1, 0, -1).normalize(),
    new THREE.Vector3(-1, 0, -1).normalize(),
  ];

  for (const dir of directions) {
    if (checkRayCollision(scene, position, dir, radius)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Encontra e retorna o objeto "Você_está_aqui" na cena
 * @param {THREE.Scene} scene - A cena para busca
 * @returns {THREE.Object3D|null} - O objeto marcador ou null se não encontrado
 */
function findYouAreHereMarker(scene) {
  let marker = null;
  scene.traverse((child) => {
    if ((child.isMesh || child.isGroup) && !marker) {
      const normalizedName = child.name.trim().toLowerCase();
      if (normalizedName === "você_está_aqui" || 
          normalizedName === "voce_esta_aqui" ||
          normalizedName.includes("você_está_aqui") ||
          normalizedName.includes("voce_esta_aqui")) {
        marker = child;
      }
    }
  });
  return marker;
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
    'data:image/png;base64,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'
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

/**
 * Anima (tween) a opacidade de todos os meshes que não sejam do target para um valor desejado.
 * Implementa uma transição suave e inteligente que preserva a profundidade visual.
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
                .to({ r: 0.2, g: 0.2, b: 0.2 }, duration)
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
              .to({ r: 0.2, g: 0.2, b: 0.2 }, duration)
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
 * Anima a opacidade de todos os meshes para os valores originais (armazenados em originalMaterialsMap)
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
 * Calcula uma trajetória inteligente de A até B evitando colisões.
 * Utiliza um algoritmo adaptativo que cria uma curva suave que
 * evita obstáculos detectados ao longo do caminho.
 * 
 * @param {THREE.Vector3} start - Ponto inicial
 * @param {THREE.Vector3} end - Ponto final
 * @param {THREE.Scene} scene - Cena para verificação de colisões
 * @param {number} segments - Número de segmentos para cálculo da curva
 * @returns {THREE.CatmullRomCurve3} - Curva de navegação
 */
function calculateSmartTrajectory(start, end, scene, segments = 12) {
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
  while (checkSphereCollision(scene, midPoint, 3) && safetyIterations < maxSafetyIterations) {
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
    while (checkSphereCollision(scene, point, 2) && safetyIterations < maxSafetyIterations) {
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
}

/**
 * Aproxima a câmera de um objeto alvo usando uma trajetória curva inteligente.
 * Destaca o marcador "Você está aqui" antes de iniciar o movimento e aplica
 * efeitos visuais avançados durante a transição.
 *
 * @param {string} targetName - Nome (ou parte dele) do objeto alvo.
 * @param {THREE.Scene} scene - Cena onde o objeto se encontra.
 * @param {THREE.Camera} camera - Câmera a ser animada.
 * @param {Object} controls - Controles da câmera (ex.: OrbitControls).
 * @param {number} duration - Duração da animação (em ms).
 * @returns {Promise} - Resolve com a posição final da câmera.
 */
export async function focusOnObject(targetName, scene, camera, controls, duration = 3500) {
  return new Promise(async (resolve) => {
    if (!scene || !camera || !controls) {
      console.error("Scene, camera, or controls are not defined.");
      resolve();
      return;
    }
    
    // Captura os materiais originais se ainda não foram capturados
    if (originalMaterialsMap.size === 0) {
      captureOriginalMaterials(scene);
    }

    // Procura pelos objetos alvo com base no nome, com maior flexibilidade na busca
    let targetMeshes = [];
    scene.traverse((child) => {
      if (!(child.isMesh || child.isGroup)) return;
      
      // Normaliza os nomes para comparação mais flexível
      const normalizedChildName = child.name.trim().replace(/[-_\s]+/g, "_").toLowerCase();
      const normalizedTargetName = targetName.trim().replace(/[-_\s]+/g, "_").toLowerCase();
      
      // Aceita correspondências parciais ou palavras-chave
      if (normalizedChildName.includes(normalizedTargetName) || 
          normalizedTargetName.includes(normalizedChildName)) {
        targetMeshes.push(child);
      }
    });

    if (targetMeshes.length === 0) {
      console.warn(`Target object not found: ${targetName}`);
      resolve();
      return;
    }
    
    console.log(`Found ${targetMeshes.length} matching targets for: ${targetName}`);
    
    // Primeiro, encontre e destaque o marcador "Você está aqui"
    const youAreHereMarker = findYouAreHereMarker(scene);
    if (youAreHereMarker) {
      // Anima o marcador antes de iniciar o movimento
      await animateYouAreHereMarker(youAreHereMarker, scene, Math.min(duration * 0.3, 2000));
    } else {
      console.warn("Marker 'Você_está_aqui' not found in scene");
    }
    
    // Inicia o fade out dos objetos que não são alvo
    animateFade(scene, targetMeshes, 0.15, duration * 0.6);

    // Calcula o bounding box do objeto alvo
    const boundingBox = new THREE.Box3();
    targetMeshes.forEach((mesh) => boundingBox.expandByObject(mesh));
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Calcula a posição ideal da câmera para visualizar o objeto
    const fov = camera.fov * (Math.PI / 180);
    const aspect = camera.aspect;
    let distanceToFit = maxDim / (2 * Math.tan(fov / 2));
    distanceToFit = distanceToFit / Math.min(1, aspect);
    
    // Ajusta a distância para objetos muito pequenos ou muito grandes
    const minDistance = 5; // Distância mínima para objetos pequenos
    const maxDistance = 30; // Distância máxima para objetos grandes
    distanceToFit = Math.max(minDistance, Math.min(maxDistance, distanceToFit));
    
    // Calcula um ângulo que oferece boa visualização (não de cima, mas ligeiramente em ângulo)
    const angleHorizontal = Math.PI / 4; // 45 graus
    const angleVertical = Math.PI / 6; // 30 graus
    
    const newCameraPosition = new THREE.Vector3(
      center.x + distanceToFit * Math.sin(angleHorizontal),
      center.y + distanceToFit * Math.sin(angleVertical),
      center.z + distanceToFit * Math.cos(angleHorizontal)
    );
    
    // Salva a posição e target original da câmera para referência futura
    const originalCameraPosition = camera.position.clone();
    const originalTargetPosition = controls.target.clone();
    
    // Usa o algoritmo inteligente para calcular a trajetória
    const trajectory = calculateSmartTrajectory(
      camera.position.clone(), 
      newCameraPosition.clone(), 
      scene,
      15 // Número de segmentos para suavização da curva
    );
    
    // Adiciona um efeito visual de rastro ao longo da trajetória
    const trailEffect = createTrailEffect(scene, trajectory);
    
    // Animação da câmera ao longo da trajetória
    const tweenObj = { t: 0 };
    
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
        // Adiciona um pequeno movimento de "chegada" ao destino
        new TWEEN.Tween(camera.position)
          .to({
            x: newCameraPosition.x,
            y: newCameraPosition.y,
            z: newCameraPosition.z
          }, 500)
          .easing(TWEEN.Easing.Back.Out)
          .onComplete(() => {
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
      } else {
        console.error("No original positions provided and no stored positions found.");
        resolve();
        return;
      }
    }
    
    // Inicia o tween de fade in para restaurar as opacidades
    animateFadeIn(scene, duration * 0.7);
    
    // Calcula uma trajetória inteligente de volta
    const trajectory = calculateSmartTrajectory(
      camera.position.clone(),
      originalPosition.clone(),
      scene,
      10 // Segmentos para o retorno
    );
    
    // Adiciona um efeito visual de rastro ao longo da trajetória
    const trailEffect = createTrailEffect(scene, trajectory, new THREE.Color(0x00ff88));
    
    const tweenObj = { t: 0 };
    
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
            restoreOriginalMaterials(scene);
            
            // Atualiza os controles
            controls.update();
            
            // Limpa os dados de foco anterior
            if (controls.userData) {
              delete controls.userData.lastFocusPosition;
            }
            
            resolve();
          })
          .start();
      })
      .start();
  });
}