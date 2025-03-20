// FocusOnObject.jsx
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

// Mapa global para armazenar os materiais originais (usando o UUID como chave)
let originalMaterialsMap = new Map();
// Referência para a animação de pulsação do "Você está aqui"
let youAreHerePulseAnimation = null;

/**
 * Captura os materiais originais de todos os meshes da cena.
 * Essa função é chamada uma única vez na primeira animação.
 */
function captureOriginalMaterials(scene) {
  scene.traverse((child) => {
    if (child.isMesh && !originalMaterialsMap.has(child.uuid)) {
      originalMaterialsMap.set(child.uuid, {
        material: child.material ? child.material.clone() : null,
        opacity: child.material ? child.material.opacity : 1,
        depthWrite: child.material ? child.material.depthWrite : true,
        transparent: child.material ? child.material.transparent : false,
      });
    }
  });
}

/**
 * Verifica colisões utilizando uma esfera de colisão.
 * Se a esfera (centrada em position com raio collisionRadius)
 * intersectar o bounding box de algum mesh, retorna true.
 */
function checkCollision(scene, position, collisionRadius = 1) {
  let collisionDetected = false;
  const sphere = new THREE.Sphere(position, collisionRadius);
  
  scene.traverse((child) => {
    // Só verifica colisão com objetos relevantes (prédios, paredes)
    if (child.isMesh && 
        child.geometry && 
        child.geometry.boundingBox && 
        child.visible &&
        child.material.opacity > 0.7) { // Só considera objetos relativamente opacos
      
      const box = new THREE.Box3().setFromObject(child);
      if (box.intersectsSphere(sphere)) {
        collisionDetected = true;
      }
    }
  });
  return collisionDetected;
}

/**
 * Encontra e retorna o objeto "Você_está_aqui" na cena
 */
function findYouAreHereMarker(scene) {
  let marker = null;
  scene.traverse((child) => {
    if (child.isMesh || child.isGroup) {
      const normalizedName = child.name.trim().toLowerCase();
      if (normalizedName === "você_está_aqui" || normalizedName === "voce_esta_aqui") {
        marker = child;
      }
    }
  });
  return marker;
}

/**
 * Cria uma animação de pulsação para o marcador "Você está aqui"
 * @param {THREE.Object3D} marker - O objeto "Você_está_aqui"
 * @param {number} duration - Duração em ms
 * @returns {Promise} - Resolve quando a animação terminar
 */
function animateYouAreHereMarker(marker, duration = 3000) {
  if (!marker) return Promise.resolve();
  
  // Cancela qualquer animação anterior
  if (youAreHerePulseAnimation) {
    youAreHerePulseAnimation.stop();
  }
  
  return new Promise((resolve) => {
    // Garante que o marcador está visível
    marker.visible = true;
    
    // Cria uma luz pontual sobre o marcador
    const light = new THREE.PointLight(0x4285f4, 2, 10);
    const markerPosition = new THREE.Vector3();
    marker.getWorldPosition(markerPosition);
    light.position.copy(markerPosition.clone().add(new THREE.Vector3(0, 2, 0)));
    marker.parent.add(light);
    
    // Adiciona uma esfera semitransparente como efeito de destaque
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4285f4,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(markerPosition);
    marker.parent.add(sphere);
    
    // Anima o marcador - pulsando e girando
    const initialScale = marker.scale.clone();
    const originalY = marker.position.y;
    
    // Tween de pulsação
    youAreHerePulseAnimation = new TWEEN.Tween({
      scaleX: initialScale.x,
      scaleY: initialScale.y,
      scaleZ: initialScale.z,
      sphereScale: 0.1,
      sphereOpacity: 0,
      lightIntensity: 0,
      y: originalY
    })
    .to({
      scaleX: initialScale.x * 1.3,
      scaleY: initialScale.y * 1.3,
      scaleZ: initialScale.z * 1.3,
      sphereScale: 1.5,
      sphereOpacity: 0.5,
      lightIntensity: 3,
      y: originalY + 0.5
    }, duration / 2)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .yoyo(true)
    .repeat(1)
    .onUpdate((obj) => {
      marker.scale.set(obj.scaleX, obj.scaleY, obj.scaleZ);
      marker.position.y = obj.y;
      sphere.scale.set(obj.sphereScale, obj.sphereScale, obj.sphereScale);
      material.opacity = obj.sphereOpacity;
      light.intensity = obj.lightIntensity;
    })
    .onComplete(() => {
      // Limpa os elementos visuais adicionados
      marker.parent.remove(light);
      marker.parent.remove(sphere);
      resolve();
    })
    .start();
  });
}

/**
 * Anima (tween) a opacidade de todos os meshes que não sejam do target para um valor desejado.
 * Aqui, forçamos o material a ser transparente, mas a alteração de depthWrite só ocorre
 * no final do tween, garantindo que a transparência já esteja completa.
 *
 * @param {THREE.Scene} scene 
 * @param {Array} targetMeshes - Meshes que NÃO serão afetados (objetos de foco)
 * @param {number} toOpacity - Opacidade final desejada (ex.: 0.02)
 * @param {number} duration - Duração do tween (em ms)
 */
