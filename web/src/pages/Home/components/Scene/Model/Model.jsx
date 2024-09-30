// src/components/Model/Model.jsx
import { useEffect } from "react";
import LoadModel from "./LoadModel/LoadModel";

export default function Model({ modelUrl, components, world, setArrayName }) {
  useEffect(() => {
    async function fetchModel() {
      if (modelUrl && components && world) {
        try {
          // Chama LoadModel para carregar o modelo
          await LoadModel(modelUrl, components, world, setArrayName);
        } catch (error) {
          console.error("Erro ao carregar o modelo:", error);
        }
      }
    }

    fetchModel();
  }, [modelUrl, components, world, setArrayName]);

  return null; // Este componente não renderiza nada visualmente
}
