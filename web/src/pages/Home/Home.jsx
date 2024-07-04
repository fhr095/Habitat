import React, { useState } from "react";

import Habitats from "./components/Habitats/Habitats";
import Access from "./components/Access/Access";
import ChatMembers from "./components/ChatMembers/ChatMembers";
import Scene from "./components/Scene/Scene";

import "./Home.scss";

export default function Home({ user }) {
  const [habitat, setHabitat] = useState({});
  const [chatMember, setChatMember] = useState({});
  const [sceneKey, setSceneKey] = useState(Date.now()); // Chave única para reiniciar o componente Scene

  const handleSetHabitat = (newHabitat) => {
    setHabitat(newHabitat);
    setSceneKey(Date.now()); // Atualiza a chave única
  };

  if (user) {
    return (
      <div className="home-container">
        <Habitats user={user} setHabitat={handleSetHabitat} />

        {habitat.id ? (
          <Access habitat={habitat} userEmail={user.email} setChatMember={setChatMember} />
        ) : (
          <></>
        )}

        {chatMember.id ? (
          <ChatMembers habitatId={habitat.id} user={user} chatMember={chatMember} setChatMember={setChatMember} />
        ) : (
          <></>
        )}

        {habitat.glbFileUrl && (
          <Scene key={sceneKey} glbFileUrl={habitat.glbFileUrl} />
        )}
      </div>
    );
  } else {
    return (
      <div className="home">
        <h1>Home</h1>
      </div>
    );
  }
}