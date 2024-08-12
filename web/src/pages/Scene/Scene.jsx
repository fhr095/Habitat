import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase"; 

import Model from "./components/Model/Model";
import Buttons from "./components/Buttons/Buttons";
import Response from "./components/Response/Response";
import Transcript from "./components/Transcript/Transcript";
import Welcome from "./components/Welcome/Welcome";
import WebCan from "./components/WebCan/WebCan";

import "./Scene.scss";

export default function Scene({ user }) {
  const { id } = useParams();
  const [ifcFileUrl, setIfcFileUrl] = useState(null);
  const [createdBy, setCreatedBy] = useState("");
  const [transcript, setTranscript] = useState("");
  const [fade, setFade] = useState([]);
  const [resete, setResete] = useState(false);
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [persons, setPersons] = useState([]);

  useEffect(() => {
    const fetchHabitatData = async () => {
      try {
        const habitatRef = doc(db, "habitats", id);
        const habitatDoc = await getDoc(habitatRef);

        if (habitatDoc.exists()) {
          const habitatData = habitatDoc.data();
          setIfcFileUrl(habitatData.ifcFileUrl);
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

  // useEffect(() => {
  //   console.log("Persons: ", transcript);
  // }, [transcript]);

  return (
    <div className="scene-container">
      {ifcFileUrl ? <Model ifcFileUrl={ifcFileUrl} fade={fade} avt={id} /> : <p>Loading...</p>}

      {/* <Buttons setTranscript={setTranscript} setResete={setResete} /> */}

      <Response habitatId={id} avt={id} transcript={transcript} setTranscript={setTranscript} setFade={setFade} />

      {transcript == "" && <Transcript transcript={transcript} setTranscript={setTranscript} isPersonDetected={isPersonDetected} />}

      <Welcome isPersonDetected={isPersonDetected} transcript={transcript} />

      <WebCan setIsPersonDetected={setIsPersonDetected} setPersons={setPersons}/>
    </div>
  );
}