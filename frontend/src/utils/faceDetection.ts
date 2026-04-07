import * as faceapi from "face-api.js";

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;

  const MODEL_URL = "/models";

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
}

export async function detectFaces(input: HTMLVideoElement) {
  if (!modelsLoaded) {
    await loadModels();
  }

  return await faceapi
    .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
}

export function getFaceDescriptor(
  detection: faceapi.WithFaceDescriptor<any>
) {
  return Array.from(detection.descriptor);
}

export function compareFaces(
  d1: number[],
  d2: number[]
): number {
  return faceapi.euclideanDistance(d1, d2);
}