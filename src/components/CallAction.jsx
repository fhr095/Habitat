import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Certifique-se de que o caminho está correto
import { doc, onSnapshot } from "firebase/firestore";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

import AvatarImg from "../assets/images/Avatar.png";

import "../styles/CallAction.scss";

export default function CallAction() {
    const [actionData, setActionData] = useState(null);

    useEffect(() => {
        const callActionRef = doc(db, "callAction", "seplag");
        const unsubscribe = onSnapshot(callActionRef, (doc) => {
            if (doc.exists()) {
                setActionData(doc.data());
            } else {
                console.log("Documento não encontrado!");
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (actionData?.activate) {
            speakText(actionData.actionText);
        }
    }, [actionData]);

    const speakText = (text) => {
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            import.meta.env.VITE_APP_AZURE_SPEECH_KEY1,
            import.meta.env.VITE_APP_AZURE_REGION
        );
        const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();

        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        synthesizer.speakTextAsync(text,
            result => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                } else {
                    console.error("Speech synthesis canceled, " + result.errorDetails);
                }
                synthesizer.close();
            },
            error => {
                console.error(error);
                synthesizer.close();
            });
    };

    if (!actionData || !actionData.activate) {
        return null;
    }

    return (
        <div className="call-action">
            <div className="message-wrapper">
                <div className="bot-icon">
                    <img src={AvatarImg} alt="Avatar" />
                </div>
                <div className="message-container">
                    <p>{actionData.actionText}</p>
                </div>
            </div>
        </div>
    );
}
