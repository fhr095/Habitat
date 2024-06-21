import React, { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../firebase";

import Sidebar from "./components/Sidebar";
import Buttons from "./components/Buttons";
import Scene from "./components/Scene";

import Profile from "./components/Profile";
import AddHabitat from "./components/AddHabitat";
import ListHabitats from "./components/ListHabitats";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/SceneScreen.scss";

export default function SceneScreen({ user, onLoginClick, onLogoutClick }) {
  const [glbPath, setGlbPath] = useState("");
  const [activeComponent, setActiveComponent] = useState(null); // Estado para gerenciar o componente ativo
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchModelUrl = async () => {
      try {
        const modelRef = ref(storage, "model/default_model.glb");
        const url = await getDownloadURL(modelRef);
        setGlbPath(url);
      } catch (error) {
        console.error("Error fetching model URL:", error);
      }
    };

    fetchModelUrl();
  }, []);

  // Função para renderizar o componente ativo
  const renderActiveComponent = () => {
    switch (activeComponent) {
      case "Profile":
        return <Profile />;
      case "AddHabitat":
        return <AddHabitat user={user} />;
      case "ListHabitats":
        return <ListHabitats user={user} onHabitatClick={handleHabitatClick} />;
      default:
        return null;
    }
  };

  const handleHabitatClick = async (glbPath) => {
    if (isLoading) {
      alert("Por favor, aguarde o carregamento do modelo atual.");
      return;
    }
    setGlbPath(glbPath);
    setIsLoading(true);
  };

  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  return (
    <div className="sceneScreen-container">
      <Sidebar setActiveComponent={setActiveComponent} /> {/* Passa a função para o Sidebar */}
      {renderActiveComponent()} {/* Renderiza o componente ativo */}
      <Buttons logged={!!user} onLoginClick={onLoginClick} onLogoutClick={onLogoutClick} />
      {glbPath && <Scene glbPath={glbPath} onLoadComplete={handleLoadComplete} />}
    </div>
  );
}