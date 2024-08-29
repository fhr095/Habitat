import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { BiSolidLike, BiSolidDislike } from "react-icons/bi";

import Avatar from "./Avatar";
import "./Response.scss";

export default function Response({
    habitatId,
    avt,
    transcripts,
    setTranscripts, 
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
                const res = await axios.post("https://habitat-chatbot-test.netlify.app/.netlify/functions/respond", {
                    msg: transcript,
                    avt: "centroadm",
                    history: history, 
                });

                setResponse(res.data.comandos);
                setLoading(false);
                setAnimation("falando-sorrindo");

                // Atualiza o histórico com a nova interação
                setHistory(prevHistory => {
                    let newHistory = [
                        ...prevHistory,
                        {
                            question: transcript,
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
            }
        };

        if (transcripts && transcripts !== previousTranscriptRef.current) {
            previousTranscriptRef.current = transcripts;
            sendTranscript(transcripts);
            setAnimation("pensando");
        }
    }, [transcripts, avt, setFade, history, setHistory]);

    useEffect(() => {
        if (!loading && response.length > 0) {
            playAudioSequentially(0);
        }
    }, [loading, response]);

    const playAudioSequentially = async (index) => {
        if (index < response.length) {
            setCurrentIndex(index);
            const comando = response[index];
    
            if (comando.audio) {
                const audio = new Audio(comando.audio);
                audio.onloadedmetadata = () => {
                    const duration = audio.duration * 1000; // Duração em milissegundos
                    setFade([{ fade: comando.fade, duration: duration + 2000 }]); // Adiciona 2 segundos de margem
    
                    audio.play();
                    audio.onended = () => {
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
                setResponse([]);
                setAnimation("pensando");
                setShowQuestion(false);
                setProgress(0); // Reset progress bar
    
                // Reseta o transcript somente após todas as respostas serem processadas
                setTranscripts("");
            }, 5000); // 5 segundos de espera após a última resposta
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
            question: transcripts,
            response: response.map(r => r.texto).join(" "),
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
            {showQuestion && transcripts && (
                <div className="question">
                    <p>{transcripts}</p>
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
                <div className={`response ${response.length === 0 ? "response-exit" : ""}`}>
                    {response.length > 0 && (
                        <>
                            <Avatar animation={animation} />
                            <div className="response-text">
                                <p>{response[currentIndex]?.texto}</p>
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
