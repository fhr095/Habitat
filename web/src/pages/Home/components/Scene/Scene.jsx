import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Loader from "./Loader";
import "./Scene.scss";

function Model({ url, fade, setFade }) {
  const gltf = useLoader(GLTFLoader, url);
  const modelRef = useRef();
  const [targetObject, setTargetObject] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (fade && gltf.scene) {
      const selectedObject = gltf.scene.getObjectByName(fade);
      if (selectedObject) {
        setTargetObject(selectedObject);
        setIsAnimating(true);
        setAnimationProgress(0);
        setReturning(false);
      }
    }
  }, [fade, gltf.scene]);

  useFrame((state, delta) => {
    if (modelRef.current) {
      // Rotate the model
      modelRef.current.rotation.y += 0.001; // Adjust the rotation speed as needed
    }

    if (isAnimating && targetObject && modelRef.current) {
      const { camera } = state;
      const duration = 5; // Duration of the animation in seconds
      const progress = Math.min(animationProgress + delta / duration, 1);

      if (!returning) {
        if (progress < 1) {
          setAnimationProgress(progress);

          const angle = progress * Math.PI * 2; // Full circle for rotation
          const radius = 5; // Distance from the object
          const targetPosition = new THREE.Vector3(
            targetObject.position.x + radius * Math.sin(angle),
            targetObject.position.y + radius * 0.5, // Slightly above
            targetObject.position.z + radius * Math.cos(angle)
          );

          camera.position.lerp(targetPosition, delta);
          camera.lookAt(targetObject.position);

          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              if (child === targetObject) {
                child.material.opacity = 1;
              } else {
                child.material.opacity = 0.2;
              }
              child.material.transparent = true;
            }
          });
        } else {
          setReturning(true);
          setAnimationProgress(0);
        }
      } else {
        if (progress < 1) {
          setAnimationProgress(progress);
          const originalPosition = new THREE.Vector3(0, 2, 30);
          camera.position.lerp(originalPosition, delta);

          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              child.material.opacity = 1;
              child.material.transparent = false;
            }
          });
        } else {
          setIsAnimating(false);
          setReturning(false);
          setFade(""); // Reset the fade
        }
      }
    }
  });

  return <primitive object={gltf.scene} dispose={null} ref={modelRef} />;
}

export default function Scene({ glbFileUrl, fade, setFade }) {
  return (
    <div className="scene">
      <Suspense fallback={<Loader />}>
        <Canvas
          camera={{ position: [0, 2, 30], fov: 50 }}
          style={{ position: 'absolute', top: 0, right: 0, width: 'calc(100% - 60px)', height: '100vh' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Model url={glbFileUrl} fade={fade} setFade={setFade} />
          <OrbitControls enableZoom={true} enablePan={true} />
        </Canvas>
      </Suspense>
    </div>
  );
}