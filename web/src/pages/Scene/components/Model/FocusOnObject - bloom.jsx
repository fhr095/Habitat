// focusOnLocation.jsx
//import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { SceneConfigContext } from "../../../../context/SceneConfigContext";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

/**
 * Focuses the camera on a target object by name, applies a bloom oscillation effect to it,
 * and rotates around it for a specified duration.
 *
 * @param {string} targetName - The name of the target object to focus on.
 * @param {THREE.Scene} scene - The Three.js scene containing the objects.
 * @param {THREE.Camera} camera - The camera used to view the scene.
 * @param {Object} controls - The controls used to interact with the camera.
 * @param {Function} setSceneConfig - Function to update the scene configuration (e.g., to control bloom effects).
 * @param {number} [duration=5000] - The duration (in milliseconds) to focus on the object and apply effects.
 * @returns {Promise} A promise that resolves when the focus operation is complete.
 * 
 
 */

//const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext);
export const focusOnObject = function(
  targetName,
  scene,
  camera,
  controls,
  setSceneConfig,
  duration = 5000
) {

  
  return new Promise((resolve) => {
    if (!scene || !camera || !controls) {
      console.error("Scene, camera, or controls are not defined.");
      resolve();
      return;
    }

    let isRotating = true;
    const clock = new THREE.Clock();

    let targetMeshes = [];

    // **Step 1: Find the target object(s)**
    scene.traverse((child) => {
      const normalizedChildName = child.name.trim().replace(/[\s_]+/g, "_").toLowerCase();
      const normalizedTargetName = targetName.trim().replace(/[\s_]+/g, "_").toLowerCase();

      if ((child.isMesh || child.isGroup) && normalizedChildName.includes(normalizedTargetName)) {
        targetMeshes.push(child);
      }
    });

    // **Step 2: If target is found, apply bloom effect and focus on it**
    if (targetMeshes.length > 0) {
      // **Start bloom oscillation for the target object(s)**
      targetMeshes.forEach((mesh) => {
        startBloomOscillation(mesh);
      });

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

          // **After the duration, stop rotation and remove bloom effect**
          setTimeout(() => {
            isRotating = false; // Stop rotation

            // **Stop bloom oscillation for the target object(s)**
            targetMeshes.forEach((mesh) => {
              stopBloomOscillation(mesh);
            });

            resolve(); // Resolve the promise
          }, duration); // Duration already accounts for any needed timing
        })
        .start();
    } else {
      console.warn(`Target object not found: ${targetName}`);
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

    // Function to start bloom oscillation on an object
    function startBloomOscillation(object) {
      if (object.uuid) {
        // Update the bloom effect status in SceneConfigContext
        setSceneConfig((prevConfig) => {
          const newStatus = { ...prevConfig.model2.bloomEffect.status };
          newStatus[object.uuid] = {
            name: object.name || 'Unnamed Object',
            status: true,
            oscillate: true,
          };
          return {
            ...prevConfig,
            both: {
              ...prevConfig.model2,
              bloomEffect: {
                ...prevConfig.model2.bloomEffect,
                status: newStatus,
              },
            },
          };
        });
      }
    }

    // Function to stop bloom oscillation on an object
    function stopBloomOscillation(object) {
      if (object.uuid) {
        setSceneConfig((prevConfig) => {
          const newStatus = { ...prevConfig.model2.bloomEffect.status };
          if (newStatus[object.uuid]) {
            newStatus[object.uuid] = {
              ...newStatus[object.uuid],
              status: false,
              oscillate: false,
            };
          }
          return {
            ...prevConfig,
            both: {
              ...prevConfig.model2,
              bloomEffect: {
                ...prevConfig.model2.bloomEffect,
                status: newStatus,
              },
            },
          };
        });
      }
    }
  });
};
