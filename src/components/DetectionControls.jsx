// src/components/DetectionControls.jsx
import React from 'react';

const DetectionControls = ({ isTestRunning, startTest, stopTest, modelsLoaded, faceDetector, setFaceDetector, inputSize, setInputSize, minConfidence, setMinConfidence }) => {
  return (
    <div className="controls">
      {isTestRunning ? (
        <button onClick={stopTest}>Stop Test</button>
      ) : (
        <button onClick={startTest} disabled={!modelsLoaded}>Start Test</button>
      )}
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
  );
};

export default DetectionControls;
