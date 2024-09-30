import React, { useEffect, useRef } from "react";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";

export default function Scene({ ifcFileUrl, setFade }) {
  const testeRef = useRef();

  let components = new OBC.Components();
  let worlds = components.get(OBC.Worlds);
  let world = worlds.create();

  useEffect(() => {
    if (ifcFileUrl) {
      init();
    }
  }, [ifcFileUrl]);

  async function init() {
    components = new OBC.Components();
    worlds = components.get(OBC.Worlds);
    world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, testeRef.current);
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

  async function loadIfc(components, world) {
    const ifcLoader = components.get(OBC.IfcLoader);
    await ifcLoader.setup();
    const file = await fetch(ifcFileUrl);
    const buffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(buffer);
    const model = await ifcLoader.load(typedArray);
    world.scene.three.add(model);

    function rotate() {
      model.rotation.y += 0.0001;
    }

    world.renderer.onBeforeUpdate.add(rotate);

    const highlighter = components.get(OBF.Highlighter);
    highlighter.setup({ world });

    highlighter.events.select.onHighlight.add(async (fragmentIdMap) => {
      const properties = await fetchProperties(components, fragmentIdMap);

      const fragmentId = Object.keys(fragmentIdMap)[0];
      const expressIdSet = fragmentIdMap[fragmentId];
      const expressId = Array.from(expressIdSet)[0];
      const selectedProperty = properties.find(prop => prop.id === expressId);

      setFade({
        id: selectedProperty?.attributes?.Name?.value || "Unknown",
        name: selectedProperty?.attributes?.Name?.value || "Unknown"
      });
    });
  }

  async function fetchProperties(components, fragmentIdMap) {
    const indexer = components.get(OBC.IfcRelationsIndexer);
    const fragments = components.get(OBC.FragmentsManager);
    const properties = [];

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

        const elementRelations = indexer.relationMaps[model.uuid]?.get(expressID);
        if (elementRelations) {
          elementProps.relations = elementRelations;
        }

        properties.push(elementProps);
      }
    }

    return properties;
  }

  return <div ref={testeRef}></div>;
}