import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { v4 as uuidv4 } from "uuid";

export default function WebCan({
  setIsPersonDetected,
  setPersons,
  setCurrentPerson,
}) {
  const videoRef = useRef(null);
  const [personId, setPersonId] = useState("");
  const [detectionTimeout, setDetectionTimeout] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        startVideo();
      } catch (error) {
        console.error("Error loading models: ", error);
      }
    };

    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: {} })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => console.error("Erro ao acessar a câmera: ", err));
    };

    loadModels();
  }, []);

  useEffect(() => {

    let isComponentMounted = true;
    let frameCount = 0;
    const processEveryNFrames = 4; // Processar a cada 2 quadros

    const detectFace = async () => {
      
        if (
          isComponentMounted &&
          videoRef.current &&
          videoRef.current.readyState === 4
        ) {
          frameCount++;
          if (frameCount % processEveryNFrames === 0) {
            const options = new faceapi.TinyFaceDetectorOptions({
              inputSize: 224, // Tamanho menor para maior velocidade
              scoreThreshold: 0.5, // Ajuste conforme necessário
            });

          const detections = await faceapi
            .detectAllFaces(videoRef.current, options)
            .withFaceExpressions()
            .withAgeAndGender();

          const isDetected = detections.length > 0;
          setIsPersonDetected(isDetected);

          if (isDetected) {
            if (!personId) {
              const newPersonId = uuidv4();
              setPersonId(newPersonId);

              const canvas = document.createElement("canvas");
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              const context = canvas.getContext("2d");
              context.drawImage(
                videoRef.current,
                0,
                0,
                canvas.width,
                canvas.height
              );
              const imageData = canvas.toDataURL("image/png");

              setCurrentPerson({ id: newPersonId, image: imageData });
              console.log("New person detected with ID:", newPersonId);
            }

            const persons = detections.map((person) => ({
              emotion: person.expressions.asSortedArray()[0].expression,
              age: Math.floor(person.age),
              gender: person.gender,
            }));

            setPersons(persons);

            if (detectionTimeout) {
              clearTimeout(detectionTimeout);
              setDetectionTimeout(null);
            }
          } else if (personId) {
            if (!detectionTimeout) {
              const timeout = setTimeout(() => {
                console.log(
                  "Person left the frame. Deleting data for ID:",
                  personId
                );
                setPersonId("");
                setCurrentPerson(null);
                setDetectionTimeout(null);
              }, 5000);
              setDetectionTimeout(timeout);
            }
          }
        }
      }
    };

    const interval = setInterval(detectFace, 500);
    return () => clearInterval(interval);
  }, [
    setIsPersonDetected,
    setPersons,
    personId,
    detectionTimeout,
  ]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      style={{ position: "absolute", top: "-9999px", left: "-9999px" }}
    />
  );
}