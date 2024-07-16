import React, { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import * as faceapi from "face-api.js";
import { db } from "../../../../firebase"; // Certifique-se de importar corretamente seu Firebase

import botImg from "../../../../assets/images/avatar.png";
import "./Welcome.scss";

export default function Welcome({ habitatId, transcript }) {
  const [welcomeData, setWelcomeData] = useState(null);
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchWelcomeData = () => {
      const welcomeRef = doc(db, `habitats/${habitatId}/welcome/welcomeData`);
      const unsubscribe = onSnapshot(welcomeRef, (doc) => {
        if (doc.exists()) {
          setWelcomeData(doc.data());
        } else {
          console.log("No such document!");
        }
      });

      return () => unsubscribe();
    };

    fetchWelcomeData();
  }, [habitatId]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // path to your models
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log('Model loaded successfully');
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
          inputSize: 320, // Usando uma resolução menor para melhor desempenho
          scoreThreshold: 0.5 // Diminuir o limiar de pontuação para detectar mais faces
        });

        const detections = await faceapi.detectAllFaces(videoRef.current, options);
        setIsPersonDetected(detections.length > 0);
      }
    };

    loadModels().then(startVideo);

    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <video ref={videoRef} autoPlay muted style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />
      {transcript === "" && welcomeData?.active && isPersonDetected && (
        <div className="welcome-container">
          <img src={botImg} alt="Bot" />
          <div className="welcome-text">{welcomeData?.text}</div>
        </div>
      )}
    </>
  );
}