function animateFade(scene, targetMeshes, toOpacity, duration) {
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
      
      if (!isTarget) {
        // Verifica se o material é um array
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            new TWEEN.Tween({ opacity: mat.opacity })
              .to({ opacity: toOpacity }, duration)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onStart(() => {
                mat.transparent = true;
              })
              .onUpdate((obj) => {
                mat.opacity = obj.opacity;
                mat.needsUpdate = true;
              })
              .onComplete(() => {
                mat.depthWrite = toOpacity >= 0.5;
                mat.needsUpdate = true;
              })
              .start();
          });
        } else {
          new TWEEN.Tween({ opacity: child.material.opacity })
            .to({ opacity: toOpacity }, duration)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onStart(() => {
              child.material.transparent = true;
            })
            .onUpdate((obj) => {
              child.material.opacity = obj.opacity;
              child.material.needsUpdate = true;
            })
            .onComplete(() => {
              child.material.depthWrite = toOpacity >= 0.5;
              child.material.needsUpdate = true;
            })
            .start();
        }
      }
    }
  });
}

/**
 * Anima a opacidade de todos os meshes para os valores originais (armazenados em originalMaterialsMap)
 * ao longo de um determinado período.
 * 
 * **Modificação:** Agora, durante o tween de fade in, forçamos depthWrite = true, 
 * garantindo que enquanto não estiver completamente opaco os objetos bloqueiem a visão.
 */
