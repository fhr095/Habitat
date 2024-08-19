import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import { storage, db } from "../../../../firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, collection } from "firebase/firestore";

import { FaTimes } from "react-icons/fa";
import "./ModalFaceData.scss";

export default function ModalFaceData({ habitatId, user, onClose }) {
    const videoRef = useRef(null);
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const [capturing, setCapturing] = useState(false);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
            console.log('Models loaded successfully');
            startVideo();
        };

        const startVideo = () => {
            navigator.mediaDevices.getUserMedia({ video: {} })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                    }
                })
                .catch(err => console.error("Error accessing camera: ", err));
        };

        const detectFace = async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
                const detections = await faceapi.detectAllFaces(videoRef.current, options).withFaceLandmarks();

                setIsFaceDetected(detections.length > 0);
            }
        };

        loadModels();
        const interval = setInterval(detectFace, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleCapture = async () => {
        if (videoRef.current && isFaceDetected) {
            setCapturing(true);
            const canvas = faceapi.createCanvasFromMedia(videoRef.current);
            const context = canvas.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

            const storageRef = ref(storage, `faces/${user}.jpg`);
            await uploadBytes(storageRef, imageBlob);
            const imageUrl = await getDownloadURL(storageRef);

            const habitatRef = doc(collection(db, "habitats", habitatId, "faces"), user);

            await setDoc(habitatRef, {
                user: user,
                imageUrl: imageUrl,
                timestamp: new Date()
            });

            setCapturing(false);
            alert("Face captured and saved successfully!");
            onClose();
        } else {
            alert("Please make sure a face is detected.");
        }
    };

    return (
        <div className="modal-face">
            <div className="modal-content">
                <button className="close" onClick={onClose}>
                    <FaTimes size={20}/>
                </button>
                <div>
                    <h1>Register Your Face</h1>
                    <video ref={videoRef} autoPlay muted width="100%" style={{ borderRadius: '10px' }} />
                    <button
                        onClick={handleCapture}
                        disabled={!isFaceDetected || capturing}
                    >
                        {capturing ? 'Capturing...' : 'Capture and Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}