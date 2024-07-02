import React, { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import { storage, db } from "../../firebase";

import Sidebar from "./components/Sidebar";
import SceneConfig from "./components/SceneConfig";

import HabitatConfig from "./components/HabitatConfig";
import AccessConfig from "./components/AccessConfig";
import Avatar from "./components/Avatar";
import AddWidget from "./components/AddWidget";
import Reviews from "./components/Reviews";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/ConfigScreen.scss";

export default function ConfigScreen({ user }) {
  const [glbPath, setGlbPath] = useState("");
  const [activeComponent, setActiveComponent] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [habitatId, setHabitatId] = useState(null);
  const [modelParts, setModelParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!user) return; // Aguarda até que o user esteja definido

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
            setAddress(habitatData.address || "");

            console.log("Habitat Data:", habitatData);
            console.log("User Email:", user?.email);

            // Verificar se o usuário tem permissão
            if (user?.email !== habitatData.userEmail && !(habitatData.accessList || []).includes(user?.email)) {
              console.log("Usuário não autorizado. Redirecionando para /map.");
              navigate("/map");
            }
          } else {
            console.error("Habitat não encontrado");
            navigate("/map");
          }
        } catch (error) {
          console.error("Erro ao buscar modelo do habitat:", error);
          navigate("/map");
        }
      } else {
        navigate("/map");
      }
    };

    fetchHabitatModel();
  }, [location, user, navigate]);

  const handleResetModel = () => {
    setSelectedPart(null);
    setResetTrigger((prev) => prev + 1);
  };

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case "HabitatConfig":
        return <HabitatConfig />;
      case "AccessConfig":
        return <AccessConfig habitatId={habitatId} />;
      case "Avatar":
        return (
          <Avatar
            habitatId={habitatId}
            modelParts={modelParts}
            setSelectedPart={setSelectedPart}
            resetModel={handleResetModel}
            address={address}
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
    <div className="configScreen-container">
      <Sidebar
        activeComponent={activeComponent}
        setActiveComponent={setActiveComponent}
        habitatId={habitatId}
      />
      {renderActiveComponent()}
      {glbPath && (
        <SceneConfig
          glbPath={glbPath}
          setModelParts={setModelParts}
          selectedPart={selectedPart}
          resetTrigger={resetTrigger}
        />
      )}
    </div>
  );
}