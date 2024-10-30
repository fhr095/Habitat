import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Response from "./components/Response/Response";
import Transcript from "./components/Transcript/Transcript";
import VoiceButton from "./components/VoiceButton/VoiceButton";

import { SceneConfigContext } from "../../context/SceneConfigContext";

import activationSound from '/sounds/button-on.mp3';

import "./Scene.scss";

export default function Scene({ habitatId, mainFileUrl, mobileFileUrl }) {
  const { id } = useParams();
  const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [habitatData, setHabitatData] = useState({});

  // Estados relacionados à cena e modelos
  const [modelUrl, setModelUrl] = useState("");
  const [modelUrlMain, setModelUrlMain] = useState(null);
  const [modelUrlMobile, setModelUrlMobile] = useState(null);

  // Estados relacionados à interação
  const [transcript, setTranscript] = useState("");
  const [fade, setFade] = useState([]);
  const [response, setResponse] = useState({ comandos: [] });
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [history, setHistory] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isPorcupine, setIsPorcupine] = useState(false);
  const [isScreenTouched, setIsScreenTouched] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Referências para temporizadores e áudio
  const resetTimerRef = useRef(null);
  const activationAudioRef = useRef(new Audio(activationSound));

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

  // Função para iniciar a escuta
  const handleStartListening = () => {
    setIsListening(true);
    activationAudioRef.current.play();
    startOscillation("Peito");

    // Iniciar o temporizador para resetar se não houver entrada de áudio
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    resetTimerRef.current = setTimeout(() => {
      if (transcript === "") {
        setIsListening(false);
        stopOscillation("Peito");
        console.log("No audio detected after 7 seconds, resetting listening");
      }
    }, 7000);
  };

  // Função para parar a escuta
  const handleStopListening = () => {
    setIsListening(false);
    stopOscillation("Peito");

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  // Inicializa o áudio uma vez
  useEffect(() => {
    activationAudioRef.current.volume = 1.0; // Volume máximo
  }, []);

  // Efeito para monitorar o transcript e limpar temporizadores quando necessário
  useEffect(() => {
    if (transcript !== '') {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
        stopOscillation("Peito");
      }
      // Outros resets se necessário
    }
  }, [transcript]);

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
          console.log("habitatDocdata: ", habitatData);

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

  return (
    <div className="scene-container">
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

      {console.log(isListening, !showQuestion, transcript === '', isFinished)}
      {isListening && !showQuestion && transcript === '' /* && isFinished */ && (
        <Transcript setTranscript={setTranscript} />
      )}

      <VoiceButton
        onStartListening={handleStartListening}
        onStopListening={handleStopListening}
        isDisabled={false}
        transcript={transcript}
      />
    </div>
  );
}
