import React, { useEffect, useState } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export default function Transcript({ transcript, setTranscript, isPersonDetected }) {
  useEffect(() => {
    if (transcript === "" && isPersonDetected) {
      startListening();
    }
  }, [transcript, isPersonDetected]);

  const startListening = () => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      import.meta.env.VITE_APP_AZURE_SPEECH_KEY1,
      import.meta.env.VITE_APP_AZURE_REGION
    );
    speechConfig.speechRecognitionLanguage = "pt-BR"; // Definindo o idioma para português

    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(result => {
      if (result.reason === sdk.ResultReason.RecognizedSpeech) {
        console.log("Recognized: ", result.text);
        setTranscript(result.text);
      } else if (result.reason === sdk.ResultReason.NoMatch) {
        console.warn("No speech recognized, trying again...");
        startListening(); // Tenta novamente
      } else {
        console.error("Speech recognition canceled: ", result.errorDetails);
      }
      recognizer.close();
    }, error => {
      console.error("Error recognizing speech: ", error);
      recognizer.close();
      startListening(); // Tenta novamente em caso de erro
    });
  };

  return (
    <>
      
    </>
  );
}