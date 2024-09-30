// src/components/Scene/Scene.jsx
import React, { useState, useEffect, useRef } from "react";
import MiniMap from "../MiniMap/MiniMap";
import SetupScene from "./SetupScene/SetupScene";
import FadeEffect from "./FadeEffect/FadeEffect";
import Model from "./Model/Model";
import "./Scene.scss";

export default function Scene({ habitatId, mainFileUrl, mobileFileUrl, fade = "", address }) {
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [modelUrl, setModelUrl] = useState("");
  
  const containerRef = useRef();
  const [components, setComponents] = useState(null);
  const [world, setWorld] = useState(null);
  const [camera, setCamera] = useState(null);
  const [arrayName, setArrayName] = useState([]); // Inicializado como array vazio

  useEffect(() => {
    console.log("Verificando URLs e dispositivo...");
    if (mainFileUrl || mobileFileUrl) {
      const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
      const selectedUrl = isMobileDevice ? mobileFileUrl : mainFileUrl;
      setModelUrl(selectedUrl);
      setIsValidUrl(true);
      console.log("URL válida selecionada:", selectedUrl);
      
      // Chama SetupScene para configurar a cena
      const { components, world } = SetupScene(containerRef, setCamera);
      setComponents(components);
      setWorld(world);
    } else {
      console.error("Nenhuma URL de arquivo válida foi fornecida.");
      setIsValidUrl(false);
    }
  }, [habitatId, mainFileUrl, mobileFileUrl]); // habitatId adicionado como dependência

  useEffect(() => {
    if (camera && arrayName.length > 0) {
      // Aplica efeitos de fade se necessário
      FadeEffect(fade, arrayName, camera);
    }
  }, [fade, arrayName, camera]);

  return (
    <div ref={containerRef} className="scene">
      {isValidUrl && components && world && (
        <Model
          modelUrl={modelUrl}
          components={components}
          world={world}
          setArrayName={setArrayName}
        />
      )}
      {address && <MiniMap address={address} />}
    </div>
  );
}
