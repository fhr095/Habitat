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
  const [transcripts, setTranscripts] = useState(""); // Agora é uma string única
  const [fade, setFade] = useState([]);
  const [response, setResponse] = useState([]);
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [persons, setPersons] = useState([]);
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [history, setHistory] = useState([]); // Novo estado para o histórico de interações

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
    // Função para verificar se já existe um dado correspondente no armazenamento local
    const checkForExistingData = (detectedDescriptor) => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("personData_")) {
          const storedData = JSON.parse(localStorage.getItem(key));
          if (storedData?.image?.descriptor) {
            const storedDescriptor = new Float32Array(storedData.image.descriptor);

            // Verifica se os descritores têm o mesmo comprimento antes de comparar
            if (
              storedDescriptor.length === detectedDescriptor.length &&
              faceapi.euclideanDistance(detectedDescriptor, storedDescriptor) < 0.4
            ) {
              return storedData;
            }
          }
        }
      }
      return null;
    };

    // Função para salvar os dados no localStorage
    const saveToLocalStorage = (personData) => {
      const personId = personData.id;
      const storedData = JSON.parse(localStorage.getItem(`personData_${personId}`)) || {};

      // Verifica se já existe um dado correspondente antes de salvar
      const existingData = checkForExistingData(personData.image.descriptor);
      if (existingData) {
        console.log(`Existing data found in localStorage for ID ${existingData.id}`);
        return; // Se encontrar dados existentes, não salva o novo ID
      }

      storedData.history = history;
      const dataToStore = { ...storedData, ...personData };

      // Log para verificar os dados antes de armazenar
      console.log(`Saving to localStorage:`, dataToStore);

      localStorage.setItem(`personData_${personId}`, JSON.stringify(dataToStore));
    };

    // Salva os dados da pessoa no localStorage quando `currentPerson` for atualizado
    if (currentPerson) {
      saveToLocalStorage(currentPerson);

      // Remove os dados do localStorage após 5 minutos de inatividade
      const expirationTimeout = setTimeout(() => {
        console.log(`Removing data for ID ${currentPerson.id} from localStorage after 5 minutes`);
        localStorage.removeItem(`personData_${currentPerson.id}`);
      }, 5 * 60 * 1000); // 5 minutos

      return () => clearTimeout(expirationTimeout);
    }
  }, [currentPerson]);

  useEffect(() => {
    // Atualiza o localStorage sempre que o histórico for alterado
    if (currentPerson) {
      const personData = JSON.parse(localStorage.getItem(`personData_${currentPerson.id}`)) || {};
      personData.history = history;

      // Log para verificar os dados do histórico antes de atualizar
      console.log(`Updating history in localStorage:`, personData);

      localStorage.setItem(`personData_${currentPerson.id}`, JSON.stringify(personData));
    }
  }, [history]);

  useEffect(() => {
    console.log(showQuestion);
    console.log(isPersonDetected);
  }, [showQuestion, isPersonDetected]);

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
        setTranscripts={setTranscripts}
        setFade={setFade}
        showQuestion={showQuestion}
        setShowQuestion={setShowQuestion}
        response={response}
        setResponse={setResponse}
        history={history} // Passa o histórico para o componente Response
        setHistory={setHistory} // Passa o setHistory para permitir atualizações
      />

      {isPersonDetected && !showQuestion && (
        <Transcript setTranscripts={setTranscripts} />
      )}

      <Welcome
        isPersonDetected={isPersonDetected}
        history={history}
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
        setIsMicEnabled={setIsMicEnabled}
      />
    </div>
  );
}