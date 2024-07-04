import React, { useState } from "react";

import Habitats from "./components/Habitats/Habitats";
import Access from "./components/Access/Access";

import "./Home.scss";

export default function Home({ user }) {
  const [habitat, setHabitat] = useState({});

  if(user) {
    return (
      <div className="home-container">
        <Habitats user={user} setHabitat={setHabitat}/>

        {habitat.id ? (
          <Access habitat={habitat} userEmail={user.email} />
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