import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";

import "./Model.scss";

export default function Model({ ifcFileUrl, fade, avt }) {
  const containerRef = useRef();
  // const [children, setChildren] = useState([]);
  const [camera, setCamera] = useState(null);
  const [arrayName, setArrayName] = useState([])

  let components = new OBC.Components();
  let worlds = components.get(OBC.Worlds);
  let world = worlds.create();

  useEffect(() => {
    if(ifcFileUrl){
      init();
    }
  }, [ifcFileUrl]);

  useEffect(() => {
    if(fade.length > 0 && arrayName){
      arrayName.map((obejct) => {
        if(obejct.element.isMesh){
          const originalMaterial = obejct.element.material;
          if(obejct.name == fade[0].fade){
            obejct.element.material = new THREE.MeshStandardMaterial({ color: "#ff0000" });
            console.log("teste")
            camera.fit([obejct.element], 0.5);
            setTimeout(() => {
              camera.controls.setLookAt(10, 10, 10, 0, 0, 0)
              obejct.element.material = originalMaterial;
            }, fade[0].duration * 1000);
          }else{
            obejct.element.material = new THREE.MeshStandardMaterial({ 
              opacity: 0.1,
              transparent: true,
            });
            setTimeout(() => {
              obejct.element.material = originalMaterial;
            }, fade[0].duration * 1000);
          }
        }
      });
    }
  }, [fade]);

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

    setCamera(world.camera);

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

    const arrayData = [];

    for (const element of model.children) {
      const idsSet = element.fragment.ids;
      const fragmentIdMap = {};
      idsSet.forEach((id) => {
        if (!fragmentIdMap[element.fragment.id]) {
          fragmentIdMap[element.fragment.id] = new Set();
        }
        fragmentIdMap[element.fragment.id].add(id);
      });
      const properties = await fetchProperties(components, fragmentIdMap);

      arrayData.push({
        name: properties[Array.from(idsSet)[0]].attributes.Name.value,
        element: element
      });
    }

    setArrayName(arrayData)
  }

  async function fetchProperties(components, fragmentIdMap) {
    const indexer = components.get(OBC.IfcRelationsIndexer);
    const fragments = components.get(OBC.FragmentsManager);
    const properties = {};

    for (const fragID in fragmentIdMap) {
      const fragment = fragments.list.get(fragID);
      if (!(fragment && fragment.group)) continue;
      const model = fragment.group;

      for (const expressID of fragmentIdMap[fragID]) {
        const elementAttrs = await model.getProperties(expressID);
        if (!elementAttrs) continue;

        const elementProps = {
          id: expressID,
          attributes: elementAttrs,
        };

        const elementRelations =
          indexer.relationMaps[model.uuid]?.get(expressID);
        if (elementRelations) {
          elementProps.relations = elementRelations;
        }

        properties[expressID] = elementProps;
      }
    }

    return properties;
  }

  return (
    <div ref={containerRef} className="model-container">
      
    </div>
  );
}