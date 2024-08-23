import React, { useEffect, useRef, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export default function Transcript({ setTranscripts, isPersonDetected, showQuestion }) {
  const recognizerRef = useRef(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

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

        recognizer.recognized = (s, e) => {
          if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            console.log(`Recognized: ${e.result.text}`);
            // Adiciona a transcrição finalizada ao setTranscripts
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

        recognizerRef.current = recognizer;
      } catch (error) {
        console.error("Error starting recognition: ", error);
      }
    };

    startRecognition();

    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stopContinuousRecognitionAsync(() => {
          recognizerRef.current.close();
          recognizerRef.current = null;
        });
      }
    };
  }, [setTranscripts]);

  useEffect(() => {
    if (recognizerRef.current) {
      if (isPersonDetected && !isRecognizing && !showQuestion) {
        recognizerRef.current.startContinuousRecognitionAsync();
        setIsRecognizing(true);
      } else if (!isPersonDetected && isRecognizing) {
        recognizerRef.current.stopContinuousRecognitionAsync();
        setIsRecognizing(false);
      }
    }
  }, [isPersonDetected, showQuestion, isRecognizing]);

  return null; // O componente não precisa renderizar nada
}