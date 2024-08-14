import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function WebCam({ setIsPersonDetected, setPersons, habitatId }) {
  const videoRef = useRef(null);
  const labeledFaceDescriptors = useRef([]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; 
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        console.log('Models loaded successfully');
        await loadLabeledImages();
      } catch (error) {
        console.error('Error loading models: ', error);
      }
    };

    const loadLabeledImages = async () => {
      const facesCollection = collection(db, `habitats/${habitatId}/faces`);
      const facesSnapshot = await getDocs(facesCollection);
      
      const labeledDescriptorsPromises = facesSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const img = await faceapi.fetchImage(data.imageUrl);
        const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

        if (detections) {
          return new faceapi.LabeledFaceDescriptors(data.name, [detections.descriptor]);
        } else {
          console.warn(`No faces detected for ${data.name}`);
          return null;
        }
      });

      labeledFaceDescriptors.current = (await Promise.all(labeledDescriptorsPromises)).filter(Boolean);
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
      if (videoRef.current && videoRef.current.readyState === 4 && labeledFaceDescriptors.current.length > 0) {
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        });

        const detections = await faceapi.detectAllFaces(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender()
          .withFaceDescriptors();

        setIsPersonDetected(detections.length > 0);

        if (detections.length > 0) {
          const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors.current, 0.6);

          detections.forEach(detection => {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            if (bestMatch.label !== 'unknown') {
              console.log(`Person detected: ${bestMatch.label}`);
            } else {
              console.log('Person not recognized');
            }
          });

          const persons = detections.map(person => {
            return {
              emotion: person.expressions.asSortedArray()[0].expression,
              age: Math.floor(person.age),
              gender: person.gender,
            };
          });

          setPersons(persons);
        }
      }
    };

    loadModels().then(startVideo);

    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, [setIsPersonDetected, setPersons, habitatId]);

  return (
    <video ref={videoRef} autoPlay muted style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />
  );
}