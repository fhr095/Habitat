import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { openDB, getFromDB, saveToDB } from "../Cache/Cache";
import * as OBC from "@thatopen/components";

export default async function LoadModel(modelUrl, components, world) {
  try {
    const fileExtension = modelUrl.split('.').pop().split('?')[0].toLowerCase();

    if (fileExtension === 'ifc') {
      return await loadModelWithCache(loadIfc, modelUrl, world, components);
    } else if (fileExtension === 'glb') {
      return await loadModelWithCache(loadGlb, modelUrl, world);
    } else {
      throw new Error("Formato de arquivo não suportado: " + fileExtension);
    }
  } catch (error) {
    console.error("Erro ao carregar o modelo:", error);
    return [];
  }
}

async function loadModelWithCache(loaderFunction, modelUrl, world, components) {
  const db = await openDB("ModelCache", 1);
  const cachedModel = await getFromDB(db, "models", modelUrl);

  if (cachedModel) {
    const arrayData = await loaderFunction(cachedModel, world, components);
    return arrayData;
  } else {
    const file = await fetch(modelUrl);
    const buffer = await file.arrayBuffer();
    const arrayData = await loaderFunction(buffer, world, components);
    await saveToDB(db, "models", modelUrl, buffer);
    return arrayData;
  }
}

async function loadIfc(buffer, world, components) {
  const typedArray = new Uint8Array(buffer);
  const ifcLoader = components.get(OBC.IfcLoader);
  await ifcLoader.setup();
  const model = await ifcLoader.load(typedArray);
  world.scene.three.add(model);

  const arrayData = await IfcModelProcessor({ components, model });
  return arrayData;
}

async function loadGlb(buffer, world) {
  const loader = new GLTFLoader();
  const model = await new Promise((resolve, reject) => {
    loader.parse(buffer, "", resolve, reject);
  });
  world.scene.three.add(model.scene);

  const arrayData = model.scene.children.map((element) => ({
    id: element.name,
    name: element.name,
  }));

  return arrayData;
}

async function IfcModelProcessor({ components, model }) {
  return model.children.map((child) => ({
    id: child.name,
    name: child.name,
  }));
}
