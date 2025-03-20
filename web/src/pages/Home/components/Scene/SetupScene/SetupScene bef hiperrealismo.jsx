// src/components/Scene/SetupScene/SetupScene.jsx
import * as OBC from "@thatopen/components";
import * as THREE from "three";

export default function SetupScene(containerRef, setCamera) {
  let components = new OBC.Components();
  let worlds = components.get(OBC.Worlds);
  let world = worlds.create();

  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBC.SimpleRenderer(components, containerRef.current);
  world.camera = new OBC.OrthoPerspectiveCamera(components);

  world.scene.setup();

  const controls = world.camera.controls;
  controls.setLookAt(10, 10, 10, 0, 0, 0);

  components.init(); // Inicia o sistema OBC, incluindo loop de render
  console.log("Câmera configurada:", world.camera);
console.log("Câmera atual (currentCamera):", world.camera.currentCamera);


  world.scene.three.background = null;

  // Define posição inicial da câmera se não houver uma definida
  if (!world.camera.position) {
    world.camera.position = new THREE.Vector3(10, 10, 10);
  }

  setCamera(world.camera);

  return { components, world, controls };
}
