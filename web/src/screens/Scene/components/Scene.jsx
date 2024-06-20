import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as TWEEN from "@tweenjs/tween.js";
import LoadingScreen from "./LoadingScreen";
import "../styles/Scene.scss";

const clock = new THREE.Clock();

export default function Scene({ glbPath }) {
  const mount = useRef(null);
  const scene = useRef(new THREE.Scene());
  const camera = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const renderer = useRef(null);
  const controls = useRef(null);
  const initialCameraPosition = useRef(new THREE.Vector3(0, 20, 50));
  const initialControlsTarget = useRef(new THREE.Vector3(0, 0, 0));
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    renderer.current = new THREE.WebGLRenderer({ antialias: true });
    controls.current = new OrbitControls(camera.current, renderer.current.domElement);

    setupScene();
    loadModel(glbPath);

    window.addEventListener("resize", onWindowResize);
    const animateLoop = requestAnimationFrame(animate);

    return () => {
      disposeResources();
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(animateLoop);
      if (mount.current) {
        mount.current.removeChild(renderer.current.domElement);
      }
    };
  }, [glbPath]);

  const setupScene = () => {
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setPixelRatio(window.devicePixelRatio * 1.5);
    renderer.current.setClearColor(new THREE.Color("#fff"));

    mount.current.appendChild(renderer.current.domElement);

    controls.current.enableZoom = true;
    controls.current.autoRotate = true;
    controls.current.autoRotateSpeed = 1.5;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 20, 10);
    scene.current.add(light);

    camera.current.position.copy(initialCameraPosition.current);
    controls.current.target.copy(initialControlsTarget.current);
  };

  const loadModel = (glbPath) => {
    if (!glbPath) return;

    const loader = new GLTFLoader();
    const xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setProgress(Math.floor(percentComplete));
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const arrayBuffer = xhr.response;
        loader.parse(arrayBuffer, "", (gltf) => {
          setProgress(100);
          applyMaterialSettings(gltf);
          scene.current.add(gltf.scene);
          setIsLoading(false);
        });
      } else {
        console.error("Erro ao carregar modelo GLB:", xhr.statusText);
      }
    };
    xhr.open("GET", glbPath, true);
    xhr.send();
  };

  const applyMaterialSettings = (gltf) => {
    gltf.scene.traverse((object) => {
      if (object.isMesh) {
        object.material.transparent = true;
        object.material.opacity = 0.5;
      }
    });
  };

  const onWindowResize = () => {
    camera.current.aspect = window.innerWidth / window.innerHeight;
    camera.current.updateProjectionMatrix();
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setPixelRatio(window.devicePixelRatio * 1.5);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    TWEEN.update();
    controls.current.autoRotateSpeed = 0.3 * (delta / (1 / 60));
    controls.current.update();
    renderer.current.render(scene.current, camera.current);
  };

  const disposeResources = () => {
    scene.current.children.forEach((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    renderer.current.dispose();
  };

  return (
    <div className="scene-container" ref={mount}>
      {isLoading && <LoadingScreen progress={progress} />}
    </div>
  );
}