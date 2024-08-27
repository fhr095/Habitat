import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { v4 as uuidv4 } from "uuid";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function WebCan({
  setIsPersonDetected,
  setPersons,
  setCurrentPerson,
  habitatId,
  transcripts,
  response,
}) {
  const videoRef = useRef(null);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);
  const [personId, setPersonId] = useState("");
  const [detectionTimeout, setDetectionTimeout] = useState(null);
  const [idExpirationTimeout, setIdExpirationTimeout] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await loadLabeledImages();
        startVideo();
      } catch (error) {
        console.error("Error loading models: ", error);
      }
    };

    const loadLabeledImages = async () => {
      try {
        const facesCollection = collection(db, `habitats/${habitatId}/faces`);
        const facesSnapshot = await getDocs(facesCollection);
        const labeledDescriptors = await Promise.all(
          facesSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const img = await faceapi.fetchImage(data.imageUrl);
            const detections = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
            if (detections) {
              return new faceapi.LabeledFaceDescriptors(data.user, [
                detections.descriptor,
              ]);
            }
            return null;
          })
        );
        setLabeledDescriptors(labeledDescriptors.filter(Boolean));
      } catch (error) {
        console.error("Error loading labeled images: ", error);
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
  }, [habitatId]);

  useEffect(() => {
    const detectFace = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        labeledDescriptors.length > 0
      ) {
        const options = new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.5,
        });

        const detections = await faceapi
          .detectAllFaces(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender()
          .withFaceDescriptors();

        const isDetected = detections.length > 0;
        setIsPersonDetected(isDetected);

        if (isDetected) {
          const detectedDescriptor = detections[0].descriptor;
          let existingFace = null;

          // Verifica se o rosto detectado já existe nos descritores
          for (const faceDescriptor of labeledDescriptors) {
            const distance = faceapi.euclideanDistance(
              faceDescriptor.descriptors[0],
              detectedDescriptor
            );
            if (distance < 0.4) {
              existingFace = faceDescriptor;
              break;
            }
          }

          let faceId;
          if (existingFace) {
            faceId = existingFace.label;
            setCurrentPerson({ id: faceId, image: detections[0] });
            console.log(`Loaded existing face with ID: ${faceId}`);
          } else {
            // Se não encontrar uma correspondência, cria um novo ID
            faceId = uuidv4();
            const newFace = {
              id: faceId,
              descriptor: detectedDescriptor,
              image: detections[0],
              firstSeen: new Date(),
              lastSeen: new Date(),
              detections: 1,
            };

            setCurrentPerson(newFace);
            setLabeledDescriptors((prev) => [
              ...prev,
              new faceapi.LabeledFaceDescriptors(faceId, [detectedDescriptor]),
            ]);
            console.log(`Created new face with ID: ${faceId}`);
          }

          setPersons(
            detections.map((person) => ({
              emotion: person.expressions.asSortedArray()[0].expression,
              age: Math.floor(person.age),
              gender: person.gender,
            }))
          );
        } else {
          if (!detectionTimeout) {
            const timeout = setTimeout(() => {
              console.log("Person left the frame. Expiring current ID:", personId);

              if (idExpirationTimeout) {
                clearTimeout(idExpirationTimeout);
              }

              const expirationTimeout = setTimeout(() => {
                console.log(`ID ${personId} expired.`);
                setPersonId("");
                setCurrentPerson(null);
              }, 1000); // Tempo reduzido para expiração rápida

              setIdExpirationTimeout(expirationTimeout);
            }, 2000);
            setDetectionTimeout(timeout);
          }
        }
      }
    };

    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, [
    setIsPersonDetected,
    setPersons,
    personId,
    detectionTimeout,
    labeledDescriptors,
    habitatId,
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
