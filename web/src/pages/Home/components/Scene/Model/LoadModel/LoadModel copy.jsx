import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { openDB, getFromDB, saveToDB } from "../Cache/Cache";
import * as OBC from "@thatopen/components";

export default async function LoadModel(modelUrl, components, world, setArrayName) {
  try {
    const fileExtension = modelUrl.split('.').pop().split('?')[0].toLowerCase();

    if (fileExtension === 'ifc') {
      const model = await loadIfc(modelUrl, components, world, setArrayName);
    } else if (fileExtension === 'glb') {
      await loadGlb(modelUrl, world, setArrayName);
    } else {
      console.error("Formato de arquivo não suportado: " + fileExtension);
    }
  } catch (error) {
    console.error("Erro ao carregar o modelo:", error);
  }
}

async function loadIfc(ifcFileUrl, components, world, setArrayName) {
  const db = await openDB("ModelCache", 1);
  const cachedModel = await getFromDB(db, "models", ifcFileUrl);

  if (cachedModel) {
    console.log("Carregando modelo IFC a partir do cache");
    const typedArray = new Uint8Array(cachedModel);
    const ifcLoader = components.get(OBC.IfcLoader);
    await ifcLoader.setup();
    const model = await ifcLoader.load(typedArray);
    world.scene.three.add(model);

    const arrayData = await IfcModelProcessor({ components, model });
    setArrayName(arrayData);
  } else {
    console.log("Carregando modelo IFC a partir do servidor");

    const ifcLoader = components.get(OBC.IfcLoader);
    await ifcLoader.setup();

    const file = await fetch(ifcFileUrl);
    const buffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(buffer);
    const model = await ifcLoader.load(typedArray);

    world.scene.three.add(model);

    const arrayData = await IfcModelProcessor({ components, model });
    setArrayName(arrayData);

    await saveToDB(db, "models", ifcFileUrl, buffer);
  }
}

async function loadGlb(glbFileUrl, world, setArrayName) {
  const loader = new GLTFLoader();
  const db = await openDB("ModelCache", 1);
  const cachedModel = await getFromDB(db, "models", glbFileUrl);

  if (cachedModel) {
    console.log("Carregando modelo GLB a partir do cache");
    loader.parse(cachedModel, "", (gltf) => {
      world.scene.three.add(gltf.scene);
      setArrayName(gltf.scene.children.map((element) => ({
        name: element.name,
        element: element,
      })));
    });
  } else {
    console.log("Carregando modelo GLB a partir do servidor");

    const file = await fetch(glbFileUrl);
    const buffer = await file.arrayBuffer();
    loader.parse(buffer, "", async (gltf) => {
      world.scene.three.add(gltf.scene);
      setArrayName(gltf.scene.children.map((element) => ({
        name: element.name,
        element: element,
      })));
      await saveToDB(db, "models", glbFileUrl, buffer);
    });
  }
}
