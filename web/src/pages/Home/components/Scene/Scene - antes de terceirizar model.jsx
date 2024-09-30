//home mode
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as OBC from "@thatopen/components";
import MiniMap from "../MiniMap/MiniMap";
import "./Scene.scss";

export default function Scene({ mainFileUrl, mobileFileUrl, fade, address }) {
  const containerRef = useRef();
  const [camera, setCamera] = useState(null);
  const [arrayName, setArrayName] = useState([]);

  let components = new OBC.Components();
  let worlds = components.get(OBC.Worlds);
  let world = worlds.create();

  useEffect(() => {
    console.log("Scene useEffect - Verificando URLs");
    console.log("mainFileUrl:", mainFileUrl);
    console.log("mobileFileUrl:", mobileFileUrl);

    if (mainFileUrl || mobileFileUrl) {
      console.log("URLs válidas encontradas, inicializando a cena...");
      initScene();
    } else {
      console.error("Nenhuma URL de arquivo válida foi fornecida.");
    }
  }, [mainFileUrl, mobileFileUrl]);

  useEffect(() => {
    console.log("Scene useEffect - Verificando efeito de fade");
    console.log("Fade:", fade);
    console.log("arrayName:", arrayName);

    if (fade !== "" && arrayName.length > 0) {
      console.log("Aplicando efeito de fade:", fade);
      handleFadeEffect(fade);
    } else {
      console.log("arrayName não está definido ou está vazio");
    }
  }, [fade]);

  async function initScene() {
    try {
      console.log("Inicializando a cena...");
      components = new OBC.Components();
      worlds = components.get(OBC.Worlds);
      world = worlds.create();

      world.scene = new OBC.SimpleScene(components);
      world.renderer = new OBC.SimpleRenderer(components, containerRef.current);
      world.camera = new OBC.OrthoPerspectiveCamera(components);

      console.log("Componentes OBC inicializados");

      world.scene.setup();
      await world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);

      components.init();
      world.scene.three.background = null;

      world.camera.projection.onChanged.add(() => {
        const projection = world.camera.projection.current;
        console.log("Mudança na projeção da câmera:", projection);
      });

      setCamera(world.camera);

      console.log("Cena configurada com sucesso. Iniciando carregamento do modelo...");
      await loadModel(components, world);
      console.log("Modelo carregado com sucesso.");
    } catch (error) {
      console.error("Erro durante a inicialização da cena:", error);
    }
  }

  async function loadModel(components, world) {
    try {
      console.log("Verificando dispositivo móvel e URL do modelo...");
      const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
      console.log("Dispositivo móvel:", isMobileDevice);

      const modelUrl = isMobileDevice ? mobileFileUrl : mainFileUrl;
      console.log("URL do modelo selecionado:", modelUrl);

      if (modelUrl) {
        const fileExtension = modelUrl.split('.').pop().split('?')[0].toLowerCase();
        console.log("Extensão do arquivo:", fileExtension);

        if (fileExtension === 'ifc') {
          console.log("Carregando arquivo IFC:", modelUrl);
          await loadIfc(components, world, modelUrl);
        } else if (fileExtension === 'glb') {
          console.log("Carregando arquivo GLB:", modelUrl);
          await loadGlb(world, modelUrl);
        } else {
          throw new Error("Formato de arquivo não suportado: " + fileExtension);
        }
      } else {
        throw new Error("Nenhuma URL de modelo válida foi fornecida.");
      }
    } catch (error) {
      console.error("Erro ao carregar o modelo:", error);
    }
  }

  async function loadIfc(components, world, ifcFileUrl) {
    try {
      console.log("Carregando arquivo IFC:", ifcFileUrl);
      const ifcLoader = components.get(OBC.IfcLoader);
      await ifcLoader.setup();

      console.log("IFC Loader configurado");
      const file = await fetch(ifcFileUrl);
      const buffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(buffer);
      const model = await ifcLoader.load(typedArray);

      console.log("Modelo IFC carregado, adicionando à cena");
      world.scene.three.add(model);

      const arrayData = await processIfcModel(components, model);
      setArrayName(arrayData);
      console.log("Dados do modelo IFC processados:", arrayData);
    } catch (error) {
      console.error("Erro ao carregar arquivo IFC:", error);
    }
  }

  async function loadGlb(world, glbFileUrl) {
    try {
      console.log("Carregando arquivo GLB:", glbFileUrl);
      const loader = new GLTFLoader();
      const file = await fetch(glbFileUrl);
      const buffer = await file.arrayBuffer();
      const model = await loader.parseAsync(buffer, "");

      console.log("Modelo GLB carregado, adicionando à cena");
      world.scene.three.add(model.scene);

      const arrayData = model.scene.children.map((element) => ({
        name: element.name,
        element: element,
      }));

      setArrayName(arrayData);
      console.log("Dados do modelo GLB processados:", arrayData);
    } catch (error) {
      console.error("Erro ao carregar arquivo GLB:", error);
    }
  }

  function handleFadeEffect(fade) {
    console.log("Aplicando efeito de fade em arrayName:", arrayName);

    arrayName.forEach((object) => {
      if (object.element.isMesh) {
        const originalMaterial = object.element.material;
        if (object.name === fade) {
          object.element.material = new THREE.MeshStandardMaterial({ color: "#ff0000" });
          camera.fit([object.element], 0.5);
          setTimeout(() => {
            camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
            object.element.material = originalMaterial;
          }, 10000);
        } else {
          object.element.material = new THREE.MeshStandardMaterial({
            opacity: 0.1,
            transparent: true,
          });
          setTimeout(() => {
            object.element.material = originalMaterial;
          }, 10000);
        }
      }
    });
  }

  async function processIfcModel(components, model) {
    console.log("Processando modelo IFC para obter propriedades");
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

    console.log("Propriedades do modelo processadas:", arrayData);
    return arrayData;
  }

  async function fetchProperties(components, fragmentIdMap) {
    console.log("Obtendo propriedades do modelo IFC");
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
        console.log("Propriedades do elemento obtidas:", elementProps);
      }
    }

    return properties;
  }

  return (
    <div ref={containerRef} className="scene">
      {address && <MiniMap address={address} />}
    </div>
  );
}
