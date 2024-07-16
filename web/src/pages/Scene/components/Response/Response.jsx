import React, { useEffect, useState } from "react";
import axios from "axios";

import botImage from "../../../../assets/images/avatar.png";
import "./Response.scss";

export default function Response({ avt, transcript, setTranscript, setFade }) {
    const [response, setResponse] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const sendTranscript = async () => {
            setLoading(true);
            try {
                const res = await axios.post("https://roko.flowfuse.cloud/talkwithifc", {
                    msg: transcript,
                    avt: avt
                });

                setResponse(res.data.comandos);
                setLoading(false);
            } catch (error) {
                console.error("Error sending transcript: ", error);
                setLoading(false);
            }
        };

        if (transcript !== "") {
            sendTranscript();
        }
    }, [transcript, avt, setFade]);

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
                    setFade([{ fade: comando.fade, duration: audio.duration + 2 }]); // Adding 2 seconds to the audio duration
                };
                audio.play();
                audio.onended = () => {
                    playAudioSequentially(index + 1);
                };
            } else {
                playAudioSequentially(index + 1);
            }
        } else {
            // Clean up response and transcript after all audios are played
            setResponse([]);
            setTranscript("");
        }
    };

    return (
        <div className="response-container">
            {transcript !== "" && (
                <div className="question">
                    <p>{transcript}</p>
                </div>
            )}
            {loading ? (
                <div className="loading-response">
                    <p>Loading response...</p>
                </div>
            ) : (
                <div className={`response ${response.length === 0 ? "response-exit" : ""}`}>
                    {response.length > 0 && (
                        <>
                            <img src={botImage} alt="Bot" className="bot-image" />
                            <div className="response-text">
                                <p>{response[currentIndex]?.texto}</p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}