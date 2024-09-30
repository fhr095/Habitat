import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { openDB, getFromDB, saveToDB } from "../Cache/Cache";
import { applyMaterialSettings } from '../../SetupScene/SetupScene'; // Ajuste o caminho conforme necessário

import * as OBC from "@thatopen/components";

export default async function LoadModel(modelUrl, components, world, setArrayName) {
  try {
    const fileExtension = modelUrl.split('.').pop().split('?')[0].toLowerCase();

    if (fileExtension === 'ifc') {
      return await loadModelWithCache(loadIfc, modelUrl, world, setArrayName, components);
    } else if (fileExtension === 'glb') {
      return await loadModelWithCache(loadGlb, modelUrl, world, setArrayName);
    } else {
      throw new Error("Formato de arquivo não suportado: " + fileExtension);
    }
  } catch (error) {
    console.error("Erro ao carregar o modelo:", error);
  }
}

async function loadModelWithCache(loaderFunction, modelUrl, world, setArrayName, components) {
  const db = await openDB("ModelCache", 1);
  const cachedModel = await getFromDB(db, "models", modelUrl);

  if (cachedModel) {
    const model = await loaderFunction(cachedModel, world, setArrayName, components);
    return model;
  } else {
    const file = await fetch(modelUrl);
    const buffer = await file.arrayBuffer();
    const model = await loaderFunction(buffer, world, setArrayName, components);
    await saveToDB(db, "models", modelUrl, buffer);
    return model;
  }
}

async function loadIfc(buffer, world, setArrayName, components) {
  const typedArray = new Uint8Array(buffer);
  const ifcLoader = components.get(OBC.IfcLoader);
  await ifcLoader.setup();
  const model = await ifcLoader.load(typedArray);
  world.scene.three.add(model);

  const arrayData = await IfcModelProcessor({ components, model });
  setArrayName(arrayData);
  return model;
}

async function loadGlb(buffer, world, setArrayName) {
  const loader = new GLTFLoader();
  const model = await new Promise((resolve, reject) => {
    loader.parse(buffer, "", resolve, reject);
  });

  if (model.scene) {
    world.scene.three.add(model.scene);
        // Aplicar configurações de materiais (transparência) após adicionar o modelo à cena
    //applyMaterialSettings(model.scene);
    setArrayName(
      model.scene.children.map((element) => ({
        name: element.name,
        element: element,
      }))
    );
  } else {
    console.error("Nenhuma cena encontrada no modelo GLB.");
  }

  return model.scene;
}


