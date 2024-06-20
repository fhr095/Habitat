import React, { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../firebase.js";

import Sidebar from "./components/Sidebar";
import Buttons from "./components/Buttons.jsx";
import Scene from "./components/Scene";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/SceneScreen.scss";

export default function SceneScreen({ user, onLoginClick, onLogoutClick }) {
  const [glbPath, setGlbPath] = useState("");

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

  return (
    <div className="sceneScreen-container">
      <Sidebar />
      <Buttons logged={!!user} onLoginClick={onLoginClick} onLogoutClick={onLogoutClick} />

      {glbPath && <Scene glbPath={glbPath} />}
      
    </div>
  );
}