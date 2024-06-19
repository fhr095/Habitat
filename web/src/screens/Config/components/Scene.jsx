import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function Scene({ glbPath, loading, progress }) {
  const mount = useRef(null);

  useEffect(() => {
    if (glbPath) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, mount.current.clientWidth / mount.current.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparency
      renderer.setSize(mount.current.clientWidth, mount.current.clientHeight);
      renderer.setClearColor(0x000000, 0); // Transparent background
      mount.current.innerHTML = ""; // Clear previous renderers
      mount.current.appendChild(renderer.domElement);

      // Lighting
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 5, 5).normalize();
      scene.add(light);

      // Load the GLB model
      const loader = new GLTFLoader();
      loader.load(glbPath, (gltf) => {
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        gltf.scene.position.set(-center.x, -center.y, -center.z);

        camera.position.set(0, size.y * 1.5, size.z * 2);
        camera.lookAt(center);

        scene.add(gltf.scene);

        // Add rotation to the model
        const animate = () => {
          requestAnimationFrame(animate);
          gltf.scene.rotation.y += 0.01; // Rotate model
          renderer.render(scene, camera);
        };

        animate();
      });

      window.addEventListener("resize", onWindowResize);

      function onWindowResize() {
        camera.aspect = mount.current.clientWidth / mount.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.current.clientWidth, mount.current.clientHeight);
      }

      return () => {
        window.removeEventListener("resize", onWindowResize);
      };
    }
  }, [glbPath]);

  return (
    <div ref={mount} className="scene-container">
      {loading && <p>Carregando... {Math.round(progress)}%</p>}
    </div>
  );
}