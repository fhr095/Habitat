import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { v4 as uuidv4 } from "uuid"; // Para gerar IDs únicos

export default function WebCan({ setIsPersonDetected, setPersons, setCurrentPerson }) {
  const videoRef = useRef(null);
  const [personId, setPersonId] = useState(""); // ID da pessoa atual
  const [detectionTimeout, setDetectionTimeout] = useState(null); // Timeout para verificar se a pessoa saiu

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; 
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
          inputSize: 320,
          scoreThreshold: 0.5,
        });

        const detections = await faceapi.detectAllFaces(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        setIsPersonDetected(detections.length > 0);

        if (detections.length > 0) {
          if (!personId) {
            // Gera um novo ID para a nova pessoa
            const newPersonId = uuidv4();
            setPersonId(newPersonId);

            // Captura um print da pessoa
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext("2d");
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL("image/png");

            setCurrentPerson({ id: newPersonId, image: imageData });
            console.log("Person detected with ID:", newPersonId);
          }

          const persons = detections.map(person => {
            return {
              emotion: person.expressions.asSortedArray()[0].expression,
              age: Math.floor(person.age),
              gender: person.gender,
            };
          });

          setPersons(persons);

          // Reseta o timeout se uma pessoa é detectada
          if (detectionTimeout) {
            clearTimeout(detectionTimeout);
            setDetectionTimeout(null);
          }

        } else {
          if (personId) {
            // Inicia um timeout de 2 segundos para verificar se a pessoa realmente saiu do quadro
            if (!detectionTimeout) {
              const timeout = setTimeout(() => {
                console.log("Person left the frame. Deleting data for ID:", personId);
                setPersonId(""); // Reseta o ID da pessoa
                setCurrentPerson(null); // Remove o print da pessoa
                setDetectionTimeout(null);
              }, 2000);

              setDetectionTimeout(timeout);
            }
          }
        }
      }
    };

    loadModels().then(startVideo);

    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, [setIsPersonDetected, setPersons, personId, detectionTimeout]);

  return (
    <video ref={videoRef} autoPlay muted style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />
  );
}