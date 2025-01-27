// src/components/Scene/Scene.jsx
import React, { useState, useEffect, useRef } from "react";
import MiniMap from "../MiniMap/MiniMap";
import SetupScene from "./SetupScene/SetupScene";
import FadeEffect from "./FadeEffect/FadeEffect";
import Model from "./Model/Model";
import "./Scene.scss";
import { useSceneData } from "../../../../context/SceneDataContext";
import * as OBC from "@thatopen/components";
import TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";

export default function Scene({ habitatId, mainFileUrl, mobileFileUrl, fade = "", address }) {
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [modelUrl, setModelUrl] = useState("");
  const containerRef = useRef();
  const [components, setComponents] = useState(null);
  const [world, setWorld] = useState(null);
  const [camera, setCamera] = useState(null);
  const [controls, setControls] = useState(null);

  const { fadeOptions, registerHighlightFade } = useSceneData();

  const originalMaterials = useRef(new Map());

  // Registra highlightFade quando world, camera e controls estiverem prontos
  useEffect(() => {
    if (world && camera && controls) {
      console.log("Registrando highlightFade no contexto");
      registerHighlightFade(highlightFade);
    } else {
      console.log("Aguardando world, camera e controls para registrar highlightFade");
    }
  }, [world, camera, controls, registerHighlightFade]);

  // Determina a URL do modelo (main ou mobile) e inicializa a cena via SetupScene
  useEffect(() => {
    if (mainFileUrl || mobileFileUrl) {
      const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
      const selectedUrl = isMobileDevice ? mobileFileUrl : mainFileUrl;
      //setModelUrl(selectedUrl);
      //modelo hardcoded
      setModelUrl('https://firebasestorage.googleapis.com/v0/b/habitat-8e75e.appspot.com/o/habitats%2Fteste2.glb?alt=media&token=8df87f1a-63a7-47f3-84ec-4b4246d31cb1');
      console.log("ModelURL1", selectedUrl);
      setIsValidUrl(true);

      const { components: sceneComponents, world: sceneWorld, controls: orbitControls } = SetupScene(containerRef, setCamera);
      setComponents(sceneComponents);
      setWorld(sceneWorld);
      setControls(orbitControls);
    } else {
      setIsValidUrl(false);
    }
  }, [habitatId, mainFileUrl, mobileFileUrl]);

  // Aplica efeito de fade inicial se houver
  useEffect(() => {
    if (camera && fadeOptions.length > 0 && fade) {
      FadeEffect(fade, fadeOptions, camera);
    }
  }, [fade, fadeOptions, camera]);

  // Integra o TWEEN com o loop do OBC, atualizando animações antes de cada frame
  useEffect(() => {
    if (world && world.renderer) {
      world.renderer.onBeforeUpdate.add(() => TWEEN.update());
    }
  }, [world]);

  const restoreOriginalMaterials = () => {
    originalMaterials.current.forEach((orig, child) => {
      if (child.isMesh) {
        child.material.dispose();
        child.material = orig.material;
        child.material.opacity = orig.opacity;
        child.material.depthWrite = orig.depthWrite;
        child.material.transparent = orig.transparent;
        child.material.needsUpdate = true;
      }
    });
    originalMaterials.current.clear();
  };

  const highlightFade = async (fadeId) => {
    console.log("highlightFade chamado com:", fadeId);
  
    if (!world || !world.scene || !camera || !camera.projection || !controls) {
      console.error("world, scene, camera, projection ou controls não definidos.");
      return;
    }
  
    const activeCamera = camera.projection.camera; // Obtemos a câmera ativa
    if (!activeCamera || !activeCamera.position) {
      console.error("Câmera ativa ou sua posição não está definida:", activeCamera);
      return;
    }
  
    const scene = world.scene.three;
    console.log("Cena definida, iniciando destaque...");
    restoreOriginalMaterials();
    console.log("Materiais restaurados, tornando tudo transparente...");
  
    // Tornar toda a cena semitransparente
    scene.traverse((child) => {
      if (child.isMesh) {
        if (!originalMaterials.current.has(child)) {
          originalMaterials.current.set(child, {
            material: child.material,
            opacity: child.material.opacity,
            depthWrite: child.material.depthWrite,
            transparent: child.material.transparent,
          });
        }
        child.material = child.material.clone();
        child.material.opacity = 0.1;
        child.material.transparent = true;
        child.material.depthWrite = false;
        child.material.needsUpdate = true;
      }
    });
  
    const normalizedTarget = fadeId.trim().replace(/[\s_]+/g, "_").toLowerCase();
    const targetMeshes = [];
  
    scene.traverse((child) => {
      const normalizedName = child.name.trim().replace(/[\s_]+/g, "_").toLowerCase();
      if (normalizedName.includes(normalizedTarget)) {
        targetMeshes.push(child);
        if (child.isMesh) {
          child.material.opacity = 1;
          child.material.transparent = false;
          child.material.depthWrite = true;
          child.material.needsUpdate = true;
        } else if (child.isGroup) {
          child.traverse((groupChild) => {
            if (groupChild.isMesh) {
              groupChild.material.opacity = 1;
              groupChild.material.transparent = false;
              groupChild.material.depthWrite = true;
              groupChild.material.needsUpdate = true;
            }
          });
        }
      }
    });
  
    console.log("Objetos encontrados para o fadeId:", targetMeshes);
  
    if (targetMeshes.length > 0) {
      const boundingBox = new THREE.Box3();
      targetMeshes.forEach((mesh) => boundingBox.expandByObject(mesh));
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());
  
      if (size.length() === 0) {
        console.warn(`Objeto com fadeId "${fadeId}" encontrado, mas não possui tamanho válido.`);
        restoreOriginalMaterials();
        return;
      }
  
      console.log("Center calculado:", center);
      console.log("Size calculado:", size);
  
      const maxDim = Math.max(size.x, size.y, size.z);
  
      let cameraZ;
      const isPerspective = activeCamera.isPerspectiveCamera;
      const isOrthographic = activeCamera.isOrthographicCamera;
  
      if (isPerspective) {
        const fov = activeCamera.fov || 50;
        const aspect = activeCamera.aspect || 1;
        cameraZ = maxDim / (2 * Math.tan((fov * Math.PI) / 360));
        cameraZ = cameraZ / Math.min(1, aspect);
      } else if (isOrthographic) {
        cameraZ = maxDim * 1.5;
      }
  
      const newCameraPosition = new THREE.Vector3(
        center.x + cameraZ,
        center.y + cameraZ * 0.5,
        center.z + cameraZ
      );
  
      console.log("Movendo a câmera para:", newCameraPosition);
  
      return new Promise((resolve) => {
        const tween = new TWEEN.Tween(activeCamera.position)
          .to({ x: newCameraPosition.x, y: newCameraPosition.y, z: newCameraPosition.z }, 1500)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(() => {
            const camPos = activeCamera.position;
            controls.setLookAt(camPos.x, camPos.y, camPos.z, center.x, center.y, center.z);
            controls.update();
          })
          .onComplete(() => {
            resolve();
          });
  
        tween.start();
      });
    } else {
      console.warn(`Nenhum objeto encontrado para o fadeId: "${fadeId}".`);
      restoreOriginalMaterials();
    }
  };  
  

  return (
    <div ref={containerRef} className="scene">
      {isValidUrl && components && world && (
        <Model modelUrl={modelUrl} components={components} world={world} />
      )}
      {address && <MiniMap address={address} />}
    </div>
  );
}
