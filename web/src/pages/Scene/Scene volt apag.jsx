import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Model from "./components/Model/Model";
import Model1 from "./components/Model/Model1";
import Model2 from "./components/Model/Model2";
import ModelSelector from "./components/Model/ModelSelector";
import Response from "./components/Response/Response";
import Welcome from "./components/Welcome/Welcome";
import Transcript from "./components/Transcript/Transcript";
import Porcupine from "./components/Porcupine/Porcupine";
import SetupScene from "./components/SetupScene/SetupScene";
import VoiceButton from "./components/VoiceButton/VoiceButton";
import AnimationController from "./components/AnimationController/AnimationController";
import WebCan from "./components/WebCan/WebCan";
import ControlPanel from "./components/ControlPanel/ControlPanel";

import { SceneConfigContext } from "../../context/SceneConfigContext";
import { ModelContext } from "../../context/ModelContext";

import activationSound from '/sounds/button-on.mp3';

import "./Scene.scss";


export default function Scene({ habitatId, mainFileUrl, mobileFileUrl }) {
  const { id } = useParams();
  const { currentModel } = useContext(ModelContext);
  const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [habitatData, setHabitatData] = useState({});

  // Estados relacionados à cena e modelos
  const [modelUrl, setModelUrl] = useState("");
  const [modelUrlMain, setModelUrlMain] = useState(null);
  const [modelUrlMobile, setModelUrlMobile] = useState(null);
  const [components, setComponents] = useState(null);
  const [world, setWorld] = useState(null);
  const [camera, setCamera] = useState(null);
  const [model1Loaded, setModel1Loaded] = useState(false);
  const [model2Loaded, setModel2Loaded] = useState(false);


  // Estados relacionados à interação
  const [transcript, setTranscript] = useState("");
  const [fade, setFade] = useState([]);
  const [response, setResponse] = useState({ comandos: [] });
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [persons, setPersons] = useState([]);
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [history, setHistory] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isPorcupine, setIsPorcupine] = useState(false);
  const [isScreenTouched, setIsScreenTouched] = useState(false);
  const [isVoiceButtonPressed, setIsVoiceButtonPressed] = useState(false);
const [isListening, setIsListening] = useState(false);

  // Referências para temporizadores e áudio
  const resetScreenTouchTimerRef = useRef(null);
  const resetPorcupineTimerRef = useRef(null);
  const activationAudioRef = useRef(new Audio(activationSound));


/*
  // Function to handle start listening
  const handleStartListening = () => {
    
    setIsListening(true);
  };

  // Function to handle stop listening
  const handleStopListening = () => {
    setIsListening(false);
  };
*/
  // Function to handle start listening
const handleStartListening = () => {
  setIsVoiceButtonPressed(true);
};

// Function to handle stop listening
const handleStopListening = () => {
  setIsVoiceButtonPressed(false);
};



  // Inicializa o áudio uma vez
  useEffect(() => {
    activationAudioRef.current.volume = 1.0; // Volume máximo
  }, []);

  // Função para alternar a oscilação de um objeto
  const toggleOscillation = (objectName, shouldOscillate) => {
    setSceneConfig((prevConfig) => {
      const newStatus = { ...prevConfig.model1.bloomEffect.status };
      for (const uuid in newStatus) {
        if (newStatus[uuid].name === objectName) {
          newStatus[uuid] = {
            ...newStatus[uuid],
            oscillate: shouldOscillate,
          };
        }
      }
      return {
        ...prevConfig,
        model1: {
          ...prevConfig.model1,
          bloomEffect: {
            ...prevConfig.model1.bloomEffect,
            status: newStatus,
          },
        },
      };
    });
  };
  
  // Funções específicas para iniciar e parar a oscilação
  const startOscillation = (objectName) => toggleOscillation(objectName, true);
  const stopOscillation = (objectName) => toggleOscillation(objectName, false);

  // Função genérica para iniciar o temporizador de reset
  const startResetTimer = (resetType) => {
    const timerRef =
      resetType === 'touch' ? resetScreenTouchTimerRef : resetPorcupineTimerRef;
    const stopFunction =
      resetType === 'touch' ? () => setIsScreenTouched(false) : () => setIsPorcupine(false);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (transcript === '') {
        stopFunction();
        stopOscillation("Peito");
        console.log(`Nenhum áudio detectado após 7 segundos, resetando ${resetType}`);
      }
    }, 7000); // Resetar após 7 segundos
  };
