import React, { useEffect, useState } from "react";

import Habitats from "./components/Habitats/Habitats.jsx";
import Access from "./components/Access/Access.jsx";
import ChatMembers from "./components/ChatMembers/ChatMembers.jsx";
import ChatGroups from "./components/ChatGroups/ChatGroups.jsx"; // Importar o componente de grupos
import ChatBots from "./components/ChatBots/ChatBots.jsx"; // Importar o componente de bots
import Scene from "./components/Scene/Scene.jsx";

import "./Home.scss";

export default function Home({ user }) {
  const [habitat, setHabitat] = useState({});
  const [chatMember, setChatMember] = useState({});
  const [chatGroup, setChatGroup] = useState({});
  const [chatBot, setChatBot] = useState({});
  const [sceneKey, setSceneKey] = useState(Date.now()); 
  const [fade, setFade] = useState("");

  const handleSetHabitat = (newHabitat) => {
    setHabitat(newHabitat);
    setSceneKey(Date.now()); // Atualiza a chave única
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

  if (user) {
    return (
      <div className="home-container">
        <Habitats user={user} setHabitat={handleSetHabitat} />

        {habitat.id ? (
          <Access
            habitat={habitat}
            userEmail={user.email}
            setChatMember={handleSetChatMember}
            setChatGroup={handleSetChatGroup}
            setChatBot={handleSetChatBot}
          />
        ) : (
          <></>
        )}

        {chatMember.id && (
          <ChatMembers habitatId={habitat.id} user={user} chatMember={chatMember} setChatMember={handleSetChatMember} />
        )}

        {chatGroup.id && (
          <ChatGroups habitatId={habitat.id} user={user} group={chatGroup} setChatGroup={handleSetChatGroup} />
        )}

        {chatBot.id && (
          <ChatBots habitatId={habitat.id} user={user} bot={chatBot} setChatBot={handleSetChatBot} setFade={setFade} />
        )}

        {habitat.ifcFileUrl && (
          <Scene key={sceneKey} ifcFileUrl={habitat.ifcFileUrl} fade={fade} />
        )}
      </div>
    );
  } else {
    return (
      <div className="home">
        
      </div>
    );
  }
}