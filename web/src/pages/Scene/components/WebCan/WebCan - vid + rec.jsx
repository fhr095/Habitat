import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { v4 as uuidv4 } from "uuid";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase";
import "./WebCan.scss";

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
  const canvasRef = useRef(null); // Referência para o canvas onde desenharemos os retângulos e IDs
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);
  const [personId, setPersonId] = useState("");
  const [lastDescriptor, setLastDescriptor] = useState(null);
  const [detectionTimeout, setDetectionTimeout] = useState(null);
  const [lastSavedTranscript, setLastSavedTranscript] = useState("");
  const [lastPersonTimestamp, setLastPersonTimestamp] = useState(null);
  const [idExpirationTimeout, setIdExpirationTimeout] = useState(null);
  const [mode, setMode] = useState("video");
  const [videoFile, setVideoFile] = useState(null);


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
      if (mode === "webcam") {
        navigator.mediaDevices
          .getUserMedia({ video: {} })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
            }
          })
          .catch((err) => console.error("Error accessing webcam: ", err));
      } else if (mode === "video" && videoFile) {
        const videoURL = URL.createObjectURL(videoFile);
        if (videoRef.current) {
          videoRef.current.src = videoURL;
          videoRef.current.play();
        }
      }
    };

    loadModels();
  }, [habitatId, mode, videoFile]);

  const handleVideoUpload = (event) => {
    setVideoFile(event.target.files[0]);
  };

  const findBotWithAvt = async () => {
    const avatarsCollection = collection(db, `habitats/${habitatId}/avatars`);
    const q = query(avatarsCollection, where("avt", "==", habitatId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0];
    } else {
      console.error("No bot found with the matching avt");
      return null;
    }
  };

  // Este é o código revisado, sem erros de sintaxe
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

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        // Redimensiona o canvas para corresponder ao tamanho do vídeo
        const { width, height } = videoRef.current.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;

        context.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas antes de desenhar

        if (isDetected) {
          setIsMicEnabled(true);

          const detectedDescriptor = detections[0].descriptor;
          let finalPersonId = personId;

          if (
            personId &&
            lastDescriptor &&
            faceapi.euclideanDistance(detectedDescriptor, lastDescriptor) < 0.4 &&
            new Date() - lastPersonTimestamp < 10000
          ) {
            setCurrentPerson({ id: personId, image: detections[0] });
            console.log(`Retained existing ID: ${personId}`);
            if (idExpirationTimeout) {
              clearTimeout(idExpirationTimeout);
              setIdExpirationTimeout(null);
            }
          } else {
            finalPersonId = uuidv4();
            setPersonId(finalPersonId);
            setLastDescriptor(detectedDescriptor);
            setCurrentPerson({ id: finalPersonId, image: detections[0] });
            console.log(`Created new ID: ${finalPersonId}`);

            const expirationTimeout = setTimeout(() => {
              console.log(`ID ${finalPersonId} expired after 10 seconds`);
              setPersonId("");
              setLastDescriptor(null);
              setCurrentPerson(null);
              setLastSavedTranscript("");
              setIsMicEnabled(false);
            }, 10000);
            setIdExpirationTimeout(expirationTimeout);
          }

          setLastPersonTimestamp(new Date());

          const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.4);
          const bestMatch = faceMatcher.findBestMatch(detectedDescriptor);

          if (bestMatch.label !== "unknown" && bestMatch.distance < 0.4) {
            setCurrentPerson({ id: bestMatch.label, image: detections[0] });
            console.log(`Recognized user: ${bestMatch.label}`);
            finalPersonId = bestMatch.label;

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

          // Desenhar o retângulo e o ID no canvas, redimensionando as coordenadas
          detections.forEach(detection => {
            const box = detection.detection.box;
            const x = (box.x / videoRef.current.videoWidth) * canvas.width;
            const y = (box.y / videoRef.current.videoHeight) * canvas.height;
            const boxWidth = (box.width / videoRef.current.videoWidth) * canvas.width;
            const boxHeight = (box.height / videoRef.current.videoHeight) * canvas.height;

            context.strokeStyle = "#00FF00";
            context.lineWidth = 2;
            context.strokeRect(x, y, boxWidth, boxHeight);

            context.fillStyle = "#00FF00";
            context.font = "16px Arial";
            context.fillText(finalPersonId, x, y - 10);
          });

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
            setIsMicEnabled(false);

            const timeout = setTimeout(() => {
              console.log(
                "Person left the frame. Starting 2 seconds timer to check ID expiration:",
                personId
              );

              const expirationTimeout = setTimeout(() => {
                console.log(`ID ${personId} expired after 10 seconds`);
                setPersonId("");
                setLastDescriptor(null);
                setCurrentPerson(null);
                setLastSavedTranscript("");
                setIsMicEnabled(false);
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
      setIsMicEnabled,
    ]);


  return (
    <div className="webcan-container">
      <div className="video-container">
        <video ref={videoRef} autoPlay muted />
        <canvas ref={canvasRef} className="overlay-canvas" />
      </div>
      <div className="controls-container">
        <label>
          <input
            type="radio"
            value="webcam"
            checked={mode === "webcam"}
            onChange={() => setMode("webcam")}
          />
          Webcam
        </label>
        <label>
          <input
            type="radio"
            value="video"
            checked={mode === "video"}
            onChange={() => setMode("video")}
          />
          Video
        </label>
        {mode === "video" && (
          <input type="file" accept="video/*" onChange={handleVideoUpload} />
        )}
      </div>
    </div>
  );
}
