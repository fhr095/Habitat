import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { openDB, getFromDB, saveToDB } from "../Cache/Cache";

export default async function LoadModel(modelUrl, components, world, setArrayName) {
  try {
    console.log(`Iniciando o carregamento do modelo: ${modelUrl}`);
    
    const fileExtension = modelUrl.split('.').pop().split('?')[0].toLowerCase();
    console.log(`Extensão do arquivo detectada: ${fileExtension}`);
    
    if (fileExtension === 'ifc') {
      console.log("Carregando um modelo IFC...");
      return await loadModelWithCache(loadIfc, modelUrl, world, setArrayName, components);
    } else if (fileExtension === 'glb') {
      console.log("Carregando um modelo GLB...");
      return await loadModelWithCache(loadGlb, modelUrl, world, setArrayName);
    } else {
      throw new Error("Formato de arquivo não suportado: " + fileExtension);
    }
  } catch (error) {
    console.error("Erro ao carregar o modelo:", error);
  }
}

async function loadModelWithCache(loaderFunction, modelUrl, world, setArrayName, components) {
  console.log(`Verificando cache para o modelo: ${modelUrl}`);
  
  const db = await openDB("ModelCache", 1);
  const cachedModel = await getFromDB(db, "models", modelUrl);
  console.log("cachedModel é:", cachedModel);
  if (cachedModel) {
    console.log("Modelo encontrado no cache. Carregando do cache...");
    const model = await loaderFunction(cachedModel, world, setArrayName, components);
    console.log("Modelo carregado do cache com sucesso.");
    return model;
  } else {
    console.log("Nenhum modelo encontrado no cache. Buscando modelo do servidor...");
    const file = await fetch(modelUrl);
    if (!file.ok) {
      throw new Error(`Falha ao buscar o modelo: ${file.statusText}`);
    }
    console.log("Modelo baixado com sucesso:", modelUrl);
    const buffer = await file.arrayBuffer();
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

  const arrayData = await IfcModelProcessor({ components, model });
  setArrayName(arrayData);
  
  console.log("Processamento IFC concluído.");
  return model;
}

/*async function loadGlb(buffer, world, setArrayName) {
  console.log("Iniciando carregamento de modelo GLB...");

  const loader = new GLTFLoader();
  try {
    const model = await new Promise((resolve, reject) => {
      loader.parse(buffer, "", resolve, (error) => {
        console.error("Erro no parsing do GLB:", error);
        reject(error);
      });
    });

    console.log("GLB model carregado:", model);

    if (model.scene) {
      console.log("Adicionando modelo GLB à cena...");
      world.scene.add(model.scene);

      // Inspeção dos objetos e camadas do modelo principal
      model.scene.traverse((child) => {
        if (child.isMesh) {
          console.log(`Objeto da cena principal ${child.name} está na camada: ${child.layers.mask}`);
        }
      });

      setArrayName(
        model.scene.children.map((element) => ({
          name: element.name,
          element: element,
        }))
      );

      // Verificar e capturar animações, se existirem
      let animations = [];
      if (model.animations && model.animations.length > 0) {
        console.log("Animações detectadas no modelo GLB:", model.animations.length);
        animations = model.animations;
      }

      console.log("Modelo GLB adicionado à cena com sucesso.");
      
      // Retorna tanto a cena quanto as animações (se houver)
      return {
        scene: model.scene,
        animations: animations // Animações ficam acessíveis aqui
      };
    } else {
      console.error("Nenhuma cena encontrada no modelo GLB.");
      throw new Error("Nenhuma cena encontrada.");
    }

  } catch (error) {
    console.error("Erro ao carregar o GLB:", error);
  }
}*/


/*async function loadGlb(buffer, world, setArrayName) {
  console.log("Iniciando carregamento de modelo GLB...");

  const loader = new GLTFLoader();

  try {
    const model = await new Promise((resolve, reject) => {
      loader.parse(buffer, "", resolve, (error) => {
        console.error("Erro no parsing do GLB:", error);
        reject(error);
      });
    });

    console.log("GLB model carregado:", model);

    if (model.scene) {
      console.log("Adicionando modelo GLB à cena...");
      world.scene.add(model.scene);

      // Inicializando o status dos objetos carregados
      const initialStatus = {};

      // Inspeção dos objetos e camadas do modelo principal
      model.scene.traverse((child) => {
        if (child.isMesh) {
          console.log(`Objeto da cena principal ${child.name} está na camada: ${child.layers.mask}`);

          let st = true;
          if(child.name === "Plane" || child.name === "Robo-Corpo"){
            st=false;
          }
          
          // Armazena o status inicial de cada objeto
          initialStatus[child.uuid] = {
            name: child.name,  // Nome original do objeto
            status: st,     // Define false por padrão (ou outro valor)
          };
        }
      });

      // Armazena o array de nomes dos objetos no estado
      setArrayName(
        model.scene.children.map((element) => ({
          name: element.name,
          element: element,
        }))
      );

      // Verificar e capturar animações, se existirem
      let animations = [];
      if (model.animations && model.animations.length > 0) {
        console.log("Animações detectadas no modelo GLB:", model.animations.length);
        animations = model.animations;
      }

      console.log("Modelo GLB adicionado à cena com sucesso.");
      
      // Retorna tanto a cena quanto as animações e o status inicial dos objetos
      return {
        scene: model.scene,
        animations: animations, // Animações ficam acessíveis aqui
        initialStatus, // Retorna o status inicial dos objetos para registro no contexto em Model.jsx
      };
    } else {
      console.error("Nenhuma cena encontrada no modelo GLB.");
      throw new Error("Nenhuma cena encontrada.");
    }

  } catch (error) {
    console.error("Erro ao carregar o GLB:", error);
  }
}*/

async function loadGlb(buffer, world, setArrayName) {
  console.log("Iniciando carregamento de modelo GLB...");

  const loader = new GLTFLoader();

  try {
    const model = await new Promise((resolve, reject) => {
      loader.parse(buffer, "", resolve, (error) => {
        console.error("Erro no parsing do GLB:", error);
        reject(error);
      });
    });

    console.log("GLB model carregado:", model);

    if (model.scene) {
      console.log("Adicionando modelo GLB à cena...");
      world.scene.add(model.scene);

      // Inicializando o status dos objetos carregados
      const initialStatus = {};

      // Inspeção dos objetos e camadas do modelo principal
      model.scene.traverse((child) => {
        if (child.isMesh) {
          console.log(`Objeto da cena principal ${child.name} está na camada: ${child.layers.mask}`);

          let st = true;
          if (child.name === "Plane" || child.name === "Robo-Corpo") {
            st = false;
          }

          // Armazena o status inicial de cada objeto, incluindo emissiveIntensity
          initialStatus[child.uuid] = {
            name: child.name,        // Nome original do objeto
            status: st,              // Define o status inicial
            emissiveIntensity: 0.1,  // Valor padrão da emissividade
            oscillate: false,
          };
        }
      });

      // Armazena o array de nomes dos objetos no estado
      setArrayName(
        model.scene.children.map((element) => ({
          name: element.name,
          element: element,
        }))
      );

      // Verificar e capturar animações, se existirem
      let animations = [];
      if (model.animations && model.animations.length > 0) {
        console.log("Animações detectadas no modelo GLB:", model.animations.length);
        animations = model.animations;
      }

      console.log("Modelo GLB adicionado à cena com sucesso.");

      // Retorna tanto a cena quanto as animações e o status inicial dos objetos
      return {
        scene: model.scene,
        animations: animations,  // Animações ficam acessíveis aqui
        initialStatus,           // Retorna o status inicial dos objetos para registro no contexto em Model.jsx
      };
    } else {
      console.error("Nenhuma cena encontrada no modelo GLB.");
      throw new Error("Nenhuma cena encontrada.");
    }

  } catch (error) {
    console.error("Erro ao carregar o GLB:", error);
  }
}
