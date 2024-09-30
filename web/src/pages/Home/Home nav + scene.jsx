import React, { useState, useEffect  } from "react";
//import { useParams } from "react-router-dom"; //adicionado para depois

import Habitats from "./components/Habitats/Habitats";
import Scene from "./components/Scene/Scene";
import "./Home.scss";

export default function Home({ user }) {
  //const { id } = useParams(); // Captura o ID do habitat da URL (adicionado para depois)

  const [habitat, setHabitat] = useState({});
  const [sceneKey, setSceneKey] = useState(Date.now());
  const [fade, setFade] = useState("");

  const handleSetHabitat = (newHabitat) => {
    setHabitat(newHabitat);
    setSceneKey(Date.now()); // Atualiza a chave única (serve para forçar a atualização do Scene)
    console.log("Habitat set:", newHabitat);
  };

  console.log("Rendering Home");
  console.log("Habitat ID:", habitat.id);

  if (user) {
    return (
      <div className="home-container">
        <Habitats user={user} setHabitat={handleSetHabitat} />  
        {habitat.id && (
          <>
            <Scene
              key={sceneKey}
              mainFileUrl={habitat.mainFileUrl}
              mobileFileUrl={habitat.mobileFileUrl}
              fade={fade}
              address={habitat.address}
            />
          </>
        )}              
      </div>
    );
  } else {
    return (
      <div className="home">
        {/* Tela para usuário não autenticado */}
      </div>
    );
  }
}
