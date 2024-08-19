// src/utils/faceUtils.js
import * as faceapi from 'face-api.js';

export const loadModels = async () => {
  const MODEL_URL = '/models';
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
};

export const loadKnownFaces = () => {
  const storedFaces = JSON.parse(localStorage.getItem('labeledFaces')) || [];
  const descriptors = storedFaces.map(face => 
    new faceapi.LabeledFaceDescriptors(String(face.id), [new Float32Array(Object.values(face.descriptor))])
  );
  return descriptors;
};

export const saveNewFace = (newFace) => {
  const storedFaces = JSON.parse(localStorage.getItem('labeledFaces')) || [];
  storedFaces.push({
    id: newFace.id,
    descriptor: Array.from(newFace.descriptor)
  });
  localStorage.setItem('labeledFaces', JSON.stringify(storedFaces));
};

export const getFaceDetectorOptions = (faceDetector, minConfidence, inputSize) => {
  switch (faceDetector) {
    case 'ssd_mobilenetv1':
      return new faceapi.SsdMobilenetv1Options({ minConfidence });
    case 'tiny_face_detector':
      return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: minConfidence });
    default:
      return new faceapi.SsdMobilenetv1Options({ minConfidence });
  }
};
