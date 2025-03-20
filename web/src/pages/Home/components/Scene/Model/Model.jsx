// src/components/Scene/Model/Model.jsx
import { useEffect } from "react";
import LoadModel from "./LoadModel/LoadModel";
import { useSceneData } from "../../../../../context/SceneDataContext";

export default function Model({ modelUrl, components, world }) {
  const { setFadeOptions } = useSceneData();

  useEffect(() => {
    async function fetchModel() {
      if (modelUrl && world) {
        try {
          const arrayData = await LoadModel(modelUrl, components, world);
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
