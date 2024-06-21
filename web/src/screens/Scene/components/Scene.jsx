import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import "../styles/Scene.scss";

export default function Scene({ glbPath }) {
  const mountRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;  // Variável de controle para verificar se o componente está montado
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Configura o fundo transparente
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const loader = new GLTFLoader();

    loader.load(
      glbPath,
      (gltf) => {
        if (!isMounted) return;
        scene.add(gltf.scene);
        gltf.scene.rotation.y = Math.PI;
        camera.position.set(0, 10, 50); // Ajusta a posição inicial da câmera para um zoom adequado e visualização de cima
        camera.lookAt(gltf.scene.position); // Faz a câmera olhar para o modelo
        const animate = function () {
          if (!isMounted) return;
          requestAnimationFrame(animate);
          gltf.scene.rotation.y += 0.001; // Rotação lenta
          controls.update();
          renderer.render(scene, camera);
        };
        animate();
        setLoadingProgress(100); // Carregamento completo
      },
      (xhr) => {
        if (!isMounted) return;
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          setLoadingProgress(Math.round(percentComplete));
        }
      },
      (error) => {
        console.error("Error loading GLB model:", error);
      }
    );

    const handleResize = () => {
      if (!isMounted) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;  // Desmontar o componente
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [glbPath]);

  return (
    <div ref={mountRef} className="scene-container">
      {loadingProgress < 100 && (
        <div className="loading-overlay">
          <div className="loading-text">Carregando: {loadingProgress}%</div>
        </div>
      )}
    </div>
  );
}