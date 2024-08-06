import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export default function Transcript({ transcript, setTranscript }) {
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // path to your models
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log('Model loaded successfully');
      } catch (error) {
        console.error('Error loading models: ', error);
      }
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(err => console.error("Erro ao acessar a câmera: ", err));
    };

    const detectFace = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320, // Usando uma resolução menor para melhor desempenho
          scoreThreshold: 0.5 // Diminuir o limiar de pontuação para detectar mais faces
        });

        const detections = await faceapi.detectAllFaces(videoRef.current, options);
        setIsPersonDetected(detections.length > 0);
      }
    };

    loadModels().then(startVideo);

    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, []);

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
      <video ref={videoRef} autoPlay muted style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />
    </>
  );
};