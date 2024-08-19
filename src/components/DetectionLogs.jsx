// src/components/DetectionLogs.jsx
import React from 'react';

const DetectionLogs = ({ detectedFaces }) => {
  return (
    <div>
      <h2>{detectedFaces.length > 0 ? 'Detections' : 'No Detections'}</h2>
      <ul>
        {detectedFaces.map((face, index) => (
          <li key={index}>
            ID: {face.id}, First Seen: {face.firstSeen.toLocaleTimeString()}, Last Seen: {face.lastSeen.toLocaleTimeString()}, Detections: {face.detections}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DetectionLogs;
