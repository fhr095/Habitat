import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { loadModels } from "../utils/loadModels";

const FaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [labeledFaceDescriptors, setLabeledFaceDescriptors] = useState([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [detectionIndex, setDetectionIndex] = useState(1);
  const [detectionLogs, setDetectionLogs] = useState([]); // Array para armazenar os logs de detecção
  const [timer, setTimer] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetector, setFaceDetector] = useState("ssd_mobilenetv1");
  const [inputSize, setInputSize] = useState(512);
  const [minConfidence, setMinConfidence] = useState(0.5);

  useEffect(() => {
    const loadKnownFaces = () => {
      const storedFaces = JSON.parse(localStorage.getItem('labeledFaces')) || [];
      const descriptors = storedFaces.map(face => 
        new faceapi.LabeledFaceDescriptors(String(face.id), [new Float32Array(Object.values(face.descriptor))])
      );
      setLabeledFaceDescriptors(descriptors);
    };

    const loadFaceApiModels = async () => {
      try {
        await loadModels();
        setModelsLoaded(true);
        startVideo();
        loadKnownFaces(); // Carrega os rostos conhecidos
      } catch (error) {
        console.error("Error loading models", error);
      }
    };

    loadFaceApiModels();
  }, []);

  useEffect(() => {
    if (isTestRunning) {
      detectFace();
    }
  }, [isTestRunning]);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(() => {
              videoRef.current.width = videoRef.current.videoWidth;
              videoRef.current.height = videoRef.current.videoHeight;
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            });
          };
        }
      })
      .catch(err => console.error("Error accessing the camera", err));
  };

  const getFaceDetectorOptions = () => {
    switch (faceDetector) {
      case 'ssd_mobilenetv1':
        return new faceapi.SsdMobilenetv1Options({ minConfidence });
      case 'tiny_face_detector':
        return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: minConfidence });
      default:
        return new faceapi.SsdMobilenetv1Options({ minConfidence });
    }
  };

  const startTest = () => {
    setIsTestRunning(true);
    setDetectionIndex(1);
    setDetectionLogs([]); // Limpa os logs anteriores

    const testDuration = 60000; // 1 minuto em milissegundos
    setTimer(setTimeout(stopTest, testDuration));
  };

  const stopTest = () => {
    setIsTestRunning(false);
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
    saveDetectionsToFile();
    exportLogsToFile(); // Exporta os logs ao final do teste
  };

  const saveDetectionsToFile = () => {
    if (detectedFaces.length > 0) {
      const blob = new Blob([JSON.stringify(detectedFaces, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detections_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const saveNewFace = (newFace) => {
    const storedFaces = JSON.parse(localStorage.getItem('labeledFaces')) || [];
    storedFaces.push({
      id: newFace.id,
      descriptor: Array.from(newFace.descriptor)
    });
    localStorage.setItem('labeledFaces', JSON.stringify(storedFaces));
  };

  const detectFace = async () => {
    if (isTestRunning && videoRef.current && videoRef.current.readyState === 4 && modelsLoaded) {
      const options = getFaceDetectorOptions();

      const detections = await faceapi.detectAllFaces(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      resizedDetections.forEach(detection => {
        const descriptor = detection.descriptor;
        let existingFace = null;

        // Verifica se o rosto já existe
        labeledFaceDescriptors.forEach(faceDescriptor => {
          const distance = faceapi.euclideanDistance(faceDescriptor.descriptors[0], descriptor);
          if (distance < 0.6) {
            existingFace = faceDescriptor;
          }
        });

        let faceId;
        if (existingFace) {
          faceId = existingFace.label;
          setDetectedFaces(prev => prev.map(face => 
            face.id === existingFace.label 
            ? { ...face, lastSeen: new Date(), detections: face.detections + 1 } 
            : face
          ));
        } else {
          faceId = `face-${Date.now()}`;
          const newFace = { 
            id: faceId, 
            descriptor: descriptor, 
            firstSeen: new Date(), 
            lastSeen: new Date(),
            detections: 1 
          };

          // Salva o novo rosto
          setDetectedFaces(prev => [...prev, newFace]);
          setLabeledFaceDescriptors(prev => [...prev, new faceapi.LabeledFaceDescriptors(faceId, [descriptor])]);
          saveNewFace(newFace);
        }

        // Log simplificado com ID e índice de detecção
        const detectionLog = {
          index: detectionIndex,
          id: faceId,
          timestamp: new Date().toISOString()
        };
        setDetectionLogs(prevLogs => [...prevLogs, detectionLog]);

        console.log(`Detection ${detectionIndex}: ID ${faceId}`);

        const box = detection.detection.box;
        context.strokeStyle = '#00FF00';
        context.lineWidth = 2;
        context.strokeRect(box.x, box.y, box.width, box.height);

        context.fillStyle = '#00FF00';
        context.font = '16px Arial';
        context.fillText(faceId, box.x, box.y - 10);

        setDetectionIndex(prevIndex => prevIndex + 1);
      });
    }

    if (isTestRunning) {
      requestAnimationFrame(detectFace);
    }
  };

  const exportLogsToFile = () => {
    if (detectionLogs.length > 0) {
      const blob = new Blob([JSON.stringify(detectionLogs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detection_logs_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log("Detection logs saved to file");
    } else {
      console.log("No detection logs to save");
    }
  };

  return (
    <div className="container">
      {!modelsLoaded && <p>Loading models, please wait...</p>}
      {isTestRunning ? (
        <button onClick={stopTest}>Stop Test</button>
      ) : (
        <button onClick={startTest} disabled={!modelsLoaded}>Start Test</button>
      )}
      <div className="controls">
        <label>Select Face Detector:</label>
        <select value={faceDetector} onChange={e => setFaceDetector(e.target.value)}>
          <option value="ssd_mobilenetv1">SSD Mobilenet V1</option>
          <option value="tiny_face_detector">Tiny Face Detector</option>
        </select>
        <label>Input Size:</label>
        <select value={inputSize} onChange={e => setInputSize(parseInt(e.target.value))}>
          <option value="160">160 x 160</option>
          <option value="224">224 x 224</option>
          <option value="320">320 x 320</option>
          <option value="416">416 x 416</option>
          <option value="512">512 x 512</option>
          <option value="608">608 x 608</option>
        </select>
        <label>Min Confidence:</label>
        <input type="range" min="0.1" max="1" step="0.1" value={minConfidence} onChange={e => setMinConfidence(parseFloat(e.target.value))} />
        <span>{minConfidence}</span>
      </div>
      <video ref={videoRef} autoPlay muted />
      <canvas ref={canvasRef} />
      <div>
        <h2>{isTestRunning ? 'Test Running...' : 'Test Stopped'}</h2>
        <ul>
          {detectedFaces.map((face, index) => (
            <li key={index}>
              ID: {face.id}, First Seen: {face.firstSeen.toLocaleTimeString()}, Last Seen: {face.lastSeen.toLocaleTimeString()}, Detections: {face.detections}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FaceDetection;
