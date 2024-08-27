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
  setIsMicEnabled,
}) {
  const videoRef = useRef(null);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);
  const [personId, setPersonId] = useState("");
  const [lastDescriptor, setLastDescriptor] = useState(null);
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
          minConfidence: 0.7,
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
          setIsMicEnabled(true);

          const detectedDescriptor = detections[0].descriptor;

          // Verifica se há um ID correspondente no armazenamento local
          const storedPersonData = checkLocalStorageForPerson(detectedDescriptor);
          if (storedPersonData) {
            setCurrentPerson(storedPersonData);
            setPersonId(storedPersonData.id);
            setLastDescriptor(detectedDescriptor);
            console.log(`Loaded existing ID from localStorage: ${storedPersonData.id}`);
            return; // Sai da função para evitar criar um novo ID
          }

          // Verificar se a pessoa detectada é a mesma, evitando criação repetida de IDs
          if (
            personId &&
            lastDescriptor &&
            faceapi.euclideanDistance(detectedDescriptor, lastDescriptor) <
              0.4
          ) {
            // Se for a mesma pessoa, manter o ID e cancelar qualquer expiração agendada
            console.log(`Retained existing ID: ${personId}`);
            if (idExpirationTimeout) {
              clearTimeout(idExpirationTimeout);
              setIdExpirationTimeout(null);
            }
          } else {
            // Nova pessoa detectada ou uma pessoa diferente
            const newPersonId = uuidv4();
            setPersonId(newPersonId);
            setLastDescriptor(detectedDescriptor);
            setCurrentPerson({ id: newPersonId, image: detections[0] });
            console.log(`Created new ID: ${newPersonId}`);
          }

          const persons = detections.map((person) => ({
            emotion: person.expressions.asSortedArray()[0].expression,
            age: Math.floor(person.age),
            gender: person.gender,
          }));

          setPersons(persons);
        } else {
          if (!detectionTimeout) {
            setIsMicEnabled(false);

            // Expirar ID se não houver detecção por um tempo
            const timeout = setTimeout(() => {
              console.log(
                "Person left the frame. Expiring current ID:",
                personId
              );

              if (idExpirationTimeout) {
                clearTimeout(idExpirationTimeout);
              }

              // Expirar ID atual
              const expirationTimeout = setTimeout(() => {
                console.log(`ID ${personId} expired.`);
                setPersonId("");
                setLastDescriptor(null);
                setCurrentPerson(null);
                setIsMicEnabled(false);
              }, 1000); // Tempo reduzido para expiração rápida

              setIdExpirationTimeout(expirationTimeout);
            }, 2000);
            setDetectionTimeout(timeout);
          }
        }
      }
    };

    const checkLocalStorageForPerson = (detectedDescriptor) => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("personData_")) {
          const storedData = JSON.parse(localStorage.getItem(key));
          if (storedData?.image?.descriptor) {
            const storedDescriptor = new Float32Array(storedData.image.descriptor);

            // Verificar se os descritores têm o mesmo comprimento antes de comparar
            if (
              storedDescriptor.length === detectedDescriptor.length &&
              faceapi.euclideanDistance(detectedDescriptor, storedDescriptor) < 0.4
            ) {
              return storedData;
            }
          }
        }
      }
      return null;
    };

    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, [
    setIsPersonDetected,
    setPersons,
    personId,
    detectionTimeout,
    labeledDescriptors,
    transcripts,
    response,
    habitatId,
    lastDescriptor,
    idExpirationTimeout,
    setIsMicEnabled,
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