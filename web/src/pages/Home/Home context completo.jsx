import React from "react";
import Habitats from "./components/Habitats/Habitats";
import Scene from "./components/Scene/Scene";
import Access from "./components/Access/Access";
import ChatContainer from "./components/ChatContainer/ChatContainer";
import { useHabitatUser } from "../../context/HabitatUserContext";
import "./Home.scss";

export default function Home() {
  const { habitat, setHabitat, chatMember, chatGroup, chatBot, user } = useHabitatUser();
  const [sceneKey, setSceneKey] = React.useState(Date.now());
  const [fade, setFade] = React.useState("");

  const handleSetHabitat = (newHabitat) => {
    setHabitat(newHabitat);
    setSceneKey(Date.now());
    console.log("Habitat set:", newHabitat);
  };

  if (user) {
    return (
      <div className="home-container">
        <Habitats setHabitat={handleSetHabitat} />  
        {habitat.id && (
          <>
            <Access />
            <Scene
              key={sceneKey}
              mainFileUrl={habitat.mainFileUrl}
              mobileFileUrl={habitat.mobileFileUrl}
              fade={fade}
              address={habitat.address}
            />
          </>
        )}
        {(chatMember.id || chatGroup.id || chatBot.id) && (
          <ChatContainer />
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
