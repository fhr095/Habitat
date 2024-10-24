// Response.jsx
import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import { BiSolidLike, BiSolidDislike } from "react-icons/bi";
import { ModelContext } from "../../../../context/ModelContext"; 
import { SceneConfigContext } from "../../../../context/SceneConfigContext";
import eventBus from '../../../../eventBus';
import { focusOnObject } from "../Model/FocusOnObject"; // Function to focus on the object
import Avatar from "./Avatar";
import * as THREE from "three";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

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
    const [isModelReady, setIsModelReady] = useState(true); // Initialize as true
    const { setCurrentModel } = useContext(ModelContext); // Function to control the displayed model
    const { sceneConfig, scene, camera, controls } = useContext(SceneConfigContext); // Use SceneConfigContext to get scene and camera

    useEffect(() => {
        const sendTranscript = async (transcript) => {
            setLoading(true);
            setShowQuestion(true);

            try {
                const res = await axios.post("https://13.59.188.36:1880/talkwithifc", {
                    msg: transcript,
                    avt: "centroadm",
                    history: history, 
                });
                console.log("ENVIO:", transcript);
                setResponse(res.data);
                setLoading(false);
                console.log("ENVIO2:", res.data);

                // Update history with the new interaction
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

                    // Limit history to 3 items, removing the first two if necessary
                    if (newHistory.length > 3) {
                        newHistory = newHistory.slice(2); // Remove the first two items
                    }

                    return newHistory;
                });

            } catch (error) {
                console.error("Error sending transcript: ", error);
                setLoading(false);
                setShowFeedback(false);
                setResponse({ comandos: [] });
                setShowQuestion(false);
                setProgress(0); // Reset progress bar
    
                // Reset the transcript only after all responses have been processed
                setTranscript("");
                eventBus.emit('processingEnded');
                previousTranscriptRef.current = "";
            }
        };

        if (transcript && transcript !== previousTranscriptRef.current) {
            previousTranscriptRef.current = transcript;
            sendTranscript(transcript);
            eventBus.emit('processingStarted');
        }
    }, [transcript, avt, setFade, history, setHistory]);

    // This useEffect controls the model change when the response arrives
    useEffect(() => {
        const changeModel = async () => {
            console.log("ENVIO3:", response);
            if (!loading && response.comandos.length > 0) {
                const newModel = "model2";
                const skyboxTexturePath = sceneConfig[newModel]?.skyboxSettings?.texturePath;

                if (skyboxTexturePath) {
                    // Start loading the skybox texture
                    setIsModelReady(false); // Set model as not ready
                    const hdriLoader = new RGBELoader();
                    hdriLoader.load(skyboxTexturePath, (texture) => {
                        // Texture loaded
                        setIsModelReady(true); // Set model as ready
                        setCurrentModel(newModel);
                        playAudioSequentially(0);
                    }, undefined, (error) => {
                        console.error("Error loading skybox texture:", error);
                        // Proceed even if there's an error
                        setIsModelReady(true);
                        setCurrentModel(newModel);
                        playAudioSequentially(0);
                    });
                } else {
                    // No skybox texture, set model as ready
                    setIsModelReady(true);
                    setCurrentModel(newModel);
                    playAudioSequentially(0);
                }

            } else {
                setCurrentModel("model1"); // Return to model1 when there is no response
            }
        };

        changeModel();

    }, [loading, response, setCurrentModel, sceneConfig]);

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
            if (comando.fade && comando.fade !== "Cidade Administrativa de MG") {
                console.log("FADE:", comando.fade);
                console.log("Scene:", scene);
                console.log("Camera:", camera);
                console.log("Controls:", controls);
                console.log("TEM AUDIO:", audioDuration);
                
                // **Start the focus operation**
                focusPromise = focusOnObject(comando.fade, scene, camera, controls, audioDuration);
            } else {
                // Handle case where no fade is defined
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
            response: response.comandos.map(r => r.texto).join(" "),
            feedback: type,
        };

        // Feedback logic here
        try {
            // Send feedback to your backend or analytics service
        } catch (error) {
            console.error("Error sending feedback: ", error);
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
