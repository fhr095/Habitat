import React, { Suspense, useRef } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "@react-three/drei";
import Loader from "./Loader";
import "./Scene.scss";

function Model({ url }) {
  const gltf = useLoader(GLTFLoader, url);
  const modelRef = useRef();

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.0001; // Adjust the rotation speed as needed
    }
  });

  return <primitive object={gltf.scene} dispose={null} ref={modelRef} />;
}

export default function Scene({ glbFileUrl }) {
  return (
    <div className="scene">
      <Suspense fallback={<Loader />}>
        <Canvas
          camera={{ position: [0, 2, 30], fov: 50 }}
          style={{ position: 'absolute', top: 0, right: 0, width: 'calc(100% - 60px)', height: '100vh' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Model url={glbFileUrl} />
          <OrbitControls enableZoom={true} enablePan={true} />
        </Canvas>
      </Suspense>
    </div>
  );
}