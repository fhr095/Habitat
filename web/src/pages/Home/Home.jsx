import React, { useState } from "react";

import Habitats from "./components/Habitats/Habitats";
import Access from "./components/Access/Access";
import ChatMembers from "./components/ChatMembers/ChatMembers.jsx";

import "./Home.scss";

export default function Home({ user }) {
  const [habitat, setHabitat] = useState({});
  const [chatMember, setChatMember] = useState({});

  if(user) {
    return (
      <div className="home-container">
        <Habitats user={user} setHabitat={setHabitat}/>

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
      </div>
    );
  }else{
    return (
      <div className="home">
        <h1>Home</h1>
      </div>
    );
  }
};