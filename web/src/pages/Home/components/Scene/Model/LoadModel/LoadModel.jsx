// src/components/Scene/Model/LoadModel/LoadModel.jsx
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { openDB, getFromDB, saveToDB } from "../Cache/Cache";
import * as OBC from "@thatopen/components";
import * as THREE from "three";

// Converte um material antigo para MeshStandardMaterial com parâmetros realistas e brilhantes
function convertToStandardMaterial(oldMat) {
  // Se já for MeshStandardMaterial, ajuste os parâmetros
  if (oldMat instanceof THREE.MeshStandardMaterial) {
    oldMat.metalness = 0.7;
    oldMat.roughness = 0.3;
    oldMat.envMapIntensity = 3.0;
    return oldMat;
  }
  const newMat = new THREE.MeshStandardMaterial({
    color: oldMat.color || new THREE.Color(0xffffff),
    map: oldMat.map || null,
    metalness: 0.7,         // Valor elevado para simular brilho
    roughness: 0.3,         // Menor roughness para reflexos nítidos
    transparent: oldMat.transparent,
    opacity: oldMat.opacity !== undefined ? oldMat.opacity : 1,
    side: oldMat.side,
    envMapIntensity: 3.0,   // Intensifica os reflexos do HDR
  });
  if (oldMat.normalMap) newMat.normalMap = oldMat.normalMap;
  if (oldMat.roughnessMap) newMat.roughnessMap = oldMat.roughnessMap;
  if (oldMat.metalnessMap) newMat.metalnessMap = oldMat.metalnessMap;
  if (oldMat.emissiveMap) newMat.emissiveMap = oldMat.emissiveMap;
  if (oldMat.alphaMap) newMat.alphaMap = oldMat.alphaMap;
  return newMat;
}

// Percorre a hierarquia do objeto e converte os materiais para o padrão PBR realista
function applyRealisticMaterials(object3D) {
  object3D.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material = child.material.map(mat => convertToStandardMaterial(mat));
      } else {
        child.material = convertToStandardMaterial(child.material);
      }
      child.material.needsUpdate = true;
    }
  });
}

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
  
  // Converte os materiais para o padrão PBR agressivo
  applyRealisticMaterials(model);
  
  world.scene.three.add(model);
  const arrayData = await IfcModelProcessor({ components, model });
  return arrayData;
}

async function loadGlb(buffer, world) {
  const loader = new GLTFLoader();
  const model = await new Promise((resolve, reject) => {
    loader.parse(buffer, "", resolve, reject);
  });
  
  // Aplica a conversão dos materiais para um padrão realista no modelo GLB
  applyRealisticMaterials(model.scene);
  
  world.scene.three.add(model.scene);
  const arrayData = model.scene.children.map(element => ({
    id: element.name,
    name: element.name,
  }));
  return arrayData;
}

async function IfcModelProcessor({ components, model }) {
  return model.children.map((child, index) => {
    const id = child.name || `obj_${index}`;
    const name = child.name || `Objeto sem nome ${index + 1}`;
    return { id, name };
  });
}
