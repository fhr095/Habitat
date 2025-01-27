// src/components/Scene/Model/Model.jsx
import { useEffect } from "react";
import LoadModel from "./LoadModel/LoadModel";
// Antes: import { useFades } from "../../../../../context/FadeContext";
import { useSceneData } from "../../../../../context/SceneDataContext";

export default function Model({ modelUrl, components, world }) {
  const { setFadeOptions } = useSceneData(); // Agora acessando o contexto unificado

  useEffect(() => {
    async function fetchModel() {
      if (modelUrl && world) {
        try {
          // Remove "modelType" do parâmetro se não for mais necessário. Podemos detectá-lo no LoadModel.js.
          const arrayData = await LoadModel(modelUrl, components, world);
          // arrayData contém a lista de objetos carregados do modelo (fades, nomes).
          setFadeOptions(arrayData);
        } catch (error) {
          console.error("Erro ao carregar o modelo:", error);
        }
      }
    }

    fetchModel();
  }, [modelUrl, components, world, setFadeOptions]);

  return null;
}
