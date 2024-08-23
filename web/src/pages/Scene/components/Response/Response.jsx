import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "../../../../firebase";
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

                console.log("Response: ", res.data.comandos);
                setResponse(res.data.comandos);
                setLoading(false);
                setAnimation("falando-sorrindo");

                // Atualiza o histórico com a nova interação
                setHistory(prevHistory => [
                    ...prevHistory,
                    {
                        question: transcript,
                        answer: res.data.comandos.map(c => ({
                            texto: c.texto,
                            fade: c.fade,
                        })),
                    }
                ]);

                console.log("History updated: ", [...history]);

                // Reseta o transcript após o envio
                setTranscripts("");
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
    }, [transcripts, avt, setFade, history, setHistory, setTranscripts]);

    useEffect(() => {
        if (!loading && response.length > 0) {
            playAudioSequentially(0);
        }
    }, [loading, response]);

    const playAudioSequentially = async (index) => {
        if (index < response.length) {
            setCurrentIndex(index);
            const comando = response[index];

            // Simula o tempo de um áudio de 5 segundos
            setFade([{ fade: comando.fade, duration: 7 }]);
            setTimeout(() => {
                playAudioSequentially(index + 1);
            }, 5000);  // 5 segundos de simulação de áudio
        } else {
            setShowFeedback(true);
            startProgressBar();
            setTimeout(() => {
                setShowFeedback(false);
                setResponse([]);
                setAnimation("pensando");
                setShowQuestion(false);
                setProgress(0); // Reset progress bar
            }, 5000);
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