import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

import Model from "./components/Model/Model";
import Response from "./components/Response/Response";
import Welcome from "./components/Welcome/Welcome";
import Transcript from "./components/Transcript/Transcript";
import Porcupine from "./components/Porcupine/Porcupine";
import SetupScene from "./components/SetupScene/SetupScene";
import AnimationController from "./components/AnimationController/AnimationController";
import ControlPanel from "./components/ControlPanel/ControlPanel";
import WebCan from "./components/WebCan/WebCan";


import { SceneConfigContext } from "../../context/SceneConfigContext";

import activationSound from '/sounds/button-on.mp3';

import "./Scene.scss";

export default function Scene({ habitatId, mainFileUrl, mobileFileUrl}) {
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

  const [isScreenTouched, setIsScreenTouched] = useState(false);
  const resetScreenTouchTimerRef = useRef(null);
  const resetPorcupineTimerRef = useRef(null);

  const activationAudioRef = useRef(null);

  const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext);
  const objectsStatus = sceneConfig.bloomEffect.status || {};
  
  // Function to start oscillation for an object
const startOscillation = (objectName) => {
  setSceneConfig((prevConfig) => {
    const newStatus = { ...prevConfig.bloomEffect.status };
    for (const uuid in newStatus) {
      if (newStatus[uuid].name === objectName) {
        newStatus[uuid] = {
          ...newStatus[uuid],
          oscillate: true,
        };
      }
    }
    return {
      ...prevConfig,
      bloomEffect: {
        ...prevConfig.bloomEffect,
        status: newStatus,
      },
    };
  });
};