function animateFadeIn(scene, duration) {
  scene.traverse((child) => {
    if (child.isMesh && originalMaterialsMap.has(child.uuid)) {
      const origProps = originalMaterialsMap.get(child.uuid);
      
      if (Array.isArray(child.material)) {
        child.material.forEach((mat, index) => {
          // Use a opacidade original se disponível, caso contrário use a opacidade atual
          const origOpacity = origProps.opacity !== undefined ? origProps.opacity : mat.opacity;
          
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
}

/**
 * Restaura os materiais originais de todos os meshes da cena utilizando os dados armazenados.
 * Em seguida, limpa o mapa.
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
          mat.needsUpdate = true;
        });
      } else if (child.material) {
        child.material.opacity = orig.opacity;
        child.material.depthWrite = orig.depthWrite;
        child.material.transparent = orig.transparent;
        child.material.needsUpdate = true;
      }
    }
  });
  // Não limpe o mapa para permitir reutilização
  // originalMaterialsMap.clear();
}

/**
 * Calcula uma trajetória inteligente de A até B evitando colisões.
 * Utiliza um algoritmo de "potencial field" simplificado para gerar
 * uma curva suave que evita obstáculos.
 * 
 * @param {THREE.Vector3} start - Ponto inicial
 * @param {THREE.Vector3} end - Ponto final
 * @param {THREE.Scene} scene - Cena para verificação de colisões
 * @param {number} segments - Número de segmentos para cálculo da curva
 * @returns {THREE.CatmullRomCurve3} - Curva de navegação
 */
function calculateSmartTrajectory(start, end, scene, segments = 10) {
  // Array para os pontos da curva
  const points = [start.clone()];
  
  // Vetor da direção direta
  const direct = end.clone().sub(start).normalize();
  const distance = start.distanceTo(end);
  
  // Encontra um ponto intermediário "seguro" acima
  const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
  const up = new THREE.Vector3(0, 1, 0);
  const heightFactor = Math.min(distance * 0.25, 8); // Altura proporcional à distância, com limite
  midPoint.add(up.clone().multiplyScalar(heightFactor));
  
  // Verificamos se o ponto médio está livre de colisões
  if (checkCollision(scene, midPoint, 2)) {
    // Se houver colisão, tente elevar mais o ponto médio
    midPoint.add(up.clone().multiplyScalar(3));
  }
  
  points.push(midPoint);
  
  // Gera pontos adicionais para curva mais suave
  for (let i = 1; i < segments - 1; i++) {
    const t = i / segments;
    const point = new THREE.Vector3().lerpVectors(midPoint, end, t);
    
    // Aplica pequena variação para evitar obstáculos detectados
    if (checkCollision(scene, point, 1.5)) {
      // Se detectar colisão, desviar para cima e ligeiramente para o lado
      const avoidance = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3,
        (Math.random() - 0.5) * 2
      );
      point.add(avoidance);
    }
    
    points.push(point);
  }
  
  points.push(end.clone());
  
  // Cria uma curva suave pelos pontos calculados
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

/**
 * Aproxima a câmera de um objeto alvo usando uma trajetória curva inteligente.
 * Durante a animação destaca o marcador "Você está aqui" antes de iniciar o movimento.
 *
 * @param {string} targetName - Nome (ou parte dele) do objeto alvo.
 * @param {THREE.Scene} scene - Cena onde o objeto se encontra.
 * @param {THREE.Camera} camera - Câmera a ser animada.
 * @param {Object} controls - Controles da câmera (ex.: OrbitControls).
 * @param {number} duration - Duração da animação (em ms).
 * @returns {Promise} - Resolve com a posição final da câmera.
 */
export async function focusOnObject(targetName, scene, camera, controls, duration) {
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

    // Procura pelos objetos alvo com base no nome
    let targetMeshes = [];
    scene.traverse((child) => {
      const normalizedChildName = child.name.trim().replace(/[\s_]+/g, "_").toLowerCase();
      const normalizedTargetName = targetName.trim().replace(/[\s_]+/g, "_").toLowerCase();
      if ((child.isMesh || child.isGroup) && normalizedChildName.includes(normalizedTargetName)) {
        targetMeshes.push(child);
      }
    });

    if (targetMeshes.length === 0) {
      console.warn(`Target object not found: ${targetName}`);
      resolve();
      return;
    }
    
    // Primeiro, encontre e destaque o marcador "Você está aqui"
    const youAreHereMarker = findYouAreHereMarker(scene);
    if (youAreHereMarker) {
      // Anima o marcador antes de iniciar o movimento
      await animateYouAreHereMarker(youAreHereMarker, Math.min(duration * 0.3, 2000));
    }
    
    // Inicia o fade out dos objetos que não são alvo
    animateFade(scene, targetMeshes, 0.15, duration * 0.5);

    // Para os objetos alvo, anima o tween de fade para 1
    targetMeshes.forEach((mesh) => {
      if (mesh.isMesh && mesh.material) {
        new TWEEN.Tween({ opacity: mesh.material.opacity })
          .to({ opacity: 1 }, duration * 0.6)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onStart(() => {
            mesh.material.transparent = true;
            mesh.material.depthWrite = true;
          })
          .onUpdate((obj) => {
            mesh.material.opacity = obj.opacity;
            mesh.material.needsUpdate = true;
          })
          .start();
      } else if (mesh.isGroup) {
        mesh.traverse((child) => {
          if (child.isMesh && child.material) {
            new TWEEN.Tween({ opacity: child.material.opacity })
              .to({ opacity: 1 }, duration * 0.6)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onStart(() => {
                child.material.transparent = true;
                child.material.depthWrite = true;
              })
              .onUpdate((obj) => {
                child.material.opacity = obj.opacity;
                child.material.needsUpdate = true;
              })
              .start();
          }
        });
      }
    });
    
    // Calcula o bounding box do objeto alvo
    const boundingBox = new THREE.Box3();
    targetMeshes.forEach((mesh) => boundingBox.expandByObject(mesh));
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Calcula a posição ideal da câmera para visualizar o objeto
    const fov = camera.fov * (Math.PI / 180);
    const aspect = camera.aspect;
    let cameraZ = maxDim / (2 * Math.tan(fov / 2));
    cameraZ = cameraZ / Math.min(1, aspect);
    
    // Calcula um ângulo que oferece boa visualização (não de cima, mas ligeiramente em ângulo)
    const angle = Math.PI / 5; // ~36 graus
    const newCameraPosition = new THREE.Vector3(
      center.x + cameraZ * Math.sin(angle),
      center.y + cameraZ * 0.5,
      center.z + cameraZ * Math.cos(angle)
    );
    
    // Usa o algoritmo inteligente para calcular a trajetória
    const trajectory = calculateSmartTrajectory(
      camera.position.clone(), 
      newCameraPosition.clone(), 
      scene,
      10 // Número de segmentos para suavização da curva
    );
    
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
        camera.lookAt(newLookAt);
        controls.target.copy(newLookAt);
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
          .start();
          
        resolve(newCameraPosition);
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
 * @returns {Promise} - Resolve quando a animação for concluída.
 */
export function returnToOriginalCamera(originalPosition, originalTarget, scene, camera, controls) {
  return new Promise((resolve) => {
    if (!scene || !camera || !controls || !originalPosition || !originalTarget) {
      console.error("Scene, camera, controls or original positions are not defined.");
      resolve();
      return;
    }
    
    // Inicia o tween de fade in para restaurar as opacidades
    animateFadeIn(scene, 1000);
    
    // Calcula uma trajetória inteligente de volta
    const trajectory = calculateSmartTrajectory(
      camera.position.clone(),
      originalPosition.clone(),
      scene,
      8 // Menos segmentos para o retorno
    );
    
    const tweenObj = { t: 0 };
    
    new TWEEN.Tween(tweenObj)
      .to({ t: 1 }, 3000)
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
        camera.lookAt(newTarget);
        controls.target.copy(newTarget);
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
            restoreOriginalMaterials(scene);
            resolve();
          })
          .start();
      })
      .start();
  });
}