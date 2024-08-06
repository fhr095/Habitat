import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { db } from "../../../../firebase"; // Certifique-se de importar corretamente seu Firebase

import botImg from "../../../../assets/images/avatar.png";
import "./Welcome.scss";

export default function Welcome({ habitatId, transcript, isPersonDetected }) {
  const [welcomeData, setWelcomeData] = useState(null);
  const [isCooldown, setIsCooldown] = useState(false);

  useEffect(() => {
    const fetchWelcomeData = () => {
      const welcomeRef = doc(db, `habitats/${habitatId}/welcome/welcomeData`);
      const unsubscribe = onSnapshot(welcomeRef, (doc) => {
        if (doc.exists()) {
          setWelcomeData(doc.data());
        } else {
          console.log("No such document!");
        }
      });

      return () => unsubscribe();
    };

    fetchWelcomeData();
  }, [habitatId]);

  useEffect(() => {
    if (welcomeData?.active && isPersonDetected && transcript === "" && !isCooldown) {
      speakText(welcomeData?.text);
      setIsCooldown(true);
      setTimeout(() => {
        setIsCooldown(false);
      }, 30000); // 30 segundos
    }
  }, [welcomeData, isPersonDetected, transcript, isCooldown]);

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
          console.log("Synthesis finished.");
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

  return (
    <>
      {transcript === "" && welcomeData?.active && isPersonDetected && (
        <div className="welcome-container">
          <img src={botImg} alt="Bot" />
          <div className="welcome-text">{welcomeData?.text}</div>
        </div>
      )}
    </>
  );
}