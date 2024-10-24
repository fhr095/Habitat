import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

export const focusOnObject = (targetName, scene, camera, controls, duration = 2000) => {
  let targetMeshes = [];

  scene.traverse((child) => {
    // Normaliza o nome do child
    const normalizedChildName = child.name.trim().replace(/[\s_]+/g, "_");
    const normalizedTargetName = targetName.trim().replace(/[\s_]+/g, "_");

    // Encontrar os objetos pelo nome
    if ((child.isMesh || child.isGroup) && normalizedChildName.includes(normalizedTargetName)) {
      targetMeshes.push(child);
    }
  });

  // Verifique se encontramos os meshes alvo, caso contrário, não faça nada
  if (targetMeshes.length === 0) {
    console.warn(`Objeto alvo não encontrado: ${targetName}`);
    return; // Saímos da função se nenhum alvo foi encontrado
  }

  // Se o alvo foi encontrado, continuamos com o foco
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
    center.x,
    center.y + cameraZ * 0.5,
    center.z + cameraZ
  );

  new TWEEN.Tween(camera.position)
    .to(newCameraPosition, duration)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onUpdate(() => {
      camera.lookAt(center);
      controls.target.copy(center);
      controls.update();
    })
    .start();
};
