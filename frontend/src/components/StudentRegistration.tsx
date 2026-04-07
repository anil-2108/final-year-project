import { useState, useRef, useEffect } from "react";
import { Camera, UserPlus, Upload } from "lucide-react";
import { supabase } from "../lib/supabase";
import { detectFaces, getFaceDescriptor, loadModels } from "../utils/faceDetection";

export function StudentRegistration() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [message, setMessage] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadModels().catch(console.error);
  }, []);

  const startCamera = async () => {
    setMessage("Starting camera...");
    setCapturing(true);
    setCameraReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadeddata = () => {
          setCameraReady(true);
          setMessage("");
        };

        await videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      setMessage("Camera access failed");
      setCapturing(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCapturing(false);
    setCameraReady(false);
  };

  const captureAndRegister = async () => {
    if (!cameraReady) {
      setMessage("Camera is still loading, please wait");
      return;
    }

    if (!name.trim()) {
      setMessage("Please enter student name");
      return;
    }

    if (!supabase) {
      setMessage("Supabase is not configured. Please add your credentials to the .env file.");
      return;
    }

    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    const detections = await detectFaces(video);

    if (detections.length !== 1) {
      setMessage("Ensure exactly one face is visible");
      return;
    }

    const descriptor = getFaceDescriptor(detections[0]);

    const { error } = await supabase.from("students").insert({
      name,
      email: email || null,
      face_encoding: JSON.stringify(descriptor),
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Student registered successfully ✅");
    stopCamera();
    setName("");
    setEmail("");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold flex gap-2 mb-4">
        <UserPlus /> Register New Student
      </h2>

      <input
        className="w-full border p-2 rounded mb-2"
        placeholder="Student Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="w-full border p-2 rounded mb-4"
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="border-2 border-dashed p-4 rounded">
        {capturing ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-[320px] bg-black rounded"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2 mt-3">
              <button
                onClick={captureAndRegister}
                className="flex-1 bg-green-600 text-white p-2 rounded"
              >
                <Upload size={16} /> Capture & Register
              </button>

              <button
                onClick={stopCamera}
                className="bg-gray-500 text-white p-2 rounded"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={startCamera}
            className="w-full bg-blue-600 text-white p-3 rounded"
          >
            <Camera /> Start Camera
          </button>
        )}
      </div>

      {message && (
        <div className="mt-3 p-2 bg-blue-100 text-blue-800 rounded">
          {message}
        </div>
      )}
    </div>
  );
}