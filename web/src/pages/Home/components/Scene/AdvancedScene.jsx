import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { TWEEN } from "@tweenjs/tween.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { useHabitatUser } from "../../../../context/HabitatUserContext";

export default function AdvancedScene({ components, world, camera }) {
  const [labels, setLabels] = useState([]);
  const sceneRef = useRef(null);
  
  useEffect(() => {
    if (!sceneRef.current) {
      setupAdvancedScene();
    }
    return () => {
      // Limpeza de recursos
      labels.forEach(label => world.scene.three.remove(label));
      TWEEN.removeAll();
    };
  }, [components, world, camera]);

  const setupAdvancedScene = () => {
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    labelRenderer.domElement.style.pointerEvents = "none";
    sceneRef.current.appendChild(labelRenderer.domElement);

    world.renderer.add(labelRenderer);

    addInitialTags();
    animate();
  };

  const addInitialTags = () => {
    const tagDiv = document.createElement("div");
    tagDiv.className = "label";
    tagDiv.textContent = "Ponto de Interesse";
    const label = new CSS2DObject(tagDiv);
    label.position.set(10, 10, 10);  // Definir posição para o rótulo
    world.scene.three.add(label);
    setLabels([...labels, label]);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    TWEEN.update();
    camera.controls.update();
    world.renderer.render(world.scene.three, camera.three);
  };

  const focusOnObject = (objectName, duration = 2000) => {
    // Implementar lógica para focar em um objeto específico com animação
    const target = world.scene.three.getObjectByName(objectName);
    if (target) {
      const targetPosition = new THREE.Vector3();
      target.getWorldPosition(targetPosition);

      new TWEEN.Tween(camera.three.position)
        .to({ x: targetPosition.x + 10, y: targetPosition.y + 10, z: targetPosition.z + 10 }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => camera.controls.update())
        .start();
    }
  };

  return (
    <div ref={sceneRef} className="advanced-scene">
      {/* Botões ou outras interações poderiam ser adicionados aqui */}
    </div>
  );
}
