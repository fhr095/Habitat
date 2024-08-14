import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import { storage, db } from "../../../../firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, collection } from "firebase/firestore";

export default function Modal({ closeModal, habitatId }) {
    const videoRef = useRef(null);
    const [name, setName] = useState("");
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
        if (videoRef.current && isFaceDetected && name.trim() !== "") {
            setCapturing(true);
            const canvas = faceapi.createCanvasFromMedia(videoRef.current);
            const context = canvas.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

            const storageRef = ref(storage, `faces/${name}.jpg`);
            await uploadBytes(storageRef, imageBlob);
            const imageUrl = await getDownloadURL(storageRef);

            const habitatRef = doc(collection(db, "habitats", habitatId, "faces"));

            await setDoc(habitatRef, {
                name: name,
                imageUrl: imageUrl,
                timestamp: new Date()
            });

            setCapturing(false);
            alert("Face captured and saved successfully!");
            closeModal();
        } else {
            alert("Please make sure a face is detected and the name is entered.");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
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
}