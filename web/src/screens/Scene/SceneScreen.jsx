import React, { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import { storage, db } from "../../firebase";

import Sidebar from "./components/Sidebar";
import Scene from "./components/Scene";

import HabitatConfig from "./components/HabitatConfig";
import Avatar from "./components/Avatar";
import AddWidget from "./components/AddWidget";
import Reviews from "./components/Reviews";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/SceneScreen.scss";

export default function SceneScreen({ user }) {
  const [glbPath, setGlbPath] = useState("");
  const [activeComponent, setActiveComponent] = useState(null);
  const location = useLocation();
  const [habitatId, setHabitatId] = useState(null);
  const [modelParts, setModelParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    const fetchHabitatModel = async () => {
      const queryParams = new URLSearchParams(location.search);
      const id = queryParams.get("id");
      setHabitatId(id);

      if (id) {
        try {
          const habitatDocRef = doc(db, "habitats", id);
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
      case "Avatar":
        return (
          <Avatar
            habitatId={habitatId}
            modelParts={modelParts}
            setSelectedPart={setSelectedPart}
          />
        );
      case "AddWidget":
        return <AddWidget habitatId={habitatId} />;
      case "Reviews":
        return <Reviews habitatId={habitatId} />;
      default:
        return null;
    }
  };

  return (
    <div className="sceneScreen-container">
      <Sidebar
        activeComponent={activeComponent}
        setActiveComponent={setActiveComponent}
      />
      {renderActiveComponent()}
      {glbPath && (
        <Scene
          glbPath={glbPath}
          setModelParts={setModelParts}
          selectedPart={selectedPart}
        />
      )}
    </div>
  );
}
