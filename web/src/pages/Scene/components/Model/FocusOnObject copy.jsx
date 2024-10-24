// FocusOnObject.jsx
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

export const focusOnObject = function(targetName, scene, camera, controls, duration = 2000) {
  return new Promise((resolve) => {
    if (!scene || !camera || !controls) {
      console.error("Scene, camera, or controls are not defined.");
      resolve(); // Resolve immediately since we cannot proceed
      return;
    }

    // Variables to store state for this instance
    let originalMaterials = new Map();
    let isRotating = false;
    let initialCameraPosition = camera.position.clone();
    let initialControlsTarget = controls.target.clone();
    const clock = new THREE.Clock();

    let targetMeshes = [];

    // **Step 1: Make all objects transparent**
    scene.traverse((child) => {
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
      }
    });

    // **Step 2: Find the target object and make it opaque**
    scene.traverse((child) => {
      const normalizedChildName = child.name.trim().replace(/[\s_]+/g, "_").toLowerCase();
      const normalizedTargetName = targetName.trim().replace(/[\s_]+/g, "_").toLowerCase();

      if ((child.isMesh || child.isGroup) && normalizedChildName.includes(normalizedTargetName)) {
        targetMeshes.push(child);

        if (child.isMesh) {
          child.material.opacity = 1;
          child.material.transparent = false;
          child.material.depthWrite = true;
        } else if (child.isGroup) {
          child.traverse((groupChild) => {
            if (groupChild.isMesh) {
              groupChild.material.opacity = 1;
              groupChild.material.transparent = false;
              groupChild.material.depthWrite = true;
            }
          });
        }
      }
    });

    // **Step 3: If target is found, focus on it**
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
        .to(newCameraPosition, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          camera.lookAt(center);
          controls.target.copy(center);
          controls.update();
        })
        .onComplete(() => {
          // **Start rotating around the target object**
          startRotatingAroundPoint(center);

          // **After a duration, reset camera and transparency**
          setTimeout(() => {
            resetCameraAndTransparency().then(() => {
              resolve(); // Resolve the promise when reset is complete
            });
          }, duration + 2000);
        })
        .start();
    } else {
      console.warn(`Objeto alvo não encontrado: ${targetName}`);
      // **Restore transparency if target not found**
      resetCameraAndTransparency().then(() => {
        resolve(); // Resolve the promise even if target not found
      });
    }

    // Function to reset camera and restore materials
    function resetCameraAndTransparency() {
      return new Promise((resetResolve) => {
        isRotating = false; // Stop rotation
        let tweensCompleted = 0;

        function checkCompletion() {
          tweensCompleted++;
          if (tweensCompleted === 2) {
            // Both tweens are complete
            // **Restore original materials**
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
            resetResolve();
          }
        }

        // **Reset camera position and controls**
        new TWEEN.Tween(camera.position)
          .to(
            {
              x: initialCameraPosition.x,
              y: initialCameraPosition.y,
              z: initialCameraPosition.z,
            },
            duration
          )
          .easing(TWEEN.Easing.Cubic.Out)
          .onUpdate(() => controls.update())
          .onComplete(() => checkCompletion())
          .start();

        new TWEEN.Tween(controls.target)
          .to(
            {
              x: initialControlsTarget.x,
              y: initialControlsTarget.y,
              z: initialControlsTarget.z,
            },
            duration
          )
          .easing(TWEEN.Easing.Cubic.Out)
          .onUpdate(() => controls.update())
          .onComplete(() => checkCompletion())
          .start();
      });
    }

    // Function to rotate around the target point
    function startRotatingAroundPoint(point) {
      isRotating = true;
      const baseSpeed = -0.005; // Define the base rotation speed

      function rotate() {
        if (!isRotating) return;

        const delta = clock.getDelta();
        const adjustedSpeed = baseSpeed * (delta / (1 / 60));

        const x = camera.position.x - point.x;
        const z = camera.position.z - point.z;
        const newX = x * Math.cos(adjustedSpeed) - z * Math.sin(adjustedSpeed);
        const newZ = x * Math.sin(adjustedSpeed) + z * Math.cos(adjustedSpeed);

        camera.position.x = newX + point.x;
        camera.position.z = newZ + point.z;
        camera.lookAt(point);
        controls.target.copy(point);
        controls.update();

        requestAnimationFrame(rotate);
      }

      rotate();
    }
  });
};