// Function to stop oscillation for an object
const stopOscillation = (objectName) => {
  setSceneConfig((prevConfig) => {
    const newStatus = { ...prevConfig.bloomEffect.status };
    for (const uuid in newStatus) {
      if (newStatus[uuid].name === objectName) {
        newStatus[uuid] = {
          ...newStatus[uuid],
          oscillate: false,
        };
      }
    }
    return {
      ...prevConfig,
      bloomEffect: {
        ...prevConfig.bloomEffect,
        status: newStatus,
      },
    };
  });
};

  // Inicializar os objetos de áudio uma vez
  useEffect(() => {
    activationAudioRef.current = new Audio(activationSound);
    activationAudioRef.current.volume = 1; // Ajusta o volume para 50%
  }, []);

  useEffect(() => {
    let touchTimer = null;
    let startX = null;
    let startY = null;

    const touchThreshold = 5; // Movement threshold in pixels

    const onTouchStart = (e) => {
      // Store the starting position
      if (e.touches && e.touches.length > 0) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else {
        startX = e.clientX;
        startY = e.clientY;
      }

      // Start the long-press timer
      touchTimer = setTimeout(() => {
        setIsScreenTouched(true);
        startScreenTouchResetTimer(); // Start the 7-second reset timer        
        console.log("Screen touched for 1 second");        
      }, 1000); // Long press duration: 1 second
    };

    const onTouchMove = (e) => {
      if (startX === null || startY === null) return;

      let currentX, currentY;
      if (e.touches && e.touches.length > 0) {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      } else {
        currentX = e.clientX;
        currentY = e.clientY;
      }

      const deltaX = Math.abs(currentX - startX);
      const deltaY = Math.abs(currentY - startY);

      if (deltaX > touchThreshold || deltaY > touchThreshold) {
        // User moved beyond the threshold; cancel the long-press detection
        if (touchTimer) {
          clearTimeout(touchTimer);
          touchTimer = null;
        }
        startX = null;
        startY = null;
      }
    };

    const onTouchEnd = () => {
      // Clear the long-press timer if the touch ends prematurely
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
      startX = null;
      startY = null;
    };

    // Add event listeners
    document.addEventListener("mousedown", onTouchStart);
    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("mousemove", onTouchMove);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("mouseup", onTouchEnd);
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("mouseleave", onTouchEnd);

    // Clean up event listeners on unmount
    return () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
      }
      document.removeEventListener("mousedown", onTouchStart);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("mousemove", onTouchMove);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("mouseup", onTouchEnd);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("mouseleave", onTouchEnd);
    };
  }, []);

  // Função para iniciar o temporizador de reset para isScreenTouched
  const startScreenTouchResetTimer = () => {
    if (resetScreenTouchTimerRef.current) {
      clearTimeout(resetScreenTouchTimerRef.current);
    }
    resetScreenTouchTimerRef.current = setTimeout(() => {
      if (transcript === '') {
        setIsScreenTouched(false);
        console.log("Nenhum áudio detectado após 7 segundos, resetando isScreenTouched");
      }
    }, 7000); // Resetar após 7 segundos
  };

  // Função para iniciar o temporizador de reset para isPorcupine
  const startPorcupineResetTimer = () => {
    if (resetPorcupineTimerRef.current) {
      clearTimeout(resetPorcupineTimerRef.current);
    }
    resetPorcupineTimerRef.current = setTimeout(() => {
      if (transcript === '') {
        stopOscillation("Peito");
        setIsPorcupine(false);
        console.log("Nenhum áudio detectado após 7 segundos, resetando isPorcupine");
      }
    }, 7000); // Resetar após 7 segundos
  };

  // useEffect para monitorar isScreenTouched e iniciar o temporizador
  useEffect(() => {
    if (isScreenTouched) {
      activationAudioRef.current.play();
      startOscillation("Peito");
      startScreenTouchResetTimer();
    } else {
      if (resetScreenTouchTimerRef.current) {
        stopOscillation("Peito");
        clearTimeout(resetScreenTouchTimerRef.current);
        resetScreenTouchTimerRef.current = null;
      }
    }
  }, [isScreenTouched]);

  // useEffect para monitorar isPorcupine e iniciar o temporizador
  useEffect(() => {
    if (isPorcupine) {
      activationAudioRef.current.play();
      startOscillation("Peito");
      startPorcupineResetTimer();      
    } else {
      if (resetPorcupineTimerRef.current) {
        stopOscillation("Peito");
        clearTimeout(resetPorcupineTimerRef.current);
        resetPorcupineTimerRef.current = null;
      }
    }
  }, [isPorcupine]);

  // useEffect para monitorar transcript e limpar temporizadores quando necessário
  useEffect(() => {
    if (transcript !== '') {
      // Se transcript não está vazio, limpar ambos os temporizadores
      if (resetScreenTouchTimerRef.current) {
        clearTimeout(resetScreenTouchTimerRef.current);
        resetScreenTouchTimerRef.current = null;
        stopOscillation("Peito");
      }
      if (resetPorcupineTimerRef.current) {
        clearTimeout(resetPorcupineTimerRef.current);
        resetPorcupineTimerRef.current = null;
        stopOscillation("Peito");
      }
    }
  }, [transcript]);

  // Certifique-se de limpar os temporizadores quando o componente desmontar
  useEffect(() => {
    return () => {
      if (resetScreenTouchTimerRef.current) {
        clearTimeout(resetScreenTouchTimerRef.current);
        stopOscillation("Peito");
      }
      if (resetPorcupineTimerRef.current) {
        clearTimeout(resetPorcupineTimerRef.current);
        stopOscillation("Peito");
      }
    };
  }, []);
  ////////////////////////


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
      setIsScreenTouched(false);
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

      {(isScreenTouched || isPersonDetected || isPorcupine) && !showQuestion && transcript === '' && isFinished && (
        <Transcript setTranscript={setTranscript} />
      )}
      {console.log(isScreenTouched,isPersonDetected,isPorcupine,!showQuestion,transcript === '',isFinished, 'último: ',(isScreenTouched || isPersonDetected || isPorcupine) && transcript === '')}

      {!isPorcupine && (
        <Porcupine setIsPorcupine={setIsPorcupine}/>
      )}

      <AnimationController />

      {(/*isValidUrl &&*/ components && world && modelLoaded && 
      <Welcome
        isPersonDetected={isPersonDetected}
        isPorcupine={isPorcupine}
        isScreenTouched={isScreenTouched}
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