/*
  // Efeitos para monitorar isScreenTouched e isPorcupine
  useEffect(() => {
    if (isScreenTouched) {
      activationAudioRef.current.play();
      startOscillation("Peito");
      startResetTimer('touch');
    } else {
      if (resetScreenTouchTimerRef.current) {
        clearTimeout(resetScreenTouchTimerRef.current);
        resetScreenTouchTimerRef.current = null;
        stopOscillation("Peito");
      }
    }
  }, [isScreenTouched]);

  useEffect(() => {
    if (isPorcupine) {
      activationAudioRef.current.play();
      startOscillation("Peito");
      startResetTimer('porcupine');
    } else {
      if (resetPorcupineTimerRef.current) {
        clearTimeout(resetPorcupineTimerRef.current);
        resetPorcupineTimerRef.current = null;
        stopOscillation("Peito");
      }
    }
  }, [isPorcupine]);
*/
  // Remove the existing useEffect hooks for isScreenTouched and isPorcupine

// Add a new useEffect to manage isListening
useEffect(() => {
  if (isScreenTouched || isPorcupine || isVoiceButtonPressed) {
    setIsListening(true);
    console.log("Ouvindo?:", isListening)
  } else {
    setIsListening(false);
  }
}, [isScreenTouched, isPorcupine, isVoiceButtonPressed]);




const resetTimerRef = useRef(null);

