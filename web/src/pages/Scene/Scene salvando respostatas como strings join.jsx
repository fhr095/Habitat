import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { saveInteraction } from "../../firebase";
import { v4 as uuidv4 } from "uuid";

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
import RotateIndicator from './components/RotateIndicator/RotateIndicator';
import WebCan from "./components/WebCan/WebCan";

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

  const [modelUrl, setModelUrl] = useState("");
  const [modelUrlMain, setModelUrlMain] = useState(null);
  const [modelUrlMobile, setModelUrlMobile] = useState(null);
  const [components, setComponents] = useState(null);
  const [world, setWorld] = useState(null);
  const [camera, setCamera] = useState(null);
  const [model1Loaded, setModel1Loaded] = useState(false);
  const [model2Loaded, setModel2Loaded] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [fade, setFade] = useState([]);
  const [response, setResponse] = useState({ comandos: [] });
  
  // Estados antigos, caso necessários para o Welcome ou outros componentes:
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [persons, setPersons] = useState([]);
  const [currentPerson, setCurrentPerson] = useState(null);
  
  const [showQuestion, setShowQuestion] = useState(false);
  const [history, setHistory] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isPorcupine, setIsPorcupine] = useState(false);
  const [isScreenTouched, setIsScreenTouched] = useState(false);
  const [isVoiceButtonPressed, setIsVoiceButtonPressed] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [usersDetected, setUsersDetected] = useState([]); // Lista de usuários capturados do WebCan

  const resetScreenTouchTimerRef = useRef(null);
  const resetPorcupineTimerRef = useRef(null);
  const activationAudioRef = useRef(new Audio(activationSound));
  const resetTimerRef = useRef(null);
  const webCanRef = useRef(null); // Referência para o WebCan

  // Dentro do Scene.jsx

const [debugInfo, setDebugInfo] = useState({
  identifiedUsers: [],
  rawDetections: [],
  knownUsers: []
});

