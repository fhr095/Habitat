import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as faceapi from "face-api.js";
import { v4 as uuidv4 } from "uuid";
import { fetchAllPersons, saveNewPerson } from "../../../../firebase";

const THRESHOLD = 0.65;

const WebCan = forwardRef((props, ref) => {
  const videoRef = useRef(null);
  const [knownPersons, setKnownPersons] = useState([]);

  useEffect(() => {
    const loadModelsAndPersons = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Carrega persons conhecidos do Firebase
      const existingPersons = await fetchAllPersons();
      const mappedPersons = existingPersons.map(p => ({
        personId: p.personId,
        descriptor: new Float32Array(p.descriptor)
      }));
      setKnownPersons(mappedPersons);
    };

    loadModelsAndPersons();
  }, []);

  const detectFaces = async () => {
    if (!videoRef.current) return [];
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
    const detections = await faceapi
      .detectAllFaces(videoRef.current, options)
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withAgeAndGender()
      .withFaceExpressions();

    return detections.map(d => ({
      descriptor: d.descriptor,
      age: d.age,
      gender: d.gender,
      emotion: d.expressions.asSortedArray()[0].expression
    }));
  };

  // Função auxiliar para encontrar a melhor correspondência
  const matchDescriptor = (descriptor, knownArray) => {
    let minDistance = Infinity;
    let bestMatch = null;
    for (const kp of knownArray) {
      const distance = faceapi.euclideanDistance(descriptor, kp.descriptor);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = kp;
      }
    }
    if (minDistance < THRESHOLD) return bestMatch;
    return null;
  };

  const captureCurrentUsers = async () => {
    // Captura 3 frames
    const detectionsOverFrames = [];
    for (let i = 0; i < 3; i++) {
      const frameDetections = await detectFaces();
      detectionsOverFrames.push(frameDetections);
      await new Promise(res => setTimeout(res, 300));
    }

    const allDetections = detectionsOverFrames.flat();
    if (allDetections.length === 0) {
      return { identifiedUsers: [], rawDetections: allDetections };
    }

    // Vamos mapear cada detecção para um único personId
    const identifiedUsers = [];
    const sessionNewPersons = []; // Para armazenar novas pessoas criadas nesta interação

    for (const det of allDetections) {
      if (!det.descriptor || det.descriptor.length === 0) {
        console.error("Descriptor inválido ou inexistente", det.descriptor);
        continue;
      }

      // Primeiro tenta achar correspondência em knownPersons
      let match = matchDescriptor(det.descriptor, knownPersons);
      if (match) {
        // Pessoa já conhecida
        identifiedUsers.push({
          id: match.personId,
          age: Math.floor(det.age),
          gender: det.gender,
          emotion: det.emotion
        });
        continue;
      }

      // Se não encontrou nos conhecidos, tenta encontrar em sessionNewPersons
      match = matchDescriptor(det.descriptor, sessionNewPersons);
      if (match) {
        // Pessoa já criada nesta interação
        identifiedUsers.push({
          id: match.personId,
          age: Math.floor(det.age),
          gender: det.gender,
          emotion: det.emotion
        });
        continue;
      }

      // Não encontrou em lugar nenhum, cria novo person
      const newPersonId = uuidv4();
      await saveNewPerson(newPersonId, det.descriptor);
      const newPersonRecord = {
        personId: newPersonId,
        descriptor: det.descriptor
      };
      sessionNewPersons.push(newPersonRecord);
      setKnownPersons(prev => [...prev, newPersonRecord]);

      identifiedUsers.push({
        id: newPersonId,
        age: Math.floor(det.age),
        gender: det.gender,
        emotion: det.emotion
      });
    }

    // Remover duplicatas se a mesma pessoa apareceu várias vezes nos 3 frames
    const uniqueUsers = [];
    const seenIds = new Set();
    for (const u of identifiedUsers) {
      if (!seenIds.has(u.id)) {
        seenIds.add(u.id);
        uniqueUsers.push(u);
      }
    }

    return { identifiedUsers: uniqueUsers, rawDetections: allDetections };
  };

  useImperativeHandle(ref, () => ({
    captureCurrentUsers,
    getKnownPersons: () => knownPersons
  }));

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      style={{ position: "absolute", top: "-9999px", left: "-9999px" }}
    />
  );
});

export default WebCan;
