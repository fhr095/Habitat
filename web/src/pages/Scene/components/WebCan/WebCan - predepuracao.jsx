import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { v4 as uuidv4 } from "uuid";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function WebCan({
  setIsPersonDetected,
  setPersons,
  setCurrentPerson,
  habitatId,
  transcripts,
  response,
  setIsMicEnabled, // Novo prop para controlar o microfone
}) {
  const videoRef = useRef(null);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);
  const [personId, setPersonId] = useState("");
  const [lastDescriptor, setLastDescriptor] = useState(null); // To store the last person's descriptor
  const [detectionTimeout, setDetectionTimeout] = useState(null);
  const [lastSavedTranscript, setLastSavedTranscript] = useState(""); // Track the last saved transcript
  const [lastPersonTimestamp, setLastPersonTimestamp] = useState(null); // To store the last detection timestamp
  const [idExpirationTimeout, setIdExpirationTimeout] = useState(null); // To track ID expiration timeout

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

  const findBotWithAvt = async () => {
    const avatarsCollection = collection(db, `habitats/${habitatId}/avatars`);
    const q = query(avatarsCollection, where("avt", "==", habitatId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0]; // Assuming there is only one bot with the matching avt
    } else {
      console.error("No bot found with the matching avt");
      return null;
    }
  };

  useEffect(() => {
    const detectFace = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        labeledDescriptors.length > 0
      ) {
        const options = new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.7, // Increase the minimum confidence for detections
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
          // Se a pessoa for detectada, habilita o microfone
          setIsMicEnabled(true);

          const detectedDescriptor = detections[0].descriptor;

          if (
            personId &&
            lastDescriptor &&
            faceapi.euclideanDistance(detectedDescriptor, lastDescriptor) <
              0.4 &&
            new Date() - lastPersonTimestamp < 10000
          ) {
            // Se a mesma pessoa for detectada dentro de 1 minuto, mantém o ID
            setCurrentPerson({ id: personId, image: detections[0] });
            console.log(`Retained existing ID: ${personId}`);
            // Clear the existing expiration timeout
            if (idExpirationTimeout) {
              clearTimeout(idExpirationTimeout);
              setIdExpirationTimeout(null);
            }
          } else {
            // Nova pessoa ou mais de 1 minuto se passou
            const newPersonId = uuidv4();
            setPersonId(newPersonId);
            setLastDescriptor(detectedDescriptor);
            setCurrentPerson({ id: newPersonId, image: detections[0] });
            console.log(`Created new ID: ${newPersonId}`);

            // Define um timeout para expirar o ID após 1 minuto
            const expirationTimeout = setTimeout(() => {
              console.log(`ID ${newPersonId} expired after 1 minute`);
              setPersonId("");
              setLastDescriptor(null);
              setCurrentPerson(null);
              setLastSavedTranscript(""); // Reset lastSavedTranscript
              setIsMicEnabled(false); // Desativar microfone quando ID expirar
            }, 10000);
            setIdExpirationTimeout(expirationTimeout);
          }

          // Atualiza o timestamp da última detecção
          setLastPersonTimestamp(new Date());

          const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.4);
          const bestMatch = faceMatcher.findBestMatch(detectedDescriptor);

          if (bestMatch.label !== "unknown" && bestMatch.distance < 0.4) {
            setCurrentPerson({ id: bestMatch.label, image: detections[0] });
            console.log(`Recognized user: ${bestMatch.label}`);

            const botDoc = await findBotWithAvt();
            if (
              botDoc &&
              transcripts.length > 0 &&
              response.length > 0 &&
              transcripts[transcripts.length - 1] !== lastSavedTranscript
            ) {
              const userMessagesRef = collection(
                db,
                `habitats/${habitatId}/avatars/${botDoc.id}/messages/${bestMatch.label}/userMessages`
              );

              try {
                await addDoc(userMessagesRef, {
                  sender: bestMatch.label,
                  message: transcripts[transcripts.length - 1],
                  timestamp: new Date(),
                });

                for (const comando of response) {
                  await addDoc(userMessagesRef, {
                    sender: "bot",
                    message: comando.texto,
                    timestamp: new Date(),
                  });
                }

                setLastSavedTranscript(transcripts[transcripts.length - 1]);
              } catch (error) {
                console.error("Error saving messages to Firestore:", error);
              }
            }
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
        } else {
          if (!detectionTimeout) {
            setIsMicEnabled(false); // Desativar microfone se nenhuma pessoa for detectada

            const timeout = setTimeout(() => {
              console.log(
                "Person left the frame. Starting 60 seconds timer to delete ID:",
                personId
              );

              // Set a timeout to delete the ID after 60 seconds if no one reappears
              const expirationTimeout = setTimeout(() => {
                console.log(`ID ${personId} expired after 1 minute`);
                setPersonId("");
                setLastDescriptor(null);
                setCurrentPerson(null);
                setLastSavedTranscript(""); // Reset lastSavedTranscript
                setIsMicEnabled(false); // Desativar microfone quando ID expirar
              }, 10000);

              setIdExpirationTimeout(expirationTimeout);
              setDetectionTimeout(null);
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
    transcripts,
    response,
    habitatId,
    lastSavedTranscript,
    lastDescriptor,
    lastPersonTimestamp,
    idExpirationTimeout,
    setIsMicEnabled, // Adicione a dependência para o controle do microfone
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
