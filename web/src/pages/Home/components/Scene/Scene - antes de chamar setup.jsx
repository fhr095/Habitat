import React, { useState, useEffect } from "react";
import MiniMap from "../MiniMap/MiniMap";
import Model from "./Model/Model"; // Importa o novo componente Model
import "./Scene.scss";

export default function Scene({ mainFileUrl, mobileFileUrl, fade, address }) {
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [modelUrl, setModelUrl] = useState("");

  useEffect(() => {
    console.log("Verificando URLs e dispositivo...");
    if (mainFileUrl || mobileFileUrl) {
      const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
      const selectedUrl = isMobileDevice ? mobileFileUrl : mainFileUrl;
      setModelUrl(selectedUrl);
      setIsValidUrl(true);
      console.log("URL válida selecionada:", selectedUrl);
    } else {
      console.error("Nenhuma URL de arquivo válida foi fornecida.");
      setIsValidUrl(false);
    }
  }, [mainFileUrl, mobileFileUrl]);

  return (
    <div className="scene-container">
      {isValidUrl ? (
        <Model
          modelUrl={modelUrl}
          fade={fade}
        />
      ) : (
        <p>Carregando...</p>
      )}
      {address && <MiniMap address={address} />}
    </div>
  );
}
