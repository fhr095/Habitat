import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import * as TWEEN from "@tweenjs/tween.js";
import { BiSolidLike, BiSolidDislike } from "react-icons/bi";
import { ModelContext } from "../../../../context/ModelContext"; 
import { SceneConfigContext } from "../../../../context/SceneConfigContext";
import eventBus from "../../../../eventBus";
import { cinematicFocusOnObject, returnToOriginalCamera, partialReturnToOriginalCamera } from "../Model/FocusOnObject";
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

  // Armazena a posição original da câmera, o alvo e o fov (para retornos)
  const originalCameraPositionRef = useRef();
  const originalControlsTargetRef = useRef();
  const originalFovRef = useRef();

  // Atualiza os tweens a cada frame
  useEffect(() => {
    const animate = (time) => {
      requestAnimationFrame(animate);
      TWEEN.update(time);
    };
    requestAnimationFrame(animate);
  }, []);

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
    if (!loading && response.comandos.length > 0) {
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

  const playAudioSequentially = async (index) => {
    console.log("Playing command index:", index);
    if (index === 0) {
      if (camera && controls) {
        originalCameraPositionRef.current = camera.position.clone();
        originalControlsTargetRef.current = controls.target.clone();
        originalFovRef.current = camera.fov;
      }
    } else {
      // Entre transições, retorna à posição original sem alterar o fov
      await partialReturnToOriginalCamera(
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
        focusPromise = cinematicFocusOnObject(comando.fade, scene, camera, controls, audioDuration, {
          zoomFactor: 0.8, // reduz o fov em 20%
          lateralOffset: undefined, // usa o padrão (calculado com base na distância)
        });
      }
      await Promise.all([audioPromise, focusPromise]);
      playAudioSequentially(index + 1);
    } else {
      // Ao final do ciclo, retorna à posição original e restaura o fov de forma suave
      await returnToOriginalCamera(
        originalCameraPositionRef.current,
        originalControlsTargetRef.current,
        originalFovRef.current,
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
      // Exemplo: salvamento de feedback (ajuste conforme sua lógica)
      // const feedbackRef = doc(collection(db, `habitats/${habitatId}/feedback`));
      // await setDoc(feedbackRef, feedbackData);
    } catch (error) {
      console.error("Erro ao enviar feedback: ", error);
    }
    setShowFeedback(false);
  };

  return (
    <div className="response-container">
      {showQuestion && transcript && (
        <div className="question">
          <p>{transcript}</p>
        </div>
      )}
      {loading ? (
        <div className="loading-response">
          <Avatar animation={animation} />
          <div className="loading-response-text">
            <p>Carregando Resposta...</p>
          </div>
        </div>
      ) : (
        <div className={`response ${response.comandos.length === 0 ? "response-exit" : ""}`}>
          {response.comandos.length > 0 && (
            <>
              <Avatar animation={animation} />
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
    </div>
  );
}
