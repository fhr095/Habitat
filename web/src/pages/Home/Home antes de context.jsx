import React, { useState, useEffect  } from "react";
//import { useParams } from "react-router-dom"; //adicionado para depois

import Habitats from "./components/Habitats/Habitats";
import Scene from "./components/Scene/Scene";
import Access from "./components/Access/Access";
import ChatContainer from "./components/ChatContainer/ChatContainer";
import "./Home.scss";

export default function Home({ user }) {
  //const { id } = useParams(); // Captura o ID do habitat da URL (adicionado para depois)
  const [chatMember, setChatMember] = useState({});
  const [chatGroup, setChatGroup] = useState({});
  const [chatBot, setChatBot] = useState({});
  
  const [habitat, setHabitat] = useState({});
  const [sceneKey, setSceneKey] = useState(Date.now());
  const [fade, setFade] = useState("");

  const handleSetHabitat = (newHabitat) => {
    setHabitat(newHabitat);
    setSceneKey(Date.now()); // Atualiza a chave única (serve para forçar a atualização do Scene)
    console.log("Habitat set:", newHabitat);
  };

  const handleSetChatMember = (member) => {
    setChatMember(member);
    setChatGroup({});
    setChatBot({});
  };

  const handleSetChatGroup = (group) => {
    setChatGroup(group);
    setChatMember({});
    setChatBot({});
  };

  const handleSetChatBot = (bot) => {
    setChatBot(bot);
    setChatMember({});
    setChatGroup({});
  };

  console.log("Rendering Home");
  console.log("Habitat ID:", habitat.id);

  if (user) {
    return (
      <div className="home-container">
        <Habitats user={user} setHabitat={handleSetHabitat} />  
        {habitat.id && (
          <>
           <Access
              habitat={habitat}
              userEmail={user.email}
              setChatMember={handleSetChatMember}
              setChatGroup={handleSetChatGroup}
              setChatBot={handleSetChatBot}
            />
            <Scene
              key={sceneKey}
              mainFileUrl={habitat.mainFileUrl}
              mobileFileUrl={habitat.mobileFileUrl}
              fade={fade}
              address={habitat.address}
            />
          </>
        )}
        {chatMember.id || chatGroup.id || chatBot.id ? (
          <ChatContainer
            habitat={habitat}
            user={user}
            chatMember={chatMember}
            chatGroup={chatGroup}
            chatBot={chatBot}
            setChatMember={handleSetChatMember}
            setChatGroup={handleSetChatGroup}
            setChatBot={handleSetChatBot}
          />
        ) : null}              
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
