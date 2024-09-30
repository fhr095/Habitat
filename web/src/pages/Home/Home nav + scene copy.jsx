import React, { useState, useEffect  } from "react";
//import { useParams } from "react-router-dom"; //adicionado para depois

import Habitats from "./components/Habitats/Habitats";
import "./Home.scss";

export default function Home({ user }) {
  //const { id } = useParams(); // Captura o ID do habitat da URL (adicionado para depois)

  const [habitat, setHabitat] = useState({});

  const handleSetHabitat = (newHabitat) => {
    setHabitat(newHabitat);
    console.log("Habitat set:", newHabitat);
  };

  console.log("Rendering Home");
  console.log("Habitat ID:", habitat.id);

  if (user) {
    return (
      <div className="home-container">
        <Habitats user={user} setHabitat={handleSetHabitat} />  
                 
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
