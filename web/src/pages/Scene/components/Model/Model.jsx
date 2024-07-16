import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import ModelContent from "./ModelContent";
import "./Model.scss";

export default function Model({ glbFileUrl, fade }) {
  return (
    <div className="model-container">
      <Canvas camera={{ position: [0, 2, 20], fov: 50 }} style={{ height: '100vh', width: '100%' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={<Html center>Loading...</Html>}>
          <ModelContent glbFileUrl={glbFileUrl} fade={fade} />
        </Suspense>
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
}