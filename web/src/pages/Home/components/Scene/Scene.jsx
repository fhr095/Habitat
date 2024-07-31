import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import * as OBC from "@thatopen/components";
import "./Scene.scss";

export default function Scene({ ifcFileUrl, fade, setFade }) {
  const containerRef = useRef();
  let components = new OBC.Components();
  let worlds = components.get(OBC.Worlds);
  let world = worlds.create();

  useEffect(() => {
    if(ifcFileUrl){
      init();
    }
  }, [ifcFileUrl]);

  async function init(){
    components = new OBC.Components();
    worlds = components.get(OBC.Worlds);
    world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, containerRef.current);
    world.camera = new OBC.OrthoPerspectiveCamera(components);

    world.scene.setup();

    await world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);

    components.init();

    world.scene.three.background = null;

    world.camera.projection.onChanged.add(() => {
      const projection = world.camera.projection.current;
      grid.fade = projection === "Perspective";
    });

    loadIfc(components, world);
  }

  async function loadIfc(components, world){
    const ifcLoader = components.get(OBC.IfcLoader);
    await ifcLoader.setup();
    const file = await fetch(ifcFileUrl);
    const buffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(buffer);
    const model = await ifcLoader.load(typedArray);
    world.scene.three.add(model);

    function rotate(){
      model.rotation.y += 0.0001;
    }

    world.renderer.onBeforeUpdate.add(rotate);
  }


  return (
    <div ref={containerRef} className="scene">
      
    </div>
  );
}