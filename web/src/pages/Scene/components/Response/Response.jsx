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
import https from 'https';

const httpsAgent = new https.Agent({  
    rejectUnauthorized: false
});


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

    useEffect(() => {
        const filterTranscript = async (transcript) => {
            console.log("Filtering transcript:", transcript);
            try {
                const source = axios.CancelToken.source();
                const timeoutId = setTimeout(() => {
                    source.cancel("Request timed out.");
                }, 5000); // Timeout de 5 segundos para a requisição de filter

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
                    // Em caso de timeout, envia diretamente o transcript
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
                }, 20000); // Timeout de 20 segundos para a requisição de sendTranscript

                const res = await axios.post(
                    /*"https://habitat-chatbot-test.netlify.app/.netlify/functions/respondgpt1"*/"https://nodered.appiaarquitetura.com.br/talkwithifc",
                    {
                        msg: transcript,
                        avt: "centroadm",
                        history: history,
                        confirmacao,
                    },
                    { cancelToken: source.token, httpsAgent }
                );

                clearTimeout(timeoutId);
                console.log("Sending transcript:", transcript);
                setResponse(res.data);
                setLoading(false);
                console.log("Received response:", res.data);

                // Atualiza o histórico com a nova interação
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

                    // Limitar o histórico a 3 itens, removendo os 2 primeiros se necessário
                    if (newHistory.length > 3) {
                        newHistory = newHistory.slice(2); // Remove os dois primeiros itens
                    }

                    return newHistory;
                });
            } catch (error) {
                if (axios.isCancel(error)) {
                    console.warn("sendTranscript request timed out. Resetting to allow new attempt.");
                } else {
                    console.error("Error sending transcript: ", error);
                }

                // Resetar estados em caso de erro ou timeout
                setLoading(false);
                setShowFeedback(false);
                setResponse({ comandos: [] });
                setShowQuestion(false);
                setProgress(0);
                setTranscript("");
                eventBus.emit('processingEnded');
                previousTranscriptRef.current = "";
            }
        };

        if (transcript && transcript !== previousTranscriptRef.current) {
            previousTranscriptRef.current = transcript;
            
            (async () => {
                const filterResult = await filterTranscript(transcript);
                
                if (filterResult.status === "true") {
                    // Envia diretamente se o filtro retornou "true"
                    sendTranscript(transcript);
                    eventBus.emit('processingStarted');
                } else if (filterResult.status === "undf") {
                    // Envia com campo "confirmacao" se o filtro retornou "undf"
                    sendTranscript(transcript, true);
                    eventBus.emit('processingStarted');
                } else {
                    // Se o status for "false", apenas loga e não faz nada
                    console.log("Transcript ignored by filter:", filterResult.justification);
                    setLoading(false);
                    setShowFeedback(false);
                    setResponse({ comandos: [] });
                    setShowQuestion(false);
                    setProgress(0);
                    setTranscript("");
                    eventBus.emit('processingEnded');
                    previousTranscriptRef.current = "";
                }
            })();
        }
    }, [transcript, avt, setFade, history, setHistory]);

    // Esse useEffect controla a mudança de modelo quando a resposta chega
    useEffect(() => {
        console.log("Current response:", response);
        if (!loading && response.comandos.length > 0) {            
            //setCurrentModel("model1"); // Exibir ambos os modelos quando a resposta chegar
            playAudioSequentially(0);
        } else {
            //setCurrentModel("model1"); // Voltar para o modelo 1 quando não há resposta
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
      
    const playAudioSequentially = async (index) => {
        console.log("Playing command index:", index);
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
              eventBus.emit('processingEnded');
              eventBus.emit('audioStarted');
              audioPromise = new Promise((resolve) => {
                audio.onended = () => {
                  eventBus.emit('audioEnded');
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
            //focusPromise = focusOnObject(comando.fade, scene, camera, controls, setSceneConfig, audioDuration);
          } else {
            //setCurrentModel("model1");
          }
      
          await Promise.all([audioPromise, focusPromise]);
          playAudioSequentially(index + 1);
        } else {
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
