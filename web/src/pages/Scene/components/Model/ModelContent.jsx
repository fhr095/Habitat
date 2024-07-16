import React, { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function ModelContent({ glbFileUrl, fade }) {
  const { scene } = useGLTF(glbFileUrl);
  const modelRef = useRef();
  const { camera } = useThree();
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetObject, setTargetObject] = useState(null);
  const [initialPosition] = useState(camera.position.clone());
  const [animationDuration, setAnimationDuration] = useState(2);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (fade.length > 0 && scene) {
      const targetNames = fade.map(f => f.fade);
      const objects = targetNames.map(name => scene.getObjectByName(name)).filter(obj => obj);
      if (objects.length > 0) {
        setTargetObject(objects[0]); // Apenas usando o primeiro objeto correspondido para este exemplo
        setAnimationDuration(fade[0].duration + 2); // Adicionando 2 segundos à duração do áudio
        setIsAnimating(true);
        setElapsedTime(0);
      }
    }
  }, [fade, scene]);

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.001; // Ajustar a velocidade de rotação conforme necessário
    }

    if (isAnimating && targetObject) {
      setElapsedTime(prevTime => prevTime + delta);
      const progress = elapsedTime / animationDuration;

      if (progress < 1) {
        const angle = progress * Math.PI * 2; // Círculo completo para rotação
        const radius = 5; // Distância do objeto
        const targetPosition = new THREE.Vector3(
          targetObject.position.x + radius * Math.sin(angle),
          targetObject.position.y + 1, // Um pouco acima do objeto
          targetObject.position.z + radius * Math.cos(angle)
        );

        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(targetObject.position);

        scene.traverse(child => {
          if (child.isMesh && child.material) {
            if (child === targetObject) {
              child.material.opacity = 1;
            } else {
              child.material.opacity = 0.2; // Tornar outros objetos transparentes
            }
            child.material.transparent = true;
          }
        });
      } else {
        // Resetar posição da câmera e opacidade dos objetos
        camera.position.lerp(initialPosition, 0.1);

        if (elapsedTime > animationDuration + 2) {
          setIsAnimating(false);
          setElapsedTime(0); // Resetar o tempo decorrido
          scene.traverse(child => {
            if (child.isMesh && child.material) {
              child.material.opacity = 1; // Tornar todos os objetos opacos
              child.material.transparent = false;
            }
          });
          camera.position.copy(initialPosition);
        } else {
          scene.traverse(child => {
            if (child.isMesh && child.material) {
              child.material.opacity = 0.9; // Tornar todos os objetos opacos
              child.material.transparent = false;
            }
          });
        }
      }
    }
  });

  return <primitive object={scene} ref={modelRef} />;
}