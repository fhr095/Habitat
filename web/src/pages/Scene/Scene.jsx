import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase"; 

import Model from "./components/Model/Model";
import Buttons from "./components/Buttons/Buttons.jsx";
import Response from "./components/Response/Response";
import Welcome from "./components/Welcome/Welcome.jsx";

import "./Scene.scss";

export default function Scene() {
  const { id } = useParams();
  const [glbFileUrl, setGlbFileUrl] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [fade, setFade] = useState([]);

  useEffect(() => {
    const fetchHabitatData = async () => {
      try {
        const habitatRef = doc(db, "habitats", id);
        const habitatDoc = await getDoc(habitatRef);

        if (habitatDoc.exists()) {
          const habitatData = habitatDoc.data();
          setGlbFileUrl(habitatData.glbFileUrl);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching habitat data: ", error);
      }
    };

    fetchHabitatData();
  }, [id]);

  return (
    <div className="scene-container">
      {glbFileUrl ? <Model glbFileUrl={glbFileUrl} fade={fade} /> : <p>Loading...</p>}

      <Buttons setTranscript={setTranscript}/>

      <Response avt={id} transcript={transcript} setTranscript={setTranscript} setFade={setFade}/>

      <Welcome habitatId={id} transcript={transcript} />
    </div>
  );
}