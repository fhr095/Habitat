// LoadModel.jsx
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { openDB, getFromDB, saveToDB } from "../Cache/Cache";
import { materialProxySystem } from "../../SetupScene/MaterialProxySystem";

export default async function LoadModel(modelUrl, components, world, setArrayName) {
  try {
    console.log(`Iniciando o carregamento do modelo: ${modelUrl}`);

    const fileExtension = modelUrl.split('.').pop().split('?')[0].toLowerCase();
    console.log(`Extensão do arquivo detectada: ${fileExtension}`);

    if (fileExtension === 'ifc') {
      console.log("Carregando um modelo IFC...");
      return await loadModelWithCache(loadIfc, modelUrl, world, setArrayName, components);
    } else if (fileExtension === 'glb' || fileExtension === 'gltf') {
      console.log("Carregando um modelo GLB...");
      return await loadModelWithCache(loadGlb, modelUrl, world, setArrayName);
    } else {
      throw new Error("Formato de arquivo não suportado: " + fileExtension);
    }
  } catch (error) {
    console.error("Erro ao carregar o modelo:", error);
    throw error; // Repassa o erro para ser capturado na função chamadora
  }
}

async function loadModelWithCache(loaderFunction, modelUrl, world, setArrayName, components) {
  console.log(`Verificando cache para o modelo: ${modelUrl}`);

  const db = await openDB("ModelCache", 1);
  const cachedModel = await getFromDB(db, "models", modelUrl);
  if (cachedModel) {
    console.log("Modelo encontrado no cache. Carregando do cache...");
    const model = await loaderFunction(cachedModel, world, setArrayName, components);
    console.log("Modelo carregado do cache com sucesso.");
    return model;
  } else {
    console.log("Nenhum modelo encontrado no cache. Buscando modelo do servidor...");
    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error(`Falha ao buscar o modelo: ${response.statusText}`);
    }
    console.log("Modelo baixado com sucesso:", modelUrl);
    const buffer = await response.arrayBuffer();
    console.log("Modelo convertido para ArrayBuffer, tamanho:", buffer.byteLength);
    console.log("Modelo baixado. Carregando no mundo...");
    const model = await loaderFunction(buffer, world, setArrayName, components);
    console.log("Modelo carregado com sucesso. Salvando no cache...");
    await saveToDB(db, "models", modelUrl, buffer);
    return model;
  }
}

async function loadIfc(buffer, world, setArrayName, components) {
  console.log("Iniciando carregamento de modelo IFC...");

  const typedArray = new Uint8Array(buffer);
  const ifcLoader = components.get(OBC.IfcLoader);

  await ifcLoader.setup();
  console.log("IFC Loader configurado. Carregando modelo IFC...");

  const model = await ifcLoader.load(typedArray);
  world.scene.three.add(model);
  console.log("Modelo IFC adicionado à cena.");

  // Processamento adicional se necessário...

  return { scene: model }; // Retorna a cena do modelo
}

async function loadGlb(buffer, world, setArrayName) {
  console.log("Iniciando carregamento de modelo GLB...");

  const loader = new GLTFLoader();

  try {
    const gltf = await new Promise((resolve, reject) => {
      loader.parse(buffer, "", resolve, (error) => {
        console.error("Erro no parsing do GLB:", error);
        reject(error);
      });
    });

    console.log("GLB model carregado:", gltf);

    if (gltf.scene) {
      console.log("Adicionando modelo GLB à cena...");
      world.scene.add(gltf.scene);

      // Registra todos os materiais da cena diretamente no sistema de proxy
      console.log("Registrando materiais originais no sistema de proxy...");
      materialProxySystem.registerScene(gltf.scene);

      // Inicializando o status dos objetos carregados
      const initialStatus = {};

      // Inspeção dos objetos e camadas do modelo principal
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          // Preserva detalhes importantes do material original
          child.userData._originalMaterialInfo = {
            hasEmissive: !!child.material.emissive,
            hasMap: !!child.material.map,
            hasNormalMap: !!child.material.normalMap,
            hasMetalnessMap: !!child.material.metalnessMap,
            hasRoughnessMap: !!child.material.roughnessMap,
            isTransparent: child.material.transparent,
            opacity: child.material.opacity,
            metalness: child.material.metalness,
            roughness: child.material.roughness
          };

          let st = true;
          if (child.name === "Plane" || child.name === "Robo-Corpo") {
            st = false;
          }

          if (child.name === "Plane") {
            child.visible = false;
          }

          // Detecta elementos especiais como olhos, boca, etc.
          const isSpecialPart = child.name.toLowerCase().includes('olho') || 
                               child.name.toLowerCase().includes('eye') ||
                               child.name.toLowerCase().includes('boca') ||
                               child.name.toLowerCase().includes('mouth');
          
          // Armazena o status inicial de cada objeto, incluindo emissiveIntensity
          initialStatus[child.uuid] = {
            name: child.name,        // Nome original do objeto
            status: st,              // Define o status inicial
            emissiveIntensity: isSpecialPart ? 2.0 : 0.05,  // Valor diferente para olhos/boca
            oscillate: false,
            isSpecialPart: isSpecialPart // Indica se é uma parte especial
          };
        }
      });

      // Armazena o array de nomes dos objetos no estado, se necessário
      if (setArrayName) {
        setArrayName(
          gltf.scene.children.map((element) => ({
            name: element.name,
            element: element,
          }))
        );
      }

      // Verificar e capturar animações, se existirem
      let animations = [];
      if (gltf.animations && gltf.animations.length > 0) {
        console.log("Animações detectadas no modelo GLB:", gltf.animations.length);
        animations = gltf.animations;
      }

      console.log("Modelo GLB adicionado à cena com sucesso.");

      // Retorna a cena, as animações e o status inicial dos objetos
      return {
        scene: gltf.scene,
        animations: animations,  // Animações ficam acessíveis aqui
        initialStatus,           // Retorna o status inicial dos objetos para registro no contexto
      };
    } else {
      console.error("Nenhuma cena encontrada no modelo GLB.");
      throw new Error("Nenhuma cena encontrada.");
    }

  } catch (error) {
    console.error("Erro ao carregar o GLB:", error);
    throw error;
  }
}