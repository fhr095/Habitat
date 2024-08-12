import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

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
      const action = mixer.current.clipAction(gltf.animations[0]); // Toca apenas a primeira animação
      action.play();
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

export default function Avatar({ position }) {
  const modelUrl = "/Avatar/apontando-normal-direita.glb"; // Substitua com o caminho do GLB com a animação que deseja

  return position.x !== 0 && position.y !== 0 ? (
    <div
      style={{
        position: "absolute",
        left: position.x - 40, // Ajuste para mover para a direita
        top: position.y + 40, // Ajuste para mover para baixo
        transform: "translate(-50%, -100%)", // Centraliza a div em cima do ponto
        background: "transparent", // Fundo transparente
        padding: "5px",
        borderRadius: "5px",
        width: "100px", // Define o tamanho da área onde o robô 3D será renderizado
        height: "100px",
      }}
    >
      <Canvas camera={{ position: [0, 0.5, 2], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <AnimatedModel url={modelUrl} />
        <OrbitControls />
      </Canvas>
    </div>
  ) : null;
}