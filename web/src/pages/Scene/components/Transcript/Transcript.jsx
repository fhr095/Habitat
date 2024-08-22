import React, { useEffect, useRef } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export default function Transcript({ setTranscripts }) {
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const startRecognition = async () => {
      try {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
          import.meta.env.VITE_AZURE_SPEECH_KEY,
          import.meta.env.VITE_AZURE_SPEECH_REGION
        );

        speechConfig.speechRecognitionLanguage = "pt-BR";

        const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizing = (s, e) => {
          console.log(`Recognizing: ${e.result.text}`);
        };

        recognizer.recognized = (s, e) => {
          if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            console.log(`Recognized: ${e.result.text}`);
            setTranscripts((prevTranscripts) => [...prevTranscripts, e.result.text]);
          } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
            console.log("No speech could be recognized.");
          }
        };

        recognizer.canceled = (s, e) => {
          console.error(`Canceled: ${e.reason}`);
          recognizer.stopContinuousRecognitionAsync();
        };

        recognizer.sessionStopped = (s, e) => {
          console.log("Session stopped.");
          recognizer.stopContinuousRecognitionAsync();
        };

        recognizer.startContinuousRecognitionAsync();
      } catch (error) {
        console.error("Error starting recognition: ", error);
      }
    };

    startRecognition();

    return () => {
      // Ensure proper cleanup
      audioChunksRef.current = [];
    };
  }, [setTranscripts]);

  return null; // O componente não precisa renderizar nada
}