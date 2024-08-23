import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase";

import Model from "./components/Model/Model";
import Response from "./components/Response/Response";
import Welcome from "./components/Welcome/Welcome";
import WebCan from "./components/WebCan/WebCan";
import Transcript from "./components/Transcript/Transcript";

import "./Scene.scss";

export default function Scene({ user }) {
  const { id } = useParams();
  const [ifcFileUrl, setIfcFileUrl] = useState(null);
  const [createdBy, setCreatedBy] = useState("");
  const [transcripts, setTranscripts] = useState([]);
  const [fade, setFade] = useState([]);
  const [response, setResponse] = useState([]);
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [persons, setPersons] = useState([]);
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [isMicEnabled, setIsMicEnabled] = useState(false);  // Estado para controle do microfone

  useEffect(() => {
    const fetchHabitatData = async () => {
      try {
        const habitatRef = doc(db, "habitats", id);
        const habitatDoc = await getDoc(habitatRef);

        if (habitatDoc.exists()) {
          const habitatData = habitatDoc.data();
          setIfcFileUrl(habitatData.ifcFileUrl);
          setCreatedBy(habitatData.createdBy);
          setDataCollectionEnabled(habitatData.dataCollectionEnabled || false);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching habitat data: ", error);
      }
    };

    fetchHabitatData();
  }, [id]);

  useEffect(() => {
    // Limpa o array de perguntas quando a pessoa não é mais detectada ou muda de pessoa
    if (!currentPerson) {
      setTranscripts([]);
    }
  }, [currentPerson]);

  return (
    <div className="scene-container">
      {ifcFileUrl ? (
        <Model ifcFileUrl={ifcFileUrl} fade={fade} avt={id} />
      ) : (
        <p>Loading...</p>
      )}

      <Response
        habitatId={id}
        avt={id}
        transcripts={transcripts}
        setFade={setFade}
        showQuestion={showQuestion}
        setShowQuestion={setShowQuestion}
        response={response}
        setResponse={setResponse}
      />

      {!showQuestion && isPersonDetected && isMicEnabled && (
        <Transcript setTranscripts={setTranscripts} showQuestion={showQuestion} isPersonDetected={isPersonDetected} />
      )}

      <Welcome
        isPersonDetected={isPersonDetected}
        transcripts={transcripts}
        avt={id}
        persons={persons}
        isFinished={setShowQuestion}
      />

      <WebCan
        setIsPersonDetected={setIsPersonDetected}
        setPersons={setPersons}
        setCurrentPerson={setCurrentPerson}
        habitatId={id}
        transcripts={transcripts}
        response={response}
        setIsMicEnabled={setIsMicEnabled}  // Passa o controle do microfone para WebCan
      />
    </div>
  );
}