import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { v4 as uuidv4 } from "uuid";

export default function WebCan({
  setIsPersonDetected,
  setPersons,
  setCurrentPerson,
}) {
  const videoRef = useRef(null);
  const [detectedPersons, setDetectedPersons] = useState([]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
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
    const processEveryNFrames = 4; // Process every 4 frames

    const detectFace = async () => {
      if (
        isComponentMounted &&
        videoRef.current &&
        videoRef.current.readyState === 4
      ) {
        frameCount++;
        if (frameCount % processEveryNFrames === 0) {
          const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5,
          });

          const detections = await faceapi
            .detectAllFaces(videoRef.current, options)
            .withFaceLandmarks()
            .withFaceDescriptors()
            .withAgeAndGender()
            .withFaceExpressions();

          const isDetected = detections.length > 0;
          setIsPersonDetected(isDetected);

          if (isDetected) {
            const now = Date.now();
            const THRESHOLD = 0.65; // Adjust as needed
            const MAX_IDLE_TIME = 30000; // 5 seconds

            let newDetectedPersons = [...detectedPersons];
            const personsInFrame = [];

            detections.forEach((detection) => {
              const descriptor = detection.descriptor;

              // Find the best match among detectedPersons
              let minDistance = Infinity;
              let bestMatch = null;

              newDetectedPersons.forEach((person) => {
                const distance = faceapi.euclideanDistance(
                  descriptor,
                  person.descriptor
                );
                if (distance < minDistance) {
                  minDistance = distance;
                  bestMatch = person;
                }
              });

              if (minDistance < THRESHOLD && bestMatch) {
                // Update timestamp and data
                bestMatch.timestamp = now;
                bestMatch.data = {
                  emotion:
                    detection.expressions.asSortedArray()[0].expression,
                  age: Math.floor(detection.age),
                  gender: detection.gender,
                };
                personsInFrame.push(bestMatch);
                // Log when an existing person is recognized
                console.log(
                  `Recognized person with ID: ${bestMatch.id}. Timestamp updated.`
                );
              } else {
                // Create new person
                const newPersonId = uuidv4();
                const newPerson = {
                  id: newPersonId,
                  descriptor: descriptor,
                  timestamp: now,
                  data: {
                    emotion:
                      detection.expressions.asSortedArray()[0].expression,
                    age: Math.floor(detection.age),
                    gender: detection.gender,
                  },
                };
                newDetectedPersons.push(newPerson);
                personsInFrame.push(newPerson);
                // Log when a new person is detected
                console.log(`New person detected with ID: ${newPersonId}`);
              }
            });

            // Remove persons not seen for more than MAX_IDLE_TIME
            const updatedDetectedPersons = newDetectedPersons.filter(
              (person) => {
                const isActive = now - person.timestamp < MAX_IDLE_TIME;
                if (!isActive) {
                  // Log when a person is removed due to inactivity
                  console.log(
                    `Person with ID: ${person.id} removed due to inactivity.`
                  );
                }
                return isActive;
              }
            );

            // Keep only the 5 most recent persons
            updatedDetectedPersons.sort(
              (a, b) => b.timestamp - a.timestamp
            );
            if (updatedDetectedPersons.length > 5) {
              const removedPersons = updatedDetectedPersons.splice(5);
              // Log when the oldest persons are removed
              removedPersons.forEach((person) => {
                console.log(
                  `Person with ID: ${person.id} removed to maintain max capacity of 5 persons.`
                );
              });
            }

            setDetectedPersons(updatedDetectedPersons);

            // Update persons state with IDs
            setPersons(
              personsInFrame.map((person) => ({
                id: person.id,
                emotion: person.data.emotion,
                age: person.data.age,
                gender: person.data.gender,
              }))
            );

            // Set the current person to the first detected
            setCurrentPerson(personsInFrame[0]);
          }
        }
      }
    };

    const interval = setInterval(detectFace, 100); // Adjust interval as needed
    return () => {
      isComponentMounted = false;
      clearInterval(interval);
    };
  }, [detectedPersons, setIsPersonDetected, setPersons, setCurrentPerson]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      style={{ position: "absolute", top: "-9999px", left: "-9999px" }}
    />
  );
}
