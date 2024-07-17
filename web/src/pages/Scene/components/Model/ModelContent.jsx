import React, { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import axios from "axios";

export default function ModelContent({ glbFileUrl, fade, avt, resete, setResete }) {
  const { camera, scene } = useThree();
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetObject, setTargetObject] = useState(null);
  const [initialPosition] = useState(camera.position.clone());
  const [animationDuration, setAnimationDuration] = useState(2);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showLabel, setShowLabel] = useState(false);
  const [labelShown, setLabelShown] = useState(false);
  const [initialOpacities, setInitialOpacities] = useState({});
  const modelRef = useRef();
  const { scene: loadedScene } = useGLTF(glbFileUrl);

  useEffect(() => {
    scene.add(loadedScene);

    return () => {
      scene.remove(loadedScene);
    };
  }, [loadedScene, scene]);

  useEffect(() => {
    const detectObject = async () => {
      try {
        const res = await axios.post("https://roko.flowfuse.cloud/talkwithifc", {
          msg: "onde eu estou",
          avt: avt
        });

        if (res.data && res.data.comandos.length > 0) {
          const targetName = res.data.comandos[0].fade; // Only the first item in the array
          const object = loadedScene.getObjectByName(targetName);
          if (object) {
            setTargetObject(object);
            setAnimationDuration(res.data.comandos[0].duration + 2); // Adding 2 seconds to the audio duration
            setIsAnimating(true);
            setElapsedTime(0);
            if (!labelShown) {
              setShowLabel(true);
              setLabelShown(true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching object location:", error);
      }
    };

    detectObject();
  }, [avt, loadedScene, labelShown]);

  useEffect(() => {
    if (fade.length > 0 && loadedScene) {
      const targetName = fade[0].fade; // Only the first item in the array
      const object = loadedScene.getObjectByName(targetName);
      if (object) {
        setTargetObject(object);
        setAnimationDuration(fade[0].duration + 2);
        setIsAnimating(true);
        setElapsedTime(0);

        // Save initial opacities
        const opacities = {};
        loadedScene.traverse(child => {
          if (child.isMesh && child.material) {
            opacities[child.uuid] = child.material.opacity;
          }
        });
        setInitialOpacities(opacities);
      }
    }
  }, [fade, loadedScene]);

  useEffect(() => {
    if (resete) {
      // Reset camera position and object opacity
      camera.position.copy(initialPosition);
      camera.lookAt(new THREE.Vector3(0, 0, 0)); // Adjust as needed to look at the center

      loadedScene.traverse(child => {
        if (child.isMesh && child.material) {
          const initialOpacity = initialOpacities[child.uuid];
          if (initialOpacity !== undefined) {
            child.material.opacity = initialOpacity;
            child.material.transparent = initialOpacity < 1;
          }
        }
      });

      setIsAnimating(false); // Stop any ongoing animation
      setElapsedTime(0); // Reset elapsed time
      setShowLabel(false); // Hide label
      setResete(false); // Reset the resete state
    }
  }, [resete, initialPosition, camera, loadedScene, initialOpacities, setResete]);

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.001; // Adjust the rotation speed as needed
    }

    if (isAnimating && targetObject) {
      setElapsedTime(prevTime => prevTime + delta);
      const progress = elapsedTime / animationDuration;

      if (progress < 1) {
        const angle = progress * Math.PI * 2; // Full circle for rotation
        const radius = 5; // Distance from the object
        const targetPosition = new THREE.Vector3(
          targetObject.position.x + radius * Math.sin(angle),
          targetObject.position.y + 1, // Slightly above the object
          targetObject.position.z + radius * Math.cos(angle)
        );

        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(targetObject.position);

        loadedScene.traverse(child => {
          if (child.isMesh && child.material) {
            if (child === targetObject) {
              child.material.opacity = 1;
            } else {
              child.material.opacity = 0.2; // Make other objects transparent
            }
            child.material.transparent = true;
          }
        });
      } else {
        // Reset camera position and object opacity
        camera.position.lerp(initialPosition, 0.1);

        if (elapsedTime > animationDuration + 2) {
          setIsAnimating(false);
          setElapsedTime(0); // Reset elapsed time
          loadedScene.traverse(child => {
            if (child.isMesh && child.material) {
              const initialOpacity = initialOpacities[child.uuid];
              if (initialOpacity !== undefined) {
                child.material.opacity = initialOpacity;
                child.material.transparent = initialOpacity < 1;
              }
            }
          });
          camera.position.copy(initialPosition);
        }
      }
    }
  });

  return (
    <primitive object={loadedScene} ref={modelRef}>
      {showLabel && targetObject && (
        <Html
          position={[targetObject.position.x, targetObject.position.y + 2, targetObject.position.z]}
          center
        >
          <div className="label">
            Você está aqui
          </div>
        </Html>
      )}
    </primitive>
  );
}