useEffect(() => {
  if (isListening) {
    activationAudioRef.current.play();
    startOscillation("Peito");

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    resetTimerRef.current = setTimeout(() => {
      if (transcript === "") {
        setIsListening(false);
        stopOscillation("Peito");
        console.log("No audio detected after 7 seconds, resetting listening");
      }
    }, 7000);
  } else {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
      stopOscillation("Peito");
    }
  }
}, [isListening]);




  // Efeito para monitorar transcript e limpar temporizadores quando necessário
  useEffect(() => {
    if (transcript !== '') {
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

  // Limpeza de temporizadores ao desmontar o componente
 /* useEffect(() => {
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
  }, []);*/

  // Lógica de toque na tela (long press)
 /*useEffect(() => {
    let touchTimer = null;
    let startX = null;
    let startY = null;

    const touchThreshold = 5; // Limite de movimento em pixels

    const onTouchStart = (e) => {
      if (e.target.closest('.voice-button-container')) {
        return;
      }
      if (e.touches && e.touches.length > 0) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else {
        startX = e.clientX;
        startY = e.clientY;
      }

      touchTimer = setTimeout(() => {
        setIsScreenTouched(true);
        console.log("Tela pressionada por 1 segundo");
      }, 1000); // Duração do long press: 1 segundo
    };

    const onTouchMove = (e) => {
      if (e.target.closest('.voice-button-container')) {
        return;
      }
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
        if (touchTimer) {
          clearTimeout(touchTimer);
          touchTimer = null;
        }
        startX = null;
        startY = null;
      }
    };

    const onTouchEnd = () => {
      
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
      startX = null;
      startY = null;
    };

    // Adicionar event listeners
    document.addEventListener("mousedown", onTouchStart);
    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("mousemove", onTouchMove);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("mouseup", onTouchEnd);
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("mouseleave", onTouchEnd);

    // Limpeza ao desmontar
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
  }, []);*/

  // Fetch dos dados do habitat
  useEffect(() => {
    const fetchHabitatData = async () => {
      try {
        // Obter referência ao documento do Firebase
        const habitatRef = doc(db, "habitats", id);
        const habitatDoc = await getDoc(habitatRef);
  
        if (habitatDoc.exists()) {
          const habitatData = habitatDoc.data();
          setHabitatData(habitatData);
          console.log("habitatDocdata: ",habitatData);
  
          // Verificar se o dispositivo é móvel
          const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
  
          // Selecionar a URL correta com base no dispositivo
          const selectedUrl = isMobileDevice ? habitatData.mobileFileUrl : habitatData.mainFileUrl;
          setModelUrl(selectedUrl);
          setModelUrlMain(habitatData.mainFileUrl);
          setModelUrlMobile(habitatData.mobileFileUrl);
          setIsValidUrl(true);
        } else {
          console.error("No such document!");
          //setIsValidUrl(false);
          setModelUrlMobile(habitatData.mobileFileUrl);
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

  // Lidar com a ausência de currentPerson
  useEffect(() => {
    if (!currentPerson) {
      setTranscript("");
      setIsPorcupine(false);
    }
  }, [currentPerson]);

  // Resetar estados quando transcript estiver vazio
  useEffect(() => {
    if (transcript === "") {
      setIsPorcupine(false);
      setIsScreenTouched(false);
      setIsListening(false);
    }
  }, [transcript]);

  const onLoadModel1 = useCallback(() => {
    console.log("Modelo 1 carregado!");
    setModel1Loaded(true);
    
  }, [setModel1Loaded]);

  const onLoadModel2 = useCallback(() => {
    console.log("Modelo 2 carregado!");
    setModel2Loaded(true);
  }, [setModel2Loaded]);


  return (
    <div className="scene-container">
      {/*<ControlPanel />*/}
      {/* Setup da cena */}
      {/*<SetupScene
        //setCamera={setCamera}
        modelUrl={modelUrl}
        setComponents={setComponents}
        setWorld={setWorld}
      />*/}


      {/*<ModelSelector />*/}
      {/*components && world && modelUrlMain && modelUrlMain.length > 0 && (
        <Model1
          modelUrl={modelUrlMain}
          components={components}
          world={world}
          onLoad={onLoadModel1}
        />
      )}

      {components && world && modelUrlMobile && modelUrlMobile.length > 0 && (
        <Model2
          modelUrl={modelUrlMobile}
          components={components}
          world={world}
          onLoad={onLoadModel2}
        />
      )}
    {/* Botão para enviar "funcionamento" para o transcript */}
    {/*<button onClick={() => setTranscript('estacionamentos')}>
      Enviar "funcionamento"
    </button>*/}

      {/* Outros componentes */}
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

      {/*(isScreenTouched || /*isPersonDetected || isPorcupine) && !showQuestion && transcript === '' && isFinished && (
        <Transcript setTranscript={setTranscript} />
      )*/}
{console.log(isListening,!showQuestion, transcript === '', isFinished)}
{isListening && !showQuestion && transcript === ''/* && isFinished*/ && (
  <Transcript setTranscript={setTranscript} />
)}


      {!isPorcupine && (
        <Porcupine setIsPorcupine={setIsPorcupine} />
      )}

      <AnimationController />

      {/*<VoiceButton
          setTranscript={(newTranscript) => {
            setTranscript(newTranscript);
            setShowQuestionAndResponse(true);
            setIsResponseLoading(true);
          }}
          newTranscript={transcript}
        />*/}

<VoiceButton
    isListening={isListening}
    onStartListening={handleStartListening}
    onStopListening={handleStopListening}
    isDisabled={false}
    transcript={transcript}
  />


      {/*components && world && model1Loaded && (
        <Welcome
          isPersonDetected={isPersonDetected}
          isPorcupine={isPorcupine}
          isScreenTouched={isScreenTouched}
          history={history}
          transcript={transcript}
          avt={id}
          persons={persons}
          setIsFinished={setIsFinished}
        />
      )*/}

      {<WebCan
        setIsPersonDetected={setIsPersonDetected}
        setPersons={setPersons}
        setCurrentPerson={setCurrentPerson}
      />}
    </div>
  );
}
