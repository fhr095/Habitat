import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import * as TWEEN from "@tweenjs/tween.js";
import { BiSolidLike, BiSolidDislike } from "react-icons/bi";
import { ModelContext } from "../../../../context/ModelContext"; 
import { SceneConfigContext } from "../../../../context/SceneConfigContext";
import eventBus from '../../../../eventBus';
import { focusOnObject } from "../Model/FocusOnObject"; // Função para focar no objeto
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
    const [ultimo, setUltimo] = useState(false);
    const { setCurrentModel } = useContext(ModelContext); // Pega a função para controlar o modelo exibido
    const { scene, camera, controls, setSceneConfig } = useContext(SceneConfigContext); // Usar SceneConfigContext para pegar cena e câmera

    // Response.jsx


const { updateSceneConfigForModel } = useContext(SceneConfigContext);

useEffect(() => {
  if (!loading && response.comandos.length > 0) {            
    setCurrentModel("model2");
    updateSceneConfigForModel("model2");
    playAudioSequentially(0);
  } else {
    setCurrentModel("model1");
    updateSceneConfigForModel("model1");
  }
}, [loading, response, setCurrentModel, updateSceneConfigForModel]);



    useEffect(() => {
        const sendTranscript = async (transcript) => {
            setLoading(true);
            setShowQuestion(true);

            try {
                
                const res = await axios.post("https://13.59.188.36:1880/talkwithifc"/*"https://habitat-chatbot-test.netlify.app/.netlify/functions/respondgpt1"/*"https://habitat-avatar.netlify.app/.netlify/functions/response"*/, {
                    msg: transcript,
                    avt: "centroadm",
                    history: history, 
                });
                console.log("ENVIO:", transcript);
                setResponse(res.data);
                setLoading(false);
                //setAnimation("falando-sorrindo");
                console.log("ENVIO2:", res.data);
                // Atualiza o histórico com a nova interação
                setHistory(prevHistory => {
                    let newHistory = [
                        ...prevHistory,
                        {
                            question: transcript,
                            /*answer: res.data.map(c => ({
                                texto: c.response,
                                fade: c.fade,
                            })),*/
                            answer: res.data.comandos.map(c => ({
                                texto: c.texto,
                                fade: c.fade,
                            })),
                        }
                    ];

                    // Limitar o histórico a 3 itens, removendo os 2 primeiros se necessário
                    if (newHistory.length > 3) {
                        newHistory = newHistory.slice(2); // Remove os dois primeiros itens
                    }

                    return newHistory;
                });

            } catch (error) {
                console.error("Error sending transcript: ", error);
                setLoading(false);
                setShowFeedback(false);
                setResponse({ comandos: [] });
                //setAnimation("pensando");
                setShowQuestion(false);
                setProgress(0); // Reset progress bar
    
                // Reseta o transcript somente após todas as respostas serem processadas
                setTranscript("");
                eventBus.emit('processingEnded');
                previousTranscriptRef.current = "";
            }
        };

        if (transcript && transcript !== previousTranscriptRef.current) {
            previousTranscriptRef.current = transcript;
            sendTranscript(transcript);
            //setAnimation("pensando");
            eventBus.emit('processingStarted');

        }
    }, [transcript, avt, setFade, history, setHistory]);

    // Esse useEffect controla a mudança de modelo quando a resposta chega
    useEffect(() => {
        console.log("ENVIO3:", response);
        if (!loading && response.comandos.length > 0) {            
            setCurrentModel("model1"); // Exibir ambos os modelos quando a resposta chegar
            playAudioSequentially(0);
        } else {
            setCurrentModel("model1"); // Voltar para o modelo 1 quando não há resposta
        }
    }, [loading, response, setCurrentModel]);

    const loadAudio = (audioUrl) => {
        return new Promise((resolve, reject) => {
          const audio = new Audio(audioUrl);
          audio.onloadedmetadata = () => {
            const duration = audio.duration * 1000; // Convert to milliseconds
            resolve({ audio, duration });
          };
          audio.onerror = () => {
            reject(new Error('Failed to load audio'));
          };
        });
      };
      
    // Response.jsx
    const playAudioSequentially = async (index) => {
        console.log("ENVIO5:", index);
        if (index < response.comandos.length) {
          setCurrentIndex(index);
          const comando = response.comandos[index];
      
          let audioDuration = 2000; // Default duration
          let audioPromise = Promise.resolve(); // Default resolved promise
          let focusPromise = Promise.resolve(); // Default resolved promise
      
          if (comando.audio) {
            
            try {
              // **Load the audio and get the duration**
              const { audio, duration } = await loadAudio(comando.audio);
              audioDuration = Math.max(duration, 2000); // Ensure at least 2000 ms
      
              // **Set fade with the correct duration**
              setFade([{ fade: comando.fade, duration: audioDuration + 2000 }]); // Add 2 seconds of margin
      
              // **Start audio playback**
              audio.play();
              eventBus.emit('processingEnded');
              eventBus.emit('audioStarted');
      
              // **Set up a promise that resolves when the audio ends**
              audioPromise = new Promise((resolve) => {
                audio.onended = () => {
                  eventBus.emit('audioEnded');
                  resolve();
                };
              });
            } catch (error) {
              console.error(`Failed to load audio: ${comando.audio}`, error);
              // Continue without audio
            }
          } else {
            // No audio
            audioDuration = 2000; // Keep default duration
      
            // **Set fade with the default duration**
            setFade([{ fade: comando.fade, duration: audioDuration + 2000 }]); // Add 2 seconds of margin
          }
      
          // **Start focus on the object if 'fade' is defined**
          if (comando.fade && comando.fade != "Cidade Administrativa de MG") {
            console.log("FADE:", comando.fade);
            console.log("Scene:", scene);
            console.log("Camera:", camera);
            console.log("Controls:", controls);
            console.log("TEM AUDIO:", audioDuration);
            //setUltimo(false);
            setCurrentModel("model2");
            const isUltimo = (response.comandos.length - index === 1);
            const isPrimeiro = (index ===0);
            console.log("UTLTOMO SET:",response.comandos.length-index, isUltimo)            
            // **Start the focus operation**
            focusPromise = focusOnObject(comando.fade, scene, camera, controls, setSceneConfig, audioDuration);
            
          } else {
            setCurrentModel("model1");
          }
      
          // **Wait for both audio playback and focus operation to complete**
          await Promise.all([audioPromise, focusPromise]);
      
          // **Proceed to the next command**
          playAudioSequentially(index + 1);
        } else {
          // **All commands have been processed**
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
        }
      };
      
    

    const startProgressBar = () => {
        let progressValue = 0;
        const interval = setInterval(() => {
            progressValue += 1;
            setProgress(progressValue);
            if (progressValue >= 100) {
                clearInterval(interval);
            }
        }, 50); // 50ms interval, resulting in 5 seconds to complete (100 steps)
    };

    const handleFeedback = async (type) => {
        const feedbackData = {
            question: transcript,
            response: response.map(r => r.response).join(" "),
            feedback: type,
        };

        // Logica de feedback aqui
        try {
            const feedbackRef = doc(collection(db, `habitats/${habitatId}/feedback`));
            await setDoc(feedbackRef, feedbackData);
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
                                            <button
                                                onClick={() => handleFeedback("like")}
                                                className="like"
                                            >
                                                <BiSolidLike color="#333" size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleFeedback("dislike")}
                                                className="dislike"
                                            >
                                                <BiSolidDislike color="#333" size={20} />
                                            </button>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress"
                                                style={{ width: `${progress}%` }}
                                            ></div>
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
