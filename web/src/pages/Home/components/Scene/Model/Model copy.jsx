// src/components/Scene/Model/Model.jsx
import { useEffect } from "react";
import LoadModel from "./LoadModel/LoadModel";
import { useFades } from "../../../../../context/FadeContext";

export default function Model({ modelUrl, components, world, modelType }) {
  const { setFadeOptions } = useFades();

  useEffect(() => {
    async function fetchModel() {
      if (modelUrl && world) {
        try {
          const arrayData = await LoadModel(modelUrl, components, world, modelType);
          setFadeOptions(arrayData);
        } catch (error) {
          console.error("Erro ao carregar o modelo:", error);
        }
      }
    }

    fetchModel();
  }, [modelUrl, components, world, modelType, setFadeOptions]);

  return null;
}
