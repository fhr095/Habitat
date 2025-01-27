// WebCan.jsx

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as faceapi from "face-api.js";
import { v4 as uuidv4 } from "uuid";
import { fetchAllPersons, saveNewPerson } from "../../../../firebase";

const THRESHOLD = 0.65; // Considere aumentar para 0.7 se necessário

const WebCan = forwardRef((props, ref) => {
  const videoRef = useRef(null);
  const [knownPersons, setKnownPersons] = useState([]);

  useEffect(() => {
    const loadModelsAndPersons = async () => {
      const MODEL_URL = "/models";
      console.log("Carregando modelos do face-api.js...");
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log("Modelos carregados com sucesso.");

      console.log("Solicitando acesso à câmera...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          console.log("Câmera iniciada.");
        }
      } catch (error) {
        console.error("Erro ao acessar a câmera:", error);
        return;
      }

      console.log("Buscando usuários conhecidos no Firebase...");
      try {
        const existingPersons = await fetchAllPersons();
        const mappedPersons = existingPersons.map(p => ({
          personId: p.personId,
          descriptor: new Float32Array(p.descriptor)
        }));
        setKnownPersons(mappedPersons);
        console.log(`Usuários conhecidos carregados: ${mappedPersons.length}`);
      } catch (error) {
        console.error("Erro ao buscar usuários do Firebase:", error);
      }
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

    console.log(`Faces detectadas neste frame: ${detections.length}`);
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
    const MAX_RETRIES = 4;
    let attempts = 0;
    let identifiedUsers = [];
    let rawDetections = [];
    let success = false;

    // Clone knownPersons para uso local dentro da função
    let currentKnownPersons = [...knownPersons];
    console.log("Iniciando captura de usuários...");

    while (attempts <= MAX_RETRIES && !success) {
      console.log(`Tentativa de captura de usuários: ${attempts + 1}`);

      // Captura 3 frames
      const detectionsOverFrames = [];
      for (let i = 0; i < 3; i++) {
        console.log(`Capturando frame ${i + 1}...`);
        const frameDetections = await detectFaces();
        detectionsOverFrames.push(frameDetections);
        await new Promise(res => setTimeout(res, 300));
      }

      rawDetections = detectionsOverFrames.flat();
      console.log(`Total de detecções brutas após captura: ${rawDetections.length}`);

      if (rawDetections.length === 0) {
        console.warn("Nenhuma face detectada nos frames capturados.");
        attempts++;
        continue;
      }

      // Mapa para contar ocorrências de cada id_person
      const userCountMap = {};

      // Para armazenar informações demográficas por id_person
      const userInfoMap = {};

      // Para armazenar novos usuários criados nesta interação
      const sessionNewPersons = [];

      for (const det of rawDetections) {
        if (!det.descriptor || det.descriptor.length === 0) {
          console.error("Descriptor inválido ou inexistente", det.descriptor);
          continue;
        }

        // Primeiro tenta achar correspondência em currentKnownPersons
        let match = matchDescriptor(det.descriptor, currentKnownPersons);
        if (!match) {
          // Se não encontrou nos conhecidos, tenta encontrar em sessionNewPersons
          match = matchDescriptor(det.descriptor, sessionNewPersons);
        }

        if (!match) {
          // Não encontrou em lugar nenhum, cria novo person
          const newPersonId = uuidv4();
          console.log(`Criando novo usuário com ID: ${newPersonId}`);
          try {
            await saveNewPerson(newPersonId, det.descriptor);
            console.log(`Novo usuário salvo no Firebase: ${newPersonId}`);
          } catch (error) {
            console.error("Erro ao salvar novo usuário no Firebase:", error);
            continue; // Pula para a próxima detecção se falhar ao salvar
          }
          const newPersonRecord = {
            personId: newPersonId,
            descriptor: det.descriptor
          };
          sessionNewPersons.push(newPersonRecord);
          currentKnownPersons.push(newPersonRecord); // Adiciona ao local
          console.log(`Novo usuário adicionado à lista local de conhecidos: ${newPersonId}`);
          match = { personId: newPersonId };
        }

        const personId = match.personId;
        console.log(`Correspondência encontrada para ID: ${personId}`);

        // Incrementa a contagem para esse personId
        userCountMap[personId] = (userCountMap[personId] || 0) + 1;

        // Armazena informações demográficas se ainda não estiverem armazenadas
        if (!userInfoMap[personId]) {
          userInfoMap[personId] = {
            age: Math.floor(det.age),
            gender: det.gender,
            emotion: det.emotion
          };
        }
      }

      // Selecionar o id_person mais recorrente
      const tempIdentifiedUsers = [];

      for (const [personId, count] of Object.entries(userCountMap)) {
        console.log(`ID: ${personId} foi detectado ${count} vezes.`);
        // Considera somente se o personId foi detectado em pelo menos 2 dos 3 frames para maior confiança
        if (count >= 2) { // Ajuste o limiar conforme necessário
          tempIdentifiedUsers.push({
            id: personId,
            age: userInfoMap[personId].age,
            gender: userInfoMap[personId].gender,
            emotion: userInfoMap[personId].emotion
          });
          console.log(`Usuário ${personId} selecionado para interação.`);
        }
      }

      if (tempIdentifiedUsers.length > 0) {
        identifiedUsers = tempIdentifiedUsers;
        success = true;
        console.log("Usuários identificados com sucesso:", identifiedUsers);
      } else {
        console.warn("Nenhum usuário identificado com frequência suficiente. Tentando novamente...");
        attempts++;
        // Se atingiu o número máximo de tentativas, aceitar os usuários detectados sem a frequência mínima
        if (attempts > MAX_RETRIES) {
          console.warn("Máximo de tentativas alcançado. Registrando usuários detectados sem frequência mínima.");
          identifiedUsers = rawDetections.map(det => {
            const match = matchDescriptor(det.descriptor, currentKnownPersons);
            return match ? {
              id: match.personId,
              age: Math.floor(det.age),
              gender: det.gender,
              emotion: det.emotion
            } : null;
          }).filter(user => user !== null);
          success = true;
          console.log("Usuários identificados sem frequência mínima:", identifiedUsers);
        }
      }
    }

    // Remover duplicatas se a mesma pessoa apareceu várias vezes nos 3 frames ou nas tentativas
    const uniqueUsers = [];
    const seenIds = new Set();
    for (const u of identifiedUsers) {
      if (!seenIds.has(u.id)) {
        seenIds.add(u.id);
        uniqueUsers.push(u);
      }
    }

    console.log("Usuários únicos identificados:", uniqueUsers);
    console.log("Detecções brutas:", rawDetections);

    // Atualiza o estado com a lista local atualizada de conhecidos
    setKnownPersons(currentKnownPersons);

    return { identifiedUsers: uniqueUsers, rawDetections: rawDetections };
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
