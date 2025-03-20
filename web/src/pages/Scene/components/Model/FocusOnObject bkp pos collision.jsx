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
    if (child.isMesh) {
      if (targetMeshes.includes(child)) return; // pula os objetos alvo
      new TWEEN.Tween({ opacity: child.material.opacity })
        .to({ opacity: toOpacity }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onStart(() => {
          child.material.transparent = true;
          // Não alteramos depthWrite aqui; aguardamos o final do tween
        })
        .onUpdate((obj) => {
          child.material.opacity = obj.opacity;
          child.material.needsUpdate = true;
        })
        .onComplete(() => {
          // Só ao final do tween desativamos a escrita no buffer de profundidade.
          child.material.depthWrite = false;
          child.material.needsUpdate = true;
        })
        .start();
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
      const origOpacity = originalMaterialsMap.get(child.uuid).opacity;
      new TWEEN.Tween({ opacity: child.material.opacity })
        .to({ opacity: origOpacity }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onStart(() => {
          child.material.transparent = true;
          // Força depthWrite = true enquanto o tween não completa,
          // garantindo que os objetos bloqueiem a visão até estarem totalmente opacos.
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
 * Aproxima a câmera de um objeto alvo usando uma trajetória curva com ponto intermediário seguro.
 * Durante a animação:
 *  - Os objetos que NÃO são alvo terão sua opacidade animada para 0.02 (fade out rápido),
 *    e só desativarão depthWrite quando o tween for concluído.
 *  - Os objetos alvo terão sua opacidade animada para 1 (fade in) de forma um pouco mais lenta,
 *    e terão depthWrite ativado para que apareçam por cima dos demais.
 *
 * @param {string} targetName - Nome (ou parte dele) do objeto alvo.
 * @param {THREE.Scene} scene - Cena onde o objeto se encontra.
 * @param {THREE.Camera} camera - Câmera a ser animada.
 * @param {Object} controls - Controles da câmera (ex.: OrbitControls).
 * @param {number} duration - Duração da animação (em ms).
 * @returns {Promise} - Resolve com a posição final da câmera.
 */
export function focusOnObject(targetName, scene, camera, controls, duration) {
  return new Promise((resolve) => {
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

    // Inicia o tween de fade out para todos os objetos que NÃO são alvo.
    // Usamos uma duração mais curta (por exemplo, metade do tempo da animação de câmera)
    animateFade(scene, targetMeshes, 0.05, duration * 0.5);

    // Para os objetos alvo, anima o tween de fade para 1 com uma duração um pouco maior.
    targetMeshes.forEach((mesh) => {
      if (mesh.isMesh) {
        new TWEEN.Tween({ opacity: mesh.material.opacity })
          .to({ opacity: 1 }, duration * 0.6)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onStart(() => {
            mesh.material.transparent = true;
            // Garante que o objeto de foco escreva no buffer de profundidade
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

    // Se o objeto alvo foi encontrado, calcula a nova posição da câmera
    if (targetMeshes.length > 0) {
      const boundingBox = new THREE.Box3();
      targetMeshes.forEach((mesh) => boundingBox.expandByObject(mesh));
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const aspect = camera.aspect;
      let cameraZ = maxDim / (2 * Math.tan(fov / 2));
      cameraZ = cameraZ / Math.min(1, aspect);

      const newCameraPosition = new THREE.Vector3(
        center.x + cameraZ,
        center.y + cameraZ * 0.5,
        center.z + cameraZ
      );
      const safePoint = center.clone();
      safePoint.y += cameraZ * 0.75;

      const curvePoints = [
        camera.position.clone(),
        safePoint,
        newCameraPosition.clone(),
      ];
      const curve = new THREE.CatmullRomCurve3(curvePoints);
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
          resolve(newCameraPosition);
        })
        .start();
    } else {
      console.warn(`Target object not found: ${targetName}`);
      animateFadeIn(scene, duration * 0.5);
      setTimeout(() => restoreOriginalMaterials(scene), duration * 0.5);
      resolve();
    }
  });
}

/**
 * Retorna a câmera à posição original (ou semelhante) utilizando uma trajetória curva com ponto intermediário seguro.
 * Durante esse movimento, inicia-se um tween de fade in para restaurar as opacidades dos objetos (de forma mais rápida).
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
    // Inicia o tween de fade in para restaurar as opacidades (em 1 segundo)
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
        restoreOriginalMaterials(scene);
        resolve();
      })
      .start();
  });
}
