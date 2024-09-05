import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

export default function WebCan({ setIdentify }) {
  const videoRef = useRef(null);

  const startVideo = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    videoRef.current.srcObject = stream;
  };

  const handleVideoOnPlay = async () => {
    // Carregar modelos face-api.js
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    
    setInterval(async () => {
      if (videoRef.current) {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
        setIdentify(detections.length > 0 ? true : false);
      }
    }, 1000);
  };

  useEffect(() => {
    startVideo();
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        onPlay={handleVideoOnPlay}
        autoPlay
        muted
        width="720"
        height="560"
        style={{ border: "1px solid black" }}
      />
    </div>
  );
}