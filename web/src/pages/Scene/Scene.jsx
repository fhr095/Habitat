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

import SetupScene from "./components/SetupScene/SetupScene";
import ControlPanel from "./components/ControlPanel/ControlPanel";
import AnimationController from "./components/AnimationController/AnimationController";

import "./Scene.scss";

export default function Scene({ habitatId, mainFileUrl, mobileFileUrl, address}) {
  const { id } = useParams();
  const [habitatData, setHabitatData] = useState({});
  const [transcript, setTranscript] = useState(""); // Agora é uma string única
  const [fade, setFade] = useState([]);
  const [response, setResponse] = useState({ comandos: [] });
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [persons, setPersons] = useState([]);
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [history, setHistory] = useState([]); // Novo estado para o histórico de interações
  const [isFinished, setIsFinished] = useState(false);
  const [isPorcupine, setIsPorcupine] = useState(false);


  const [isValidUrl, setIsValidUrl] = useState(false);
  const [modelUrl, setModelUrl] = useState("");
  const [extraObjectsUrls, setExtraObjectsUrls] = useState([]);
  const [components, setComponents] = useState(null);
  const [world, setWorld] = useState(null);
  const [camera, setCamera] = useState(null);
  const [arrayName, setArrayName] = useState([]);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    const fetchHabitatData = async () => {
      try {
        // Obter referência ao documento do Firebase
        const habitatRef = doc(db, "habitats", id);
        const habitatDoc = await getDoc(habitatRef);
  
        if (habitatDoc.exists()) {
          const habitatData = habitatDoc.data();
          setHabitatData(habitatData);
  
          // Verificar se o dispositivo é móvel
          const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
  
          // Selecionar a URL correta com base no dispositivo
          const selectedUrl = isMobileDevice ? habitatData.mobileFileUrl : habitatData.mainFileUrl;
          setModelUrl(selectedUrl);
          setIsValidUrl(true);
        } else {
          console.error("No such document!");
          setIsValidUrl(false);
        }
      } catch (error) {
        console.error("Error fetching habitat data: ", error);
      }
    };
  
    fetchHabitatData();
  }, [id]); // O efeito depende do ID do habitat
  
  

  // Verifica se é um dispositivo móvel e ajusta a URL do modelo
  useEffect(() => {
    if (mainFileUrl || mobileFileUrl) {
      const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
      const selectedUrl = isMobileDevice ? mobileFileUrl : mainFileUrl;
      setModelUrl(selectedUrl);
      setIsValidUrl(true);
    } else {
      setIsValidUrl(false);
    }

    // Defina as URLs dos objetos extras (Avatar etc.)
   /* setExtraObjectsUrls([
      '/Avatar/2.glb', // Caminho para o avatar ou outros objetos extras
    ]);*/
  }, [habitatId, mainFileUrl, mobileFileUrl]);

  useEffect(() => {
    if(!currentPerson){
      setTranscript(""); // Limpa o texto quando a pessoa não está mais presente
      setHistory([]); // Limpa o histórico quando a pessoa não está mais presente
      setIsPorcupine(false); // Reseta o estado do Porcupine
    }
  }, [currentPerson]);

  useEffect(() => {
    if(transcript === ""){
      setIsPorcupine(false);
    }
  }, [transcript]);
  
  return (
    <div className="scene-container">
      {/*habitatData.ifcFileUrl ? (
        <Model ifcFileUrl={habitatData.ifcFileUrl} fade={fade} avt={id} />
      ) : (
        <p>Loading...</p>
      )*/}

      {/*<ControlPanel />*/}
      

      
      {/* Sempre carregar o SetupScene primeiro */}
      {/*isValidUrl &&*/ (
        <SetupScene
          setCamera={setCamera}
          modelUrl={modelUrl}
          setComponents={setComponents}
          setWorld={setWorld}
        />
      )}

      {/* Carregar o modelo principal */}
      {/*isValidUrl &&*/ components && world && !modelLoaded && (
        <Model
          modelUrl={modelUrl}
          components={components}
          world={world}
          setArrayName={setArrayName}
          onLoad={() => {
            console.log("Modelo principal carregado!");
            setModelLoaded(true); // Marca como carregado quando o modelo estiver pronto
          }}
        />
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

      {(isPersonDetected || isPorcupine) && !showQuestion && transcript === '' && isFinished && (
        <Transcript setTranscript={setTranscript} />
      )}
      {console.log(isPersonDetected,isPorcupine,!showQuestion,transcript === '',isFinished, 'último: ',(isPersonDetected || isPorcupine) && transcript === '')}

      {!isPorcupine && (
        <Porcupine setIsPorcupine={setIsPorcupine}/>
      )}

      <AnimationController />

      {(/*isValidUrl &&*/ components && world && modelLoaded && 
      <Welcome
        isPersonDetected={isPersonDetected}
        isPorcupine={isPorcupine}
        history={history}
        transcript={transcript}
        avt={id}
        persons={persons}
        setIsFinished={setIsFinished}
      />)}
      

      {/*<WebCan
        setIsPersonDetected={setIsPersonDetected}
        setPersons={setPersons}
        setCurrentPerson={setCurrentPerson}
      />*/}
    </div>
  );
}