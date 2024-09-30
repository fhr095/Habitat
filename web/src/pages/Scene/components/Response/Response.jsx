import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { BiSolidLike, BiSolidDislike } from "react-icons/bi";
import eventBus from '../../../../eventBus';

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

    useEffect(() => {
        const sendTranscript = async (transcript) => {
            setLoading(true);
            setShowQuestion(true);

            try {
                
                const res = await axios.post(/*https://roko.flowfuse.cloud/talkwithifc*/"https://habitat-chatbot-test.netlify.app/.netlify/functions/respond" /*"https://habitat-avatar.netlify.app/.netlify/functions/response"*/, {
                    msg: transcript,
                    avt: "centroadm",
                    history: history, 
                });
                console.log("ENVIO:", transcript);
                setResponse(res.data);
                setLoading(false);
                setAnimation("falando-sorrindo");
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
                setAnimation("pensando");
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
            setAnimation("pensando");
            eventBus.emit('processingStarted');

        }
    }, [transcript, avt, setFade, history, setHistory]);

    useEffect(() => {
        console.log("ENVIO3:", response);
        if (!loading && response.comandos.length > 0) {            
            playAudioSequentially(0);
        }
    }, [loading, response]);

    const playAudioSequentially = async (index) => {
        console.log("ENVIO5:", index);
        if (index < response.comandos.length) {
            setCurrentIndex(index);
            const comando = response.comandos[index];
    
            if (comando.audio) {
                const audio = new Audio(comando.audio);
                audio.onloadedmetadata = () => {
                    const duration = audio.duration * 1000; // Duração em milissegundos
                    setFade([{ fade: comando.fade, duration: duration + 2000 }]); // Adiciona 2 segundos de margem
    
                    audio.play();
                    eventBus.emit('processingEnded');
                    eventBus.emit('audioStarted');
                    audio.onended = () => {
                        eventBus.emit('audioEnded');
                        playAudioSequentially(index + 1);
                    };
                };
    
                // Tratamento de erro ao carregar o áudio
                audio.onerror = () => {
                    console.error(`Falha ao carregar o áudio: ${comando.audio}`);
                    // Continuar para a próxima resposta mesmo se o áudio falhar
                    playAudioSequentially(index + 1);
                };
            } else {
                playAudioSequentially(index + 1);
            }
        } else {
            setShowFeedback(true);
            startProgressBar();
            setTimeout(() => {
                setShowFeedback(false);
                setResponse({ comandos: [] });
                setAnimation("pensando");
                setShowQuestion(false);
                setProgress(0); // Reset progress bar
    
                // Reseta o transcript somente após todas as respostas serem processadas
                setTranscript("");
                previousTranscriptRef.current = "";
            }, 3000); // 3 segundos de espera após a última resposta
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
