import React, { useEffect, useState } from "react";

import Habitats from "./components/Habitats/Habitats";
import Access from "./components/Access/Access";
import ChatMembers from "./components/ChatMembers/ChatMembers";
import ChatGroups from "./components/ChatGroups/ChatGroups";
import ChatBots from "./components/ChatBots/ChatBots";
import Scene from "./components/Scene/Scene";

import "./Home.scss";

export default function Home({ user }) {
  const [habitat, setHabitat] = useState({});
  const [chatMember, setChatMember] = useState({});
  const [chatGroup, setChatGroup] = useState({});
  const [chatBot, setChatBot] = useState({});
  const [sceneKey, setSceneKey] = useState(Date.now()); 
  const [fade, setFade] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedBot, setSelectedBot] = useState(null);

  const handleSetHabitat = (newHabitat) => {
    setHabitat(newHabitat);
    setSceneKey(Date.now()); // Atualiza a chave única
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
            setSelectedMember={setSelectedMember}
            setSelectedGroup={setSelectedGroup}
            setSelectedBot={setSelectedBot}
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
          <Scene key={sceneKey} ifcFileUrl={habitat.ifcFileUrl} fade={fade} address={habitat.address} />
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
