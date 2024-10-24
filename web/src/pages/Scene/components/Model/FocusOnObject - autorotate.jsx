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
    let initialCameraPosition = camera.position.clone();
    let initialControlsTarget = controls.target.clone();

    let targetMeshes = [];

    // **Step 2: Find the target object**
    scene.traverse((child) => {
      const normalizedChildName = child.name.trim().replace(/[\s_]+/g, "_").toLowerCase();
      const normalizedTargetName = targetName.trim().replace(/[\s_]+/g, "_").toLowerCase();

      if ((child.isMesh || child.isGroup) && normalizedChildName.includes(normalizedTargetName)) {
        targetMeshes.push(child);
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
          // No need to call camera.lookAt; controls will handle it
          controls.target.copy(center);
          controls.update();
        })
        .onComplete(() => {
          // **Start rotating around the target object using controls.autoRotate**
          controls.target.copy(center);
          controls.autoRotate = true;
          controls.autoRotateSpeed = -0.5; // Adjust speed as needed

          // **After a duration, reset camera and controls**
          setTimeout(() => {
            // **Stop auto-rotation**
            controls.autoRotate = false;
            // **Reset camera and controls**
            /*resetCameraAndControls().then(() => {
              resolve();
            });*/
          }, duration + 2000); // Adjust the duration as needed
        })
        .start();
    } else {
      console.warn(`Target object not found: ${targetName}`);
      resolve();
    }

    // Function to reset camera and controls
    function resetCameraAndControls() {
      return new Promise((resetResolve) => {
        let tweensCompleted = 0;

        function checkCompletion() {
          tweensCompleted++;
          if (tweensCompleted === 2) {
            resetResolve();
          }
        }

        // **Reset camera position**
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

        // **Reset controls target**
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
  });
};
