import React, { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { collection, doc, getDoc } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import { storage, db } from "../../firebase";

import Sidebar from "./components/Sidebar";
import Scene from "./components/Scene";

import HabitatConfig from "./components/HabitatConfig";
import AddAvatar from "./components/AddAvatar";
import AddWidget from "./components/AddWidget";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/SceneScreen.scss";

export default function SceneScreen({ user }) {
  const [glbPath, setGlbPath] = useState("");
  const [activeComponent, setActiveComponent] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchHabitatModel = async () => {
      const queryParams = new URLSearchParams(location.search);
      const habitatId = queryParams.get("id");

      if (habitatId) {
        try {
          const habitatDocRef = doc(db, "habitats", habitatId);
          const habitatDoc = await getDoc(habitatDocRef);
          if (habitatDoc.exists()) {
            const habitatData = habitatDoc.data();
            const modelRef = ref(storage, habitatData.glbPath);
            const url = await getDownloadURL(modelRef);
            setGlbPath(url);
          } else {
            console.error("Habitat não encontrado");
          }
        } catch (error) {
          console.error("Erro ao buscar modelo do habitat:", error);
        }
      }
    };

    fetchHabitatModel();
  }, [location]);

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case "HabitatConfig":
        return <HabitatConfig />;
      case "AddAvatar":
        return <AddAvatar />;
      case "AddWidget":
        return <AddWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="sceneScreen-container">
      <Sidebar activeComponent={activeComponent} setActiveComponent={setActiveComponent} /> {/* Passa a função para o Sidebar */}

      {renderActiveComponent()} {/* Renderiza o componente ativo */}

      {glbPath && <Scene glbPath={glbPath} />}
    </div>
  );
}