/*import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import { loadModels } from "../utils/loadModels"; // Importar a função utilitária


export default function Modal({ closeModal, addNewFace }) {
  const videoRef = useRef(null);
  const [name, setName] = useState("");
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false); // Estado para feedback visual

  useEffect(() => {
    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play().catch(err => console.error("Error playing video: ", err));
            };
          }
        })
        .catch(err => console.error("Error accessing the camera: ", err));
    };

    const detectFace = async () => {
      if (videoRef.current && videoRef.current.readyState === 4 && modelsLoaded) {
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        });

        const detections = await faceapi.detectAllFaces(videoRef.current, options)
          .withFaceLandmarks();

        setIsFaceDetected(detections.length > 0);
      }
      requestAnimationFrame(detectFace); // Usar requestAnimationFrame
    };

    loadModels().then(() => {
      setModelsLoaded(true); // Atualizar estado de carregamento dos modelos
      startVideo();
      detectFace();
    });
  }, [modelsLoaded]);

  const handleCapture = async () => {
    if (videoRef.current && isFaceDetected && name.trim() !== "") {
      setCapturing(true);
      try {
        const canvas = faceapi.createCanvasFromMedia(videoRef.current);
        const context = canvas.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
        console.log('Image captured:', imageBlob);

        const reader = new FileReader();
        reader.onloadend = async () => {
          const imageDataUrl = reader.result;
          console.log('Image data URL:', imageDataUrl);

          const detection = await faceapi.detectSingleFace(canvas).withFaceLandmarks().withFaceDescriptor();
          console.log('Detection:', detection);

          if (detection) {
            const newFace = {
              name,
              descriptor: detection.descriptor,
              imageDataUrl,
            };

            addNewFace(newFace);
            setCapturing(false);
            alert("Face captured and saved successfully!");
            closeModal();
          } else {
            alert("Face not detected. Please try again.");
            setCapturing(false);
          }
        };

        reader.readAsDataURL(imageBlob);
      } catch (error) {
        console.error('Error during capture:', error);
        alert('An error occurred during capture. Please try again.');
        setCapturing(false);
      }
    } else {
      alert("Please make sure a face is detected and the name is entered.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {!modelsLoaded && <p>Loading models, please wait...</p>}*/ {/* Feedback visual */}/*
        <button className="modal-close" onClick={closeModal}>Close</button>
        <div>
          <h1>Register Your Face</h1>
          <video ref={videoRef} autoPlay muted width="100%" style={{ borderRadius: '10px' }} />
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '10px', margin: '10px 0' }}
          />
          <button
            onClick={handleCapture}
            disabled={!isFaceDetected || capturing}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px' }}
          >
            {capturing ? 'Capturing...' : 'Capture and Save'}
          </button>
        </div>
      </div>
    </div>
  );
}*/