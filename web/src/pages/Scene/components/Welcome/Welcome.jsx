import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import "./Welcome.scss";

// Componente para carregar e animar o modelo GLB
const AnimatedModel = ({ url }) => {
  const [gltf, setGltf] = useState(null);
  const mixer = useRef(null);
  const modelRef = useRef();

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      setGltf(gltf);
    });
  }, [url]);

  useEffect(() => {
    if (gltf && gltf.animations.length) {
      mixer.current = new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach((clip) => {
        const action = mixer.current.clipAction(clip);
        action.play();
      });
    }
  }, [gltf]);

  useFrame((state, delta) => {
    mixer.current?.update(delta);
    if (modelRef.current) {
        modelRef.current.rotation.y = -1.55; // Rotaciona o modelo 180 graus para deixá-lo de frente
        modelRef.current.position.y = -0.75; // Ajuste a posição Y para mover o modelo para baixo
      }
  });

  return gltf ? <primitive object={gltf.scene} ref={modelRef} /> : null;
};

// Componente principal da cena
export default function Welcome({ isPersonDetected, transcript }) {
  const [currentModel, setCurrentModel] = useState("/Avatar/chegando.glb");

  useEffect(() => {
    if (isPersonDetected) {
      setCurrentModel("/Avatar/acenando.glb");
    } else {
      const timer = setTimeout(() => {
        setCurrentModel("/Avatar/conversando-feliz.glb");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isPersonDetected]);

  const containerClass = transcript !== "" ? "welcome-container minimized" : "welcome-container";

  return (
    <div className={containerClass}>
      <Canvas camera={{ position: [0, 0.2, 2], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <AnimatedModel url={currentModel} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}