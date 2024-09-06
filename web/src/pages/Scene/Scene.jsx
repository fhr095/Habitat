import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase";

import Model from "./components/Model/Model";
import Response from "./components/Response/Response";
import Welcome from "./components/Welcome/Welcome";
import WebCan from "./components/WebCan/WebCan";
import Transcript from "./components/Transcript/Transcript";
import Porcupine from "./components/Porcupine/Porcupine";

import "./Scene.scss";

export default function Scene({ user }) {
  const { id } = useParams();
  const [habitatData, setHabitatData] = useState({});
  const [transcript, setTranscript] = useState(""); // Agora é uma string única
  const [fade, setFade] = useState([]);
  const [response, setResponse] = useState([]);
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [persons, setPersons] = useState([]);
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [history, setHistory] = useState([]); // Novo estado para o histórico de interações
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchHabitatData = async () => {
      try {
        const habitatRef = doc(db, "habitats", id);
        const habitatDoc = await getDoc(habitatRef);

        if (habitatDoc.exists()) {
          const habitatData = habitatDoc.data();
          setHabitatData(habitatData);
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
    if(!currentPerson){
      setTranscript(""); // Limpa o texto quando a pessoa não está mais presente
      setHistory([]); // Limpa o histórico quando a pessoa não está mais presente
    }
  }, [currentPerson]);
  
  return (
    <div className="scene-container">
      {habitatData.ifcFileUrl ? (
        <Model ifcFileUrl={habitatData.ifcFileUrl} fade={fade} avt={id} />
      ) : (
        <p>Loading...</p>
      )}

      <Response
        habitatId={id}
        avt={id}
        transcript={transcript}
        setTranscript={setTranscript}
        setFade={setFade}
        showQuestion={showQuestion}
        setShowQuestion={setShowQuestion}
        response={response}
        setResponse={setResponse}
        history={history}
        setHistory={setHistory}
      />

      {!showQuestion && transcript === "" && isFinished && (
        <Transcript setTranscript={setTranscript} />
      )}

      <Porcupine setIsFinished={setIsFinished}/>

      <Welcome
        isPersonDetected={isPersonDetected}
        history={history}
        transcript={transcript}
        avt={id}
        persons={persons}
        setIsFinished={setIsFinished}
      />

      <WebCan
        setIsPersonDetected={setIsPersonDetected}
        setPersons={setPersons}
        setCurrentPerson={setCurrentPerson}
      />
    </div>
  );
}