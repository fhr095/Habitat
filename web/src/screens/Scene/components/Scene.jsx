import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import axios from "axios";
import TWEEN from "@tweenjs/tween.js";
import "../styles/SceneScreen.scss";

export default function Scene({ glbPath, habitatId, transcript, setResponse, fade, resetTrigger }) {
  const mountRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const modelRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Fundo transparente para a cena carregada
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controlsRef.current = controls;

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
        const model = gltf.scene;
        scene.add(model);
        model.rotation.y = Math.PI;
        camera.position.set(0, 10, 50);
        camera.lookAt(model.position);
        modelRef.current = model;

        const animate = function () {
          if (!isMounted) return;
          requestAnimationFrame(animate);
          TWEEN.update();
          model.rotation.y += 0.001; // Ajustar velocidade de rotação
          controls.update();
          renderer.render(scene, camera);
        };
        animate();
        setLoadingProgress(100); // Define o progresso de carregamento para 100% ao terminar
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          setLoadingProgress(Math.round(percentComplete));
        }
      },
      (error) => {
        console.error("Erro ao carregar o modelo GLB:", error);
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
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [glbPath]);

  useEffect(() => {
    if (transcript && habitatId && modelRef.current) {
      const sendMessageToAI = async () => {
        try {
          const response = await axios.post("https://roko.flowfuse.cloud/talkwithifc", {
            msg: transcript,
            avt: habitatId
          });

          const { comandos } = response.data; // Supondo que 'comandos' seja um array de objetos

          if (comandos && comandos.length > 0) {
            setResponse(comandos); // Passar o array inteiro para o componente Response
          }
        } catch (error) {
          console.error("Erro ao comunicar com a IA:", error);
        }
      };

      sendMessageToAI();
    }
  }, [transcript, habitatId]);

  useEffect(() => {
    if (modelRef.current && resetTrigger) {
      const originalPosition = { x: 0, y: 10, z: 50 };
      new TWEEN.Tween(cameraRef.current.position)
        .to(originalPosition, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          cameraRef.current.lookAt(new THREE.Vector3(0, 0, 0));
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        })
        .start();
    }
  }, [resetTrigger]);

  useEffect(() => {
    if (fade) {
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          child.material.transparent = true;
          child.material.opacity = child.name === fade ? 1 : 0.1;
        }
      });

      const selectedObject = modelRef.current.getObjectByName(fade);
      if (selectedObject) {
        const box = new THREE.Box3().setFromObject(selectedObject);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const distance = Math.max(size.x, size.y, size.z) * 2;
        const targetPosition = center.clone().add(new THREE.Vector3(0, 0, distance));

        new TWEEN.Tween(cameraRef.current.position)
          .to({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }, 2000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(() => {
            cameraRef.current.lookAt(center);
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
          })
          .start();
      }
    }
  }, [fade]);

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