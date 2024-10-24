// FocusOnObject.jsx
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

export const focusOnObject = function(targetName, scene, camera, controls, duration, ultimo, primeiro) {
  return new Promise((resolve) => {
    if (!scene || !camera || !controls) {
      console.error("Scene, camera, or controls are not defined.");
      resolve();
      return;
    }

    // Variables to store state for this instance
    let originalMaterials = new Map();
    let isRotating = true;
    const clock = new THREE.Clock();

    let targetMeshes = [];

    // **Step 1: Restore materials from previous focus (if any)**
    restoreOriginalMaterials();

    // **Step 2: Make all objects transparent**
    /*scene.traverse((child) => {
      if (child.isMesh) {
        if (!originalMaterials.has(child)) {
          originalMaterials.set(child, {
            material: child.material,
            opacity: child.material.opacity,
            depthWrite: child.material.depthWrite,
            transparent: child.material.transparent,
          });
        }
        child.material = child.material.clone();
        child.material.opacity = 0.05;
        child.material.transparent = true;
        child.material.depthWrite = false;
        child.material.needsUpdate = true;
      }
    });*/

    // **Step 3: Find the target object and make it opaque**
    scene.traverse((child) => {
      const normalizedChildName = child.name.trim().replace(/[\s_]+/g, "_").toLowerCase();
      const normalizedTargetName = targetName.trim().replace(/[\s_]+/g, "_").toLowerCase();

      if ((child.isMesh || child.isGroup) && normalizedChildName.includes(normalizedTargetName)) {
        targetMeshes.push(child);

        if (child.isMesh) {
          child.material.opacity = 1;
          child.material.transparent = false;
          child.material.depthWrite = true;
          child.material.needsUpdate = true;
        } else if (child.isGroup) {
          child.traverse((groupChild) => {
            if (groupChild.isMesh) {
              groupChild.material.opacity = 1;
              groupChild.material.transparent = false;
              groupChild.material.depthWrite = true;
              groupChild.material.needsUpdate = true;
            }
          });
        }
      }
    });

    // **Step 4: If target is found, focus on it**
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

      new TWEEN.Tween(camera.position)
        .to(newCameraPosition, 3500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          camera.lookAt(center);
          controls.target.copy(center);
          controls.update();
        })
        .onComplete(() => {
          // **Start rotating around the target object**
          startRotatingAroundPoint(center);
          // **After a duration, stop rotation and resolve**
          setTimeout(() => {
            //if (ultimo){
              restoreOriginalMaterials()
            //}
            isRotating = false; // Stop rotation
            resolve(); // Resolve the promise without resetting the camera
          }, duration - 2000); // Adjust the duration as needed
        })
        .start();
    } else {
      console.warn(`Target object not found: ${targetName}`);
      restoreOriginalMaterials(); // Restore materials if target not found
      resolve();
    }

    // Function to rotate around the target point
    function startRotatingAroundPoint(point) {
      function rotate() {
        if (!isRotating) return;

        const delta = clock.getDelta();
        const rotationSpeed = -0.02; // Adjust speed as needed

        const x = camera.position.x - point.x;
        const z = camera.position.z - point.z;
        const newX = x * Math.cos(rotationSpeed) - z * Math.sin(rotationSpeed);
        const newZ = x * Math.sin(rotationSpeed) + z * Math.cos(rotationSpeed);

        camera.position.x = newX + point.x;
        camera.position.z = newZ + point.z;
        camera.lookAt(point);
        controls.target.copy(point);
        controls.update();

        requestAnimationFrame(rotate);
      }

      rotate();
    }

    // Function to restore original materials
    function restoreOriginalMaterials() {
      originalMaterials.forEach((originalState, child) => {
        if (child.isMesh) {
          child.material.dispose();
          child.material = originalState.material;
          child.material.opacity = originalState.opacity;
          child.material.depthWrite = originalState.depthWrite;
          child.material.transparent = originalState.transparent;
          child.material.needsUpdate = true;
        }
      });
      originalMaterials.clear();
    }
  });
};