// Flag para evitar chamadas simultâneas
const isCapturingRef = useRef(false);


  const handleStartListening = () => {
    setIsListening(true);
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
  };
  
  const handleStopListening = () => {
    setIsListening(false);
    stopOscillation("Peito");
  
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  useEffect(() => {
    activationAudioRef.current.volume = 1.0;
  }, []);

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
  
  const startOscillation = (objectName) => toggleOscillation(objectName, true);
  const stopOscillation = (objectName) => toggleOscillation(objectName, false);

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
  }, [isListening, transcript]);

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

  useEffect(() => {
    const fetchHabitatData = async () => {
      try {
        const habitatRef = doc(db, "habitats", id);
        const habitatDoc = await getDoc(habitatRef);
  
        if (habitatDoc.exists()) {
          const habitatData = habitatDoc.data();
          setHabitatData(habitatData);
          console.log("habitatDocdata: ",habitatData);
  
          const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
          const selectedUrl = isMobileDevice ? habitatData.mobileFileUrl : habitatData.mainFileUrl;
          setModelUrl(selectedUrl);
          setModelUrlMain(habitatData.mainFileUrl);
          setModelUrlMobile(habitatData.mobileFileUrl);
          setIsValidUrl(true);
        } else {
          console.error("No such document!");
          setModelUrlMobile("");
        }
      } catch (error) {
        console.error("Error fetching habitat data: ", error);
      }
    };
  
    fetchHabitatData();
  }, [id]);

  useEffect(() => {
    if (mainFileUrl || mobileFileUrl) {
      const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
      const selectedUrl = isMobileDevice ? mobileFileUrl : mainFileUrl;
      setModelUrl(selectedUrl);
      setIsValidUrl(true);
    } else {
      setIsValidUrl(false);
    }
  }, [habitatId, mainFileUrl, mobileFileUrl]);

  useEffect(() => {
    if (!currentPerson) {
      setTranscript("");
      setIsPorcupine(false);
    }
  }, [currentPerson]);

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

  const [animationKey, setAnimationKey] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prevKey => prevKey + 1);
    }, 15000);
  
    return () => clearInterval(interval);
  }, []);

  // Quando o transcript é atualizado e não está vazio, capturamos os usuários atuais
  useEffect(() => {
    const captureUsers = async () => {
      if (transcript === "" || !webCanRef.current) return;

      // Verifica se já está capturando
      if (isCapturingRef.current) {
        console.warn("Já está capturando usuários. Ignorando nova chamada.");
        return;
      }

      isCapturingRef.current = true;
      console.log("Iniciando captura de usuários...");

      try {
        const { identifiedUsers, rawDetections } = await webCanRef.current.captureCurrentUsers();
        setUsersDetected(identifiedUsers);

        const knownPersons = webCanRef.current.getKnownPersons();
        setDebugInfo({
          identifiedUsers,
          rawDetections,
          knownUsers: knownPersons
        });
      } catch (error) {
        console.error("Erro ao capturar usuários:", error);
      } finally {
        isCapturingRef.current = false;
      }
    };

    captureUsers();
  }, [transcript]);

   // Quando a resposta chega, salvamos a interação no Firebase
   useEffect(() => {
    console.log("usersDetected:", usersDetected);
    if (response && response.comandos && response.comandos.length > 0 && usersDetected.length > 0) {
      const response_text = response.comandos.map(c => c.texto).join(" ");
      const response_fade = response.comandos.map(c => c.fade).join(",");
      const question = transcript;
      const id_interaction = uuidv4();
      const ratings = null;
      const timestamp = Date.now();

      // Agrupar usersDetected por user.id
      const groupedUsers = usersDetected.reduce((acc, user) => {
        if (!acc[user.id]) {
          acc[user.id] = {
            ...user,
            emotionCounts: {}
          };
        }
        // Contar as ocorrências de cada emoção
        acc[user.id].emotionCounts[user.emotion] = (acc[user.id].emotionCounts[user.emotion] || 0) + 1;
        return acc;
      }, {});

      // Selecionar a emoção mais frequente para cada usuário
      const processedUsers = Object.values(groupedUsers).map(user => {
        const { emotionCounts, ...rest } = user;
        let selectedEmotion = "neutral"; // Valor padrão

        // Encontrar a emoção com maior contagem
        let maxCount = 0;
        for (const [emotion, count] of Object.entries(emotionCounts)) {
          if (count > maxCount) {
            maxCount = count;
            selectedEmotion = emotion;
          }
        }

        return {
          ...rest,
          emotion: selectedEmotion
        };
      });

      console.log("Processed Users for Interaction:", processedUsers);

      // Salvar interação para cada usuário processado
      processedUsers.forEach(user => {
        const interactionData = {
          id_interaction,
          question,
          ratings,
          response_text,
          response_fade,
          user_id: user.id,
          age: user.age,
          gender: user.gender,
          emotion: user.emotion,
          timestamp
        };
        saveInteraction(interactionData)
          .then(() => console.log(`Interação salva para usuário ${user.id}`))
          .catch(err => console.error("Erro ao salvar interação:", err));
      });
    }
  }, [response, transcript, usersDetected]);


  return (
    <div className="scene-container">
      <RotateIndicator />
      <div className="welcome-container">
        {!isListening && transcript ==="" && (
          <p className="welcome" key={animationKey}>
            <span className="typing">Olá, me faça uma pergunta!</span>
          </p>
        )}
      </div>

      {/* Setup da cena */}
      {<SetupScene
        modelUrl={modelUrl}
        setComponents={setComponents}
        setWorld={setWorld}
      />}

      {components && world && modelUrlMain && modelUrlMain.length > 0 && (
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

      {console.log(isListening,!showQuestion, transcript === '', isFinished)}
      {isListening && !showQuestion && transcript === '' && (
        <Transcript setTranscript={setTranscript} />
      )}

      {!isPorcupine && (
        <Porcupine setIsPorcupine={setIsPorcupine} />
      )}

      <AnimationController />

      <VoiceButton
        onStartListening={handleStartListening}
        onStopListening={handleStopListening}
        isDisabled={false}
        transcript={transcript}
      />

      {transcript === "" && (
        <div className="buttons-container">
          <div className="fastButtons-list">
            <button
              onClick={() => {
                console.log("Fast Button Clicked");
                setTranscript("Onde fica o banheiro mais próximo?");
              }}
              onTouchStart={() => {
                console.log("Fast Button Touched");
                setTranscript("Onde fica o banheiro mais próximo?");
              }}
              className="fastButton"
              style={{ "--order": 1 }}
            >
              Onde fica o banheiro mais próximo?
            </button>
            <button
              onClick={() => {
                console.log("Fast Button Clicked");
                setTranscript("Estou com fome, onde me recomenda comer?");
              }}
              onTouchStart={() => {
                console.log("Fast Button Touched");
                setTranscript("Estou com fome, onde me recomenda comer?");
              }}
              className="fastButton"
              style={{ "--order": 2 }}
            >
              Estou com fome, onde me recomenda comer?
            </button>
            <button
              onClick={() => {
                console.log("Fast Button Clicked");
                setTranscript("Como faço para protocolar um projeto?");
              }}
              onTouchStart={() => {
                console.log("Fast Button Touched");
                setTranscript("Como faço para protocolar um projeto?");
              }}
              className="fastButton"
              style={{ "--order": 3 }}
            >
              Como faço para protocolar um projeto?
            </button>
          </div>
        </div>
      )}

      {components && world && model1Loaded && (
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
      )}

{debugInfo && (
  <div style={{
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    padding: '10px',
    fontSize: '12px',
    zIndex: 9999,
    maxWidth: '300px',
    overflowY: 'auto',
    maxHeight: '50vh'
  }}>
    <h4>Depuração</h4>

    <h5>Known Users:</h5>
    {debugInfo.knownUsers.length === 0 ? <p>Nenhum usuário conhecido</p> : (
      debugInfo.knownUsers.map((u, idx) => (
        <div key={idx}>
          <p>ID: {u.userId}</p>
          <p>Descriptor length: {u.descriptor ? u.descriptor.length : 'Nenhum'}</p>
          <hr />
        </div>
      ))
    )}

    <h5>Usuários Identificados Agora:</h5>
    {debugInfo.identifiedUsers.length === 0 ? <p>Nenhum usuário identificado</p> : (
      debugInfo.identifiedUsers.map((u, idx) => (
        <div key={idx}>
          <p>ID: {u.id}</p>
          <p>Idade: {u.age}</p>
          <p>Gênero: {u.gender}</p>
          <p>Emoção: {u.emotion}</p>
          <hr />
        </div>
      ))
    )}

    <h5>Detecções Brutas (3 frames):</h5>
    {debugInfo.rawDetections.map((d, idx) => (
      <div key={idx}>
        <p>Idade: {Math.floor(d.age)} | Gênero: {d.gender} | Emoção: {d.emotion}</p>
        <p>Descritor length: {d.descriptor ? d.descriptor.length : 'Nenhum'}</p>
        <hr />
      </div>
    ))}
  </div>
)}

      <WebCan ref={webCanRef} />
    </div>
  );
}
