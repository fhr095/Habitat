import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

export default function WebCam({ setIsPersonDetected, setPersons }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // Corrigido o caminho para modelos
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        console.log('Models loaded successfully');
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

        const detections = await faceapi.detectAllFaces(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        setIsPersonDetected(detections.length > 0);

        if (detections.length > 0) {
          const persons = detections.map(person => {
            return {
              emotion: person.expressions.asSortedArray()[0].expression,
              age: Math.floor(person.age),
              gender: person.gender
            };
          });

          setPersons(persons);
        }
      }
    };

    loadModels().then(startVideo);

    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, [setIsPersonDetected, setPersons]);

  return (
    <video ref={videoRef} autoPlay muted style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />
  );
}