import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";

import Avatar from "./Avatar";

import "./Model.scss";

export default function Model({ ifcFileUrl, fade }) {
  const containerRef = useRef();
  const [camera, setCamera] = useState(null);
  const [arrayName, setArrayName] = useState([]);
  const originalMaterials = useRef(new Map());
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0 });

  let components = new OBC.Components();
  let worlds = components.get(OBC.Worlds);
  let world = worlds.create();

  useEffect(() => {
    if (ifcFileUrl) {
      init();
    }
  }, [ifcFileUrl]);

  useEffect(() => {
    if (fade.length > 0 && arrayName.length > 0 && camera) {
      const applyFadeEffect = (index) => {
        if (index >= fade.length) {
          arrayName.forEach((object) => {
            if (object.element.isMesh) {
              object.element.material = originalMaterials.current.get(object.element);
            }
          });
          return;
        }

        const fadeElement = fade[index];
        arrayName.forEach((object) => {
          if (object.element.isMesh) {
            const originalMaterial = originalMaterials.current.get(object.element);
            if (!originalMaterial) {
              originalMaterials.current.set(object.element, object.element.material);
            }

            if (object.name === fadeElement.fade) {
              object.element.material = new THREE.MeshStandardMaterial({ color: "#ff0000" });

              const box = new THREE.Box3().setFromObject(object.element);
              const center = new THREE.Vector3();
              box.getCenter(center);
              camera.fit([object.element], 0.5);

              setTimeout(() => {
                center.project(camera.three);

                const widthHalf = window.innerWidth / 2;
                const heightHalf = window.innerHeight / 2;

                const calculatedPosition = {
                  x: center.x * widthHalf + widthHalf,
                  y: -(center.y * heightHalf) + heightHalf,
                };

                setScreenPosition(calculatedPosition);
              }, 1000);

              setTimeout(() => {
                object.element.material = originalMaterials.current.get(object.element);
                camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
                setScreenPosition({ x: 0, y: 0 });
                applyFadeEffect(index + 1);
              }, fadeElement.duration * 1000);
            } else {
              object.element.material = new THREE.MeshStandardMaterial({
                opacity: 0.1,
                transparent: true,
              });
              setTimeout(() => {
                object.element.material = originalMaterials.current.get(object.element);
              }, fadeElement.duration * 1000);
            }
          }
        });
      };

      applyFadeEffect(0);
    }
  }, [fade, arrayName, camera]);

  async function init() {
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
        element: element,
      });
    }

    setArrayName(arrayData);
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
      {screenPosition.x !== 0 && screenPosition.y !== 0 && (
        <Avatar position={screenPosition} />
      )}
    </div>
  );
}