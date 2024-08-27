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
}) {
  const videoRef = useRef(null);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);
  const [personId, setPersonId] = useState("");
  const [detectionTimeout, setDetectionTimeout] = useState(null);
  const [lastSavedTranscript, setLastSavedTranscript] = useState(""); // Track the last saved transcript

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
          const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.4);
          const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);

          if (bestMatch.label !== "unknown" && bestMatch.distance < 0.4) {
            setCurrentPerson({ id: bestMatch.label, image: detections[0] });
            console.log("Recognized user:", bestMatch.label);

            // Find the bot with the matching avt
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
                // Save the user's message
                await addDoc(userMessagesRef, {
                  sender: bestMatch.label,
                  message: transcripts[transcripts.length - 1],
                  timestamp: new Date(),
                });

                // Save the AI's response
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
          } else if (!personId) {
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
              setLastSavedTranscript("");
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