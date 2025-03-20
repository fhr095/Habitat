import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import { BiSolidLike, BiSolidDislike } from "react-icons/bi";
import { ModelContext } from "../../../../context/ModelContext"; 
import { SceneConfigContext } from "../../../../context/SceneConfigContext";
import { useVisualizationMode } from "../../../../context/VisualizationModeContext";
import { objectMapper } from "../../utils/ObjectReferenceMapper";
import eventBus from "../../../../eventBus";
import { focusOnObject, returnToOriginalCamera } from "../Model/FocusOnObject";
import DestinationLabel from "../DestinationLabel/DestinationLabel";
import PathVisualization from "../DestinationLabel/PathVisualization";
import LocationLabel from "../LocationLabel/LocationLabel";
import Avatar from "./Avatar";
import "./Response.scss";

export default function Response({
  habitatId,
  avt,
  transcript,
  setTranscript,
  setFade,
  showQuestion,
  setShowQuestion,
  response,
  setResponse,
  history,
  setHistory,
}) {
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [animation, setAnimation] = useState("pensando");
  const [progress, setProgress] = useState(0);
  const previousTranscriptRef = useRef("");
  const { setCurrentModel } = useContext(ModelContext);
  const { scene, camera, controls } = useContext(SceneConfigContext);
  const { currentMode } = useVisualizationMode();

  // Estados para controle de navegação e destino
  const [destinationObject, setDestinationObject] = useState(null);
  const [destinationName, setDestinationName] = useState("");
  const [showDestination, setShowDestination] = useState(false);
  const [youAreHereObject, setYouAreHereObject] = useState(null);
  const [youAreHerePosition, setYouAreHerePosition] = useState(null);
  const [destinationPosition, setDestinationPosition] = useState(null);
  const [showPathVisualization, setShowPathVisualization] = useState(false);
  const [selectedPathType, setSelectedPathType] = useState(2); // 0 = linha, 1 = pontilhado, 2 = setas
  
  // Usar a cor secundária do design system em vez da cor personalizada anterior
  const [destinationColor, setDestinationColor] = useState(0x2A7AE9);

  // Referências para os componentes de label
  const locationLabelRef = useRef(null);
  const destinationLabelRef = useRef(null);

  // Armazena a posição original da câmera e o alvo dos controles (para retornos)
  const originalCameraPositionRef = useRef();
  const originalControlsTargetRef = useRef();

  // Referência para o marcador "você está aqui"
  const youAreHereRef = useRef();

  // Timer para auto-desaparecer da navegação após alguns segundos
  const hideNavigationTimerRef = useRef(null);

  // Atualiza os tweens a cada frame
  useEffect(() => {
    const animate = (time) => {
      requestAnimationFrame(animate);
      TWEEN.update(time);
    };
    requestAnimationFrame(animate);
  }, []);

  // Busca o objeto "Você está aqui" ao montar o componente
  useEffect(() => {
    if (scene) {
      findYouAreHereMarker();
    }
  }, [scene]);

  // Função para encontrar o marcador "Você está aqui"
  const findYouAreHereMarker = () => {
    if (!scene) return;

    scene.traverse((object) => {
      if (object.isMesh || object.isGroup) {
        const name = object.name.toLowerCase();
        if (name.includes("você_está_aqui") || name.includes("voce_esta_aqui")) {
          console.log("Objeto 'Você está aqui' encontrado:", object.name);
          setYouAreHereObject(object);
          
          // Calcula e armazena a posição global
          const position = new THREE.Vector3();
          object.getWorldPosition(position);
          setYouAreHerePosition(position);
          youAreHereRef.current = object;
        }
      }
    });
  };

  // Função para buscar um objeto na cena pelo nome
  const findObjectByName = (targetName) => {
    if (!scene || !targetName) return null;

    // Primeiro, verifica se podemos usar o ObjectReferenceMapper
    if (objectMapper && typeof objectMapper.findObjectsByName === 'function') {
      const objects = objectMapper.findObjectsByName(targetName, scene, currentMode);
      if (objects && objects.length > 0) {
        console.log(`Objeto "${targetName}" encontrado via ObjectReferenceMapper:`, objects[0].name);
        return objects[0];
      }
    }

    // Busca tradicional como fallback
    let foundObject = null;
    scene.traverse((object) => {
      if ((object.isMesh || object.isGroup) && !foundObject) {
        // Normalizar nomes para comparação
        const normalizedName = object.name.replace(/[-_\s]+/g, "_").toLowerCase();
        const normalizedTarget = targetName.replace(/[-_\s]+/g, "_").toLowerCase();
        
        if (normalizedName.includes(normalizedTarget) || normalizedTarget.includes(normalizedName)) {
          foundObject = object;
        }
      }
    });

    if (foundObject) {
      console.log(`Objeto "${targetName}" encontrado via busca tradicional:`, foundObject.name);
    } else {
      console.warn(`Objeto "${targetName}" não encontrado na cena.`);
    }

    return foundObject;
  };

  // Função para limpar o timer de ocultação da navegação
  const clearHideNavigationTimer = () => {
    if (hideNavigationTimerRef.current) {
      clearTimeout(hideNavigationTimerRef.current);
      hideNavigationTimerRef.current = null;
    }
  };

  // Função para configurar o destino
  const setupDestination = (targetName) => {
    clearHideNavigationTimer();
    
    // Busca o objeto destino
    const targetObject = findObjectByName(targetName);
    
    if (targetObject) {
      // Formata o nome para exibição
      const formattedName = targetName
        .replace(/_/g, " ")
        .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase()); // Capitaliza primeira letra de cada palavra
      
      setDestinationObject(targetObject);
      setDestinationName(formattedName);
      
      // Calcula e armazena a posição do destino
      const position = new THREE.Vector3();
      targetObject.getWorldPosition(position);
      setDestinationPosition(position);
      
      // Ativa a visualização do destino e do caminho
      setShowDestination(true);
      setShowPathVisualization(true);
      
      console.log(`Destino configurado: ${formattedName}`);
      
      // Configura timer para ocultar o destino após 30 segundos
      hideNavigationTimerRef.current = setTimeout(() => {
        setShowDestination(false);
        setShowPathVisualization(false);
      }, 30000);
    } else {
      console.warn(`Não foi possível encontrar o objeto "${targetName}" para navegação.`);
      setShowDestination(false);
      setShowPathVisualization(false);
    }
  };

  useEffect(() => {
    const filterTranscript = async (transcript) => {
      console.log("Filtering transcript:", transcript);
      try {
        const source = axios.CancelToken.source();
        const timeoutId = setTimeout(() => {
          source.cancel("Request timed out.");
        }, 5000);
        const filterResponse = await axios.post(
          "https://habitat-chatbot-test.netlify.app/.netlify/functions/filter",
          { message: transcript },
          { cancelToken: source.token }
        );
        clearTimeout(timeoutId);
        console.log("Filter response para:", transcript);
        console.log("Filter response:", filterResponse.data);
        return filterResponse.data;
      } catch (error) {
        if (axios.isCancel(error)) {
          console.warn("Filter request timed out. Sending transcript directly.");
          sendTranscript(transcript);
        } else {
          console.error("Error filtering transcript: ", error);
        }
        return { status: "error" };
      }
    };

    const sendTranscript = async (transcript, confirmacao = false) => {
      setLoading(true);
      setShowQuestion(true);
      try {
        const source = axios.CancelToken.source();
        const timeoutId = setTimeout(() => {
          source.cancel("Request timed out.");
        }, 20000);
        const res = await axios.post(
          "https://vps.felipehenriquerafael.tech/nodered/talkwithifc",
          {
            msg: transcript,
            avt: "centroadm",
            history: history,
            confirmacao,
          },
          { cancelToken: source.token }
        );
        clearTimeout(timeoutId);
        console.log("Sending transcript:", transcript);
        setResponse(res.data);
        setLoading(false);
        console.log("Received response:", res.data);
        setHistory((prevHistory) => {
          let newHistory = [
            ...prevHistory,
            {
              question: transcript,
              answer: res.data.comandos.map((c) => ({
                texto: c.texto,
                fade: c.fade,
              })),
            },
          ];
          if (newHistory.length > 3) {
            newHistory = newHistory.slice(2);
          }
          return newHistory;
        });
      } catch (error) {
        if (axios.isCancel(error)) {
          console.warn("sendTranscript request timed out. Resetting to allow new attempt.");
        } else {
          console.error("Error sending transcript: ", error);
        }
        setLoading(false);
        setShowFeedback(false);
        setResponse({ comandos: [] });
        setShowQuestion(false);
        setProgress(0);
        setTranscript("");
        eventBus.emit("processingEnded");
        previousTranscriptRef.current = "";
      }
    };

    if (transcript && transcript !== previousTranscriptRef.current) {
      previousTranscriptRef.current = transcript;
      (async () => {
        // const filterResult = await filterTranscript(transcript);
        if (true) {
          sendTranscript(transcript);
          eventBus.emit("processingStarted");
        } else if (false) {
          sendTranscript(transcript, true);
          eventBus.emit("processingStarted");
        } else {
          console.log("Transcript ignored by filter:", "justification");
          setLoading(false);
          setShowFeedback(false);
          setResponse({ comandos: [] });
          setShowQuestion(false);
          setProgress(0);
          setTranscript("");
          eventBus.emit("processingEnded");
          previousTranscriptRef.current = "";
        }
      })();
    }
  }, [transcript, avt, history, setHistory, setTranscript, setFade]);

  useEffect(() => {
    console.log("Current response:", response);
    if (!loading && response.comandos && response.comandos.length > 0) {
      playAudioSequentially(0);
    }
  }, [loading, response]);

  const loadAudio = (audioUrl) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        const duration = audio.duration * 1000;
        resolve({ audio, duration });
      };
      audio.onerror = () => {
        reject(new Error("Failed to load audio"));
      };
    });
  };

  // Versão atualizada de playAudioSequentially para trabalhar com ambos os modos e configurar navegação
  const playAudioSequentially = async (index) => {
    console.log("Playing command index:", index);
    if (index === 0) {
      if (camera && controls) {
        originalCameraPositionRef.current = camera.position.clone();
        originalControlsTargetRef.current = controls.target.clone();
      }
      
      // Reseta estados de navegação no início da sequência
      setShowDestination(false);
      setShowPathVisualization(false);
      clearHideNavigationTimer();
    } else {
      // Entre transições, retorna à posição original (com fade in rápido)
      await returnToOriginalCamera(
        originalCameraPositionRef.current,
        originalControlsTargetRef.current,
        scene,
        camera,
        controls
      );
    }
    
    if (index < response.comandos.length) {
      setCurrentIndex(index);
      const comando = response.comandos[index];
      let audioDuration = 2000;
      let audioPromise = Promise.resolve();
      let focusPromise = Promise.resolve();

      if (comando.audio) {
        try {
          const { audio, duration } = await loadAudio(comando.audio);
          audioDuration = Math.max(duration, 2000);
          setFade([{ fade: comando.fade, duration: audioDuration + 2000 }]);
          audio.play();
          eventBus.emit("processingEnded");
          eventBus.emit("audioStarted");
          audioPromise = new Promise((resolve) => {
            audio.onended = () => {
              eventBus.emit("audioEnded");
              resolve();
            };
          });
        } catch (error) {
          console.error(`Failed to load audio: ${comando.audio}`, error);
        }
      } else {
        audioDuration = 2000;
        setFade([{ fade: comando.fade, duration: audioDuration + 2000 }]);
      }

      if (comando.fade && comando.fade !== "Cidade Administrativa de MG" && comando.fade !== "null") {
        // Modificação aqui: Usar FocusOnObject aprimorado que funciona em ambos os modos
        focusPromise = focusOnObject(comando.fade, scene, camera, controls, audioDuration);
        
        // Configurar destino para navegação visual
        setupDestination(comando.fade);
        
        // Registro do alvo para depuração
        console.log(`Focusing on target: ${comando.fade} in ${currentMode} mode`);
      }
      
      await Promise.all([audioPromise, focusPromise]);
      playAudioSequentially(index + 1);
    } else {
      await returnToOriginalCamera(
        originalCameraPositionRef.current,
        originalControlsTargetRef.current,
        scene,
        camera,
        controls
      );
      resetStates();
    }
  };

  const resetStates = () => {
    setShowFeedback(true);
    startProgressBar();
    setTimeout(() => {
      setShowFeedback(false);
      setResponse({ comandos: [] });
      setShowQuestion(false);
      setProgress(0);
      setTranscript("");
      previousTranscriptRef.current = "";
    }, 3000);
    
    // Não removemos a navegação visual aqui para permitir que o usuário continue vendo o destino
    // mesmo após o término da resposta da IA
  };

  const startProgressBar = () => {
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += 1;
      setProgress(progressValue);
      if (progressValue >= 100) {
        clearInterval(interval);
      }
    }, 50);
  };

  const handleFeedback = async (type) => {
    const feedbackData = {
      question: transcript,
      response: response.map((r) => r.response).join(" "),
      feedback: type,
    };
    try {
      // Exemplo de salvamento de feedback (ajuste conforme sua lógica)
      // const feedbackRef = doc(collection(db, `habitats/${habitatId}/feedback`));
      // await setDoc(feedbackRef, feedbackData);
    } catch (error) {
      console.error("Erro ao enviar feedback: ", error);
    }
    setShowFeedback(false);
  };

  // Efeito para limpar efeitos temporários quando o componente desmontar
  useEffect(() => {
    return () => {
      // Limpar o timer de ocultação da navegação
      clearHideNavigationTimer();
      
      // Limpar quaisquer efeitos temporários quando o componente é desmontado
      if (scene) {
        scene.children.forEach(child => {
          if (child.userData && child.userData.isTemporaryEffect) {
            scene.remove(child);
          }
        });
      }
    };
  }, [scene]);

  return (
    <div className="response-container">
      {showQuestion && transcript && (
        <div className="question">
          <p>{transcript}</p>
        </div>
      )}
      {loading ? (
        <div className="loading-response">
          {/*<Avatar animation={animation} />*/}
          <div className="loading-response-text">
            <p>Carregando Resposta...</p>
          </div>
        </div>
      ) : (
        <div className={`response ${response.comandos && response.comandos.length === 0 ? "response-exit" : ""}`}>
          {response.comandos && response.comandos.length > 0 && (
            <>
             {/* <Avatar animation={animation} />*/}
              <div className="response-text">
                <p>{response.comandos[currentIndex]?.texto}</p>
                {showFeedback && (
                  <div className="feedback-container">
                    <div className="button-group">
                      <button onClick={() => handleFeedback("like")} className="like">
                        <BiSolidLike color="#333" size={20} />
                      </button>
                      <button onClick={() => handleFeedback("dislike")} className="dislike">
                        <BiSolidDislike color="#333" size={20} />
                      </button>
                    </div>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* LocationLabel - agora usa forwardRef para prevenir sobreposições */}
      {scene && camera && youAreHereObject && (
        <LocationLabel
          ref={locationLabelRef}
          world={{ scene, camera }}
          modelRef={{ current: scene }}
          targetMeshName="Você_está_aqui"
          destinationActive={showDestination} 
        />
      )}
      
      {/* Componentes de navegação visual */}
      {scene && camera && controls && destinationObject && showDestination && (
        <DestinationLabel
          ref={destinationLabelRef}
          world={{ scene, camera }}
          scene={scene}
          camera={camera}
          controls={controls}
          destinationObject={destinationObject}
          destinationName={destinationName}
          currentLocation={youAreHerePosition}
          isActive={showDestination}
          locationLabelRef={locationLabelRef} // Passar referência para evitar sobreposição
        />
      )}
      
      {scene && youAreHerePosition && destinationPosition && showPathVisualization && (
        <PathVisualization
          scene={scene}
          originPosition={youAreHerePosition}
          destinationPosition={destinationPosition}
          isActive={showPathVisualization}
          color={destinationColor}
          pathType={selectedPathType}
        />
      )}
    </div>
  );
}