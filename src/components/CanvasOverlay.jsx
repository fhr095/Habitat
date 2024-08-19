// src/components/CanvasOverlay.jsx
import React, { useRef, useEffect } from 'react';

const CanvasOverlay = ({ videoRef, detections, faceId }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (detections.length > 0 && videoRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      detections.forEach(detection => {
        const box = detection.detection.box;
        context.strokeStyle = '#00FF00';
        context.lineWidth = 2;
        context.strokeRect(box.x, box.y, box.width, box.height);

        context.fillStyle = '#00FF00';
        context.font = '16px Arial';
        context.fillText(faceId, box.x, box.y - 10);
      });
    }
  }, [detections, videoRef, faceId]);

  return <canvas ref={canvasRef} />;
};

export default CanvasOverlay;
