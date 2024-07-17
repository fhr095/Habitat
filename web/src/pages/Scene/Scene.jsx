import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase"; 

import Model from "./components/Model/Model";
import Buttons from "./components/Buttons/Buttons.jsx";
import Response from "./components/Response/Response";
import ConfigWelcome from "./components/ConfigWelcome/ConfigWelcome.jsx";
import Welcome from "./components/Welcome/Welcome.jsx";

import "./Scene.scss";

export default function Scene({ user }) {
  const { id } = useParams();
  const [glbFileUrl, setGlbFileUrl] = useState(null);
  const [createdBy, setCreatedBy] = useState("");
  const [transcript, setTranscript] = useState("");
  const [fade, setFade] = useState([]);
  const [resete, setResete] = useState(false);

  useEffect(() => {
    const fetchHabitatData = async () => {
      try {
        const habitatRef = doc(db, "habitats", id);
        const habitatDoc = await getDoc(habitatRef);

        if (habitatDoc.exists()) {
          const habitatData = habitatDoc.data();
          setGlbFileUrl(habitatData.glbFileUrl);
          setCreatedBy(habitatData.createdBy);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching habitat data: ", error);
      }
    };

    fetchHabitatData();
  }, [id]);

  if(user){
    return (
      <div className="scene-container">
        {glbFileUrl ? <Model glbFileUrl={glbFileUrl} fade={fade} avt={id} resete={resete} setResete={setResete} /> : <p>Loading...</p>}

        <Buttons setTranscript={setTranscript} setResete={setResete}/>

        <Response avt={id} transcript={transcript} setTranscript={setTranscript} setFade={setFade}/>

        {user.email == createdBy && (
          <ConfigWelcome habitatId={id}/>
        )}

        <Welcome habitatId={id} transcript={transcript} />
      </div>
    );
  }
}