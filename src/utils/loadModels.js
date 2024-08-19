import * as faceapi from "face-api.js";

export const loadModels = async () => {
  const MODEL_URL = '/models';
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL); // Carregar o modelo adicional
    console.log('Models loaded successfully');
  } catch (error) {
    console.error('Error loading models: ', error);
  }
};
