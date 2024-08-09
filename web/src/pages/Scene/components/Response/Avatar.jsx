import React, { useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

function AvatarModel({ url }) {
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
}

export default function Avatar({ animation }) {
  const modelUrl = animation === "pensando"
    ? "/Avatar/confuso.glb"
    : "/Avatar/conversando-feliz.glb";

  return (
    <Canvas
      camera={{ position: [0, 1, 3], fov: 50 }}
      style={{ width: '100px', height: '100px' }} // Definindo o tamanho fixo do canvas
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <AvatarModel url={modelUrl} />
      <OrbitControls />
    </Canvas>
  );
}