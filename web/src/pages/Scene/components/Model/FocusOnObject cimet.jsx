// FocusOnObject.jsx
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

// Mapa global para armazenar os materiais originais (usando o UUID como chave)
let originalMaterialsMap = new Map();

/**
 * Captura os materiais originais de todos os meshes da cena.
 * Essa função é chamada uma única vez na primeira animação.
 */
function captureOriginalMaterials(scene) {
  scene.traverse((child) => {
    if (child.isMesh && !originalMaterialsMap.has(child.uuid)) {
      originalMaterialsMap.set(child.uuid, {
        material: child.material,
        opacity: child.material.opacity,
        depthWrite: child.material.depthWrite,
        transparent: child.material.transparent,
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
    if (child.isMesh) {
      const box = new THREE.Box3().setFromObject(child);
      if (box.intersectsSphere(sphere)) {
        collisionDetected = true;
      }
    }
  });
  return collisionDetected;
}

/**
 * Anima (tween) a opacidade de todos os meshes que não sejam do target para um valor desejado.
 * O material permanece com depthWrite ativo durante o tween e, somente ao final, é desativado,
 * garantindo que enquanto o fade não estiver completo os objetos bloqueiem a visão.
 *
 * @param {THREE.Scene} scene 
 * @param {Array} targetMeshes - Meshes que NÃO serão afetados (objetos de foco)
 * @param {number} toOpacity - Opacidade final desejada (ex.: 0.02)
 * @param {number} duration - Duração do tween (em ms)
 */
function animateFade(scene, targetMeshes, toOpacity, duration) {
  scene.traverse((child) => {
    if (child.isMesh) {
      if (targetMeshes.includes(child)) return; // pula os objetos alvo
      new TWEEN.Tween({ opacity: child.material.opacity })
        .to({ opacity: toOpacity }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onStart(() => {
          child.material.transparent = true;
          // Não alteramos depthWrite ainda
        })
        .onUpdate((obj) => {
          child.material.opacity = obj.opacity;
          child.material.needsUpdate = true;
        })
        .onComplete(() => {
          // Após o fade completo, desativa a escrita no buffer de profundidade
          child.material.depthWrite = false;
          child.material.needsUpdate = true;
        })
        .start();
    }
  });
}

/**
 * Anima (tween) a opacidade de todos os meshes para os valores originais (armazenados em originalMaterialsMap)
 * ao longo de um determinado período. Durante esse tween, forçamos depthWrite = true para que os objetos
 * bloqueiem a visão até estarem totalmente opacos.
 */
function animateFadeIn(scene, duration) {
  scene.traverse((child) => {
    if (child.isMesh && originalMaterialsMap.has(child.uuid)) {
      const origOpacity = originalMaterialsMap.get(child.uuid).opacity;
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
        .start();
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
      child.material.dispose();
      child.material = orig.material;
      child.material.opacity = orig.opacity;
      child.material.depthWrite = orig.depthWrite;
      child.material.transparent = orig.transparent;
      child.material.needsUpdate = true;
    }
  });
  originalMaterialsMap.clear();
}

/**
 * Realiza uma transição cinematográfica para focar em um objeto alvo.
 * Combina movimentos de câmera em uma trajetória curva com:
 *  - Efeito de zoom (animando o campo de visão)
 *  - Deslocamento lateral (calculado via produto vetorial)
 *  - Rotação suave
 *  - Fade: os objetos não focados fazem fade out para 0.02; o objeto de foco faz fade in para 1,
 *    com depthWrite forçado para true.
 *
 * @param {string} targetName - Nome (ou parte dele) do objeto alvo.
 * @param {THREE.Scene} scene - Cena onde o objeto se encontra.
 * @param {THREE.Camera} camera - Câmera a ser animada.
 * @param {Object} controls - Controles da câmera (ex.: OrbitControls).
 * @param {number} duration - Duração da animação (em ms).
 * @param {Object} options - Opções adicionais:
 *    { zoomFactor: número (ex.: 0.8 para reduzir o fov em 20%),
 *      lateralOffset: número (valor em unidades para deslocamento lateral) }
 * @returns {Promise} - Resolve com a posição final da câmera.
 */
export function cinematicFocusOnObject(targetName, scene, camera, controls, duration, options = {}) {
  return new Promise((resolve) => {
    if (!scene || !camera || !controls) {
      console.error("Scene, camera, or controls are not defined.");
      resolve();
      return;
    }
    if (originalMaterialsMap.size === 0) {
      captureOriginalMaterials(scene);
    }
    // Procura pelos objetos alvo
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
    // Calcula a caixa delimitadora e o centro do objeto alvo
    const boundingBox = new THREE.Box3();
    targetMeshes.forEach((mesh) => boundingBox.expandByObject(mesh));
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const aspect = camera.aspect;
    let cameraZ = maxDim / (2 * Math.tan(fov / 2));
    cameraZ = cameraZ / Math.min(1, aspect);
    // Posição final desejada da câmera
    const finalPosition = new THREE.Vector3(
      center.x + cameraZ,
      center.y + cameraZ * 0.5,
      center.z + cameraZ
    );
    // SafePoint: acima do centro
    let safePoint = center.clone();
    safePoint.y += cameraZ * 0.75;
    // Calcula um deslocamento lateral
    const currentPos = camera.position.clone();
    const toCenter = new THREE.Vector3().subVectors(center, currentPos).normalize();
    const lateral = new THREE.Vector3().crossVectors(toCenter, camera.up).normalize();
    const lateralOffset = options.lateralOffset !== undefined ? options.lateralOffset : cameraZ * 0.2;
    const intermediatePoint = safePoint.clone().add(lateral.multiplyScalar(lateralOffset));
    // Define os pontos da curva: posição atual, intermediário e posição final
    const curvePoints = [currentPos, intermediatePoint, finalPosition];
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    // Tween para animar o fov (zoom)
    const initialFov = camera.fov;
    const targetFov = options.zoomFactor ? initialFov * options.zoomFactor : initialFov;
    const fovTween = new TWEEN.Tween({ fov: initialFov })
      .to({ fov: targetFov }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate((obj) => {
        camera.fov = obj.fov;
        camera.updateProjectionMatrix();
      });
    // Aplica os efeitos de fade:
    animateFade(scene, targetMeshes, 0.02, duration * 0.5);
    targetMeshes.forEach((mesh) => {
      if (mesh.isMesh) {
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
          if (child.isMesh) {
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
    // Tween para animar a trajetória da câmera
    const tweenObj = { t: 0 };
    new TWEEN.Tween(tweenObj)
      .to({ t: 1 }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        let pos = curve.getPoint(tweenObj.t);
        const maxAttempts = 5;
        let attempts = 0;
        while (checkCollision(scene, pos, 1) && attempts < maxAttempts) {
          pos = pos.clone();
          pos.y += 0.5;
          attempts++;
        }
        camera.position.copy(pos);
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();
      })
      .onComplete(() => {
        resolve(finalPosition);
      })
      .start();
    fovTween.start();
  });
}

/**
 * Retorna a câmera à posição original sem alterar o fov.
 * Essa função é usada entre as animações do mesmo ciclo para manter o fov constante.
 *
 * @param {THREE.Vector3} originalPosition - Posição original da câmera.
 * @param {THREE.Vector3} originalTarget - Alvo original dos controles.
 * @param {THREE.Scene} scene - A cena.
 * @param {THREE.Camera} camera - A câmera.
 * @param {Object} controls - Os controles da câmera.
 * @returns {Promise} - Resolve quando a animação for concluída.
 */
export function partialReturnToOriginalCamera(originalPosition, originalTarget, scene, camera, controls) {
  return new Promise((resolve) => {
    if (!scene || !camera || !controls || !originalPosition || !originalTarget) {
      console.error("Scene, camera, controls or original positions are not defined.");
      resolve();
      return;
    }
    animateFadeIn(scene, 1000);
    const currentPos = camera.position.clone();
    const midPoint = currentPos.clone().lerp(originalPosition, 0.5);
    midPoint.y += 2;
    const curvePoints = [currentPos, midPoint, originalPosition.clone()];
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tweenObj = { t: 0 };
    new TWEEN.Tween(tweenObj)
      .to({ t: 1 }, 3500)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        let pos = curve.getPoint(tweenObj.t);
        const maxAttempts = 5;
        let attempts = 0;
        while (checkCollision(scene, pos, 1) && attempts < maxAttempts) {
          pos = pos.clone();
          pos.y += 0.5;
          attempts++;
        }
        camera.position.copy(pos);
        const newTarget = new THREE.Vector3().lerpVectors(controls.target, originalTarget, tweenObj.t);
        camera.lookAt(newTarget);
        controls.target.copy(newTarget);
        controls.update();
      })
      .onComplete(() => {
        camera.position.copy(originalPosition);
        controls.target.copy(originalTarget);
        controls.update();
        resolve();
      })
      .start();
  });
}

/**
 * Retorna a câmera à posição original e restaura o fov original.
 * Essa transição final é feita de forma suave em dois passos:
 * primeiro, a câmera se move ao longo de uma curva e, em seguida, um tween curto restaura o fov.
 *
 * @param {THREE.Vector3} originalPosition - Posição original da câmera.
 * @param {THREE.Vector3} originalTarget - Alvo original dos controles.
 * @param {number} originalFov - Campo de visão original da câmera.
 * @param {THREE.Scene} scene - A cena.
 * @param {THREE.Camera} camera - A câmera.
 * @param {Object} controls - Os controles da câmera.
 * @returns {Promise} - Resolve quando a animação for concluída.
 */
export function returnToOriginalCamera(originalPosition, originalTarget, originalFov, scene, camera, controls) {
  return new Promise((resolve) => {
    if (!scene || !camera || !controls || !originalPosition || !originalTarget || originalFov === undefined) {
      console.error("Scene, camera, controls or original positions/fov are not defined.");
      resolve();
      return;
    }
    // Executa o tween de fade in para restaurar opacidades (1 segundo)
    animateFadeIn(scene, 1000);
    const currentPos = camera.position.clone();
    const midPoint = currentPos.clone().lerp(originalPosition, 0.5);
    midPoint.y += 2;
    const curvePoints = [currentPos, midPoint, originalPosition.clone()];
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tweenObj = { t: 0 };
    new TWEEN.Tween(tweenObj)
      .to({ t: 1 }, 1500)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        let pos = curve.getPoint(tweenObj.t);
        const maxAttempts = 5;
        let attempts = 0;
        while (checkCollision(scene, pos, 1) && attempts < maxAttempts) {
          pos = pos.clone();
          pos.y += 0.5;
          attempts++;
        }
        camera.position.copy(pos);
        const newTarget = new THREE.Vector3().lerpVectors(controls.target, originalTarget, tweenObj.t);
        camera.lookAt(newTarget);
        controls.target.copy(newTarget);
        controls.update();
      })
      .onComplete(() => {
        // Em vez de um snap, executa um tween curto para ajustar o fov suavemente
        new TWEEN.Tween({ fov: camera.fov })
          .to({ fov: originalFov }, 300)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate((obj) => {
            camera.fov = obj.fov;
            camera.updateProjectionMatrix();
          })
          .onComplete(() => {
            // A transição final está completa
            controls.update();
            restoreOriginalMaterials(scene);
            resolve();
          })
          .start();
      })
      .start();
  });
}
