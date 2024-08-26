import React, { useEffect, useRef, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export default function Transcript({ setTranscripts }) {
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

        recognizer.recognizing = (s, e) => {
          console.log(`Recognizing: ${e.result.text}`);
        };

        recognizer.recognized = (s, e) => {
          if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            console.log(`Recognized: ${e.result.text}`);
            setTranscripts((prevTranscripts) => `${prevTranscripts} ${e.result.text}`);
          } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
            console.log("No speech could be recognized.");
          }
        };

        recognizer.canceled = (s, e) => {
          console.error(`Canceled: ${e.reason}`);
          recognizer.stopContinuousRecognitionAsync(() => {
            recognizer.close();
            recognizerRef.current = null;
          });
        };

        recognizer.sessionStopped = (s, e) => {
          console.log("Session stopped.");
          recognizer.stopContinuousRecognitionAsync(() => {
            recognizer.close();
            recognizerRef.current = null;
          });
        };

        recognizerRef.current = recognizer;
        recognizer.startContinuousRecognitionAsync(() => {
          setIsRecognizing(true);
        });
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

  return null;
}