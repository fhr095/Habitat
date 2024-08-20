import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { v4 as uuidv4 } from "uuid";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function WebCan({ setIsPersonDetected, setPersons, setCurrentPerson, habitatId }) {
  const videoRef = useRef(null);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);
  const [personId, setPersonId] = useState("");
  const [detectionTimeout, setDetectionTimeout] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        console.log('Models loaded successfully');
        await loadLabeledImages();
        startVideo();
      } catch (error) {
        console.error('Error loading models: ', error);
      }
    };

    const loadLabeledImages = async () => {
      try {
        const facesCollection = collection(db, `habitats/${habitatId}/faces`);
        const facesSnapshot = await getDocs(facesCollection);
        const labeledDescriptors = await Promise.all(facesSnapshot.docs.map(async doc => {
          const data = doc.data();
          const img = await faceapi.fetchImage(data.imageUrl);
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
          if (detections) {
            return new faceapi.LabeledFaceDescriptors(data.user, [detections.descriptor]);
          }
          return null;
        }));
        setLabeledDescriptors(labeledDescriptors.filter(Boolean));
      } catch (error) {
        console.error("Error loading labeled images: ", error);
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

    loadModels();
  }, [habitatId]);

  useEffect(() => {
    const detectFace = async () => {
      if (videoRef.current && videoRef.current.readyState === 4 && labeledDescriptors.length > 0) {
        const options = new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.7,  // Increase the minimum confidence for detections
        });

        const detections = await faceapi.detectAllFaces(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender()
          .withFaceDescriptors();

        setIsPersonDetected(detections.length > 0);

        if (detections.length > 0) {
          const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.4); // Lower threshold for more strict matching
          const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);

          if (bestMatch.label !== "unknown" && bestMatch.distance < 0.4) {
            setCurrentPerson({ id: bestMatch.label, image: detections[0] });
            console.log("Recognized user:", bestMatch.label);
          } else if (!personId) {
            const newPersonId = uuidv4();
            setPersonId(newPersonId);

            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext("2d");
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL("image/png");

            setCurrentPerson({ id: newPersonId, image: imageData });
            console.log("New person detected with ID:", newPersonId);
          }

          const persons = detections.map(person => ({
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
              console.log("Person left the frame. Deleting data for ID:", personId);
              setPersonId("");
              setCurrentPerson(null);
              setDetectionTimeout(null);
            }, 2000);
            setDetectionTimeout(timeout);
          }
        }
      }
    };

    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, [setIsPersonDetected, setPersons, personId, detectionTimeout, labeledDescriptors]);

  return (
    <video ref={videoRef} autoPlay muted style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />
  );
}