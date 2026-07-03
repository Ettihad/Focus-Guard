import { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import { Camera, CameraOff, Volume2, VolumeX, AlertCircle, Shield, ShieldAlert } from 'lucide-react';
import { audio } from '../utils/audio';

interface CameraDetectorProps {
  isArmed: boolean;
  onArmedChange: (armed: boolean) => void;
  onDistractionDetected: () => void;
  isMuted: boolean;
  onMuteChange: (muted: boolean) => void;
}

export default function CameraDetector({
  isArmed,
  onArmedChange,
  onDistractionDetected,
  isMuted,
  onMuteChange,
}: CameraDetectorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);

  const isDetectingRef = useRef(false);
  const lastPredictTimeRef = useRef(0);
  const lastDetectedTimestamp = useRef(0);
  const predictionsRef = useRef<cocoSsd.DetectedObject[]>([]);

  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);

  // 1. Initialize TensorFlow model
  useEffect(() => {
    let isMounted = true;

    async function initModel() {
      try {
        setModelStatus('loading');
        await tf.ready();

        // Validate WebGL shader compilation, fallback to CPU if needed
        try {
          if (tf.getBackend() === 'webgl') {
            const testTensor = tf.zeros([1, 1]);
            testTensor.square().dataSync();
            testTensor.dispose();
          }
        } catch {
          console.warn('WebGL initialization failed, falling back to CPU backend.');
          await tf.setBackend('cpu');
          await tf.ready();
        }

        const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (isMounted) {
          modelRef.current = model;
          setModelStatus('ready');
        }
      } catch (err) {
        console.error('Failed to load COCO-SSD model:', err);
        if (tf.getBackend() !== 'cpu') {
          try {
            await tf.setBackend('cpu');
            await tf.ready();
            const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
            if (isMounted) {
              modelRef.current = model;
              setModelStatus('ready');
              return;
            }
          } catch (cpuErr) {
            console.error('CPU fallback failed:', cpuErr);
          }
        }
        if (isMounted) {
          setModelStatus('error');
        }
      }
    }

    initModel();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Camera stream management
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in browser settings.'
          : 'Could not access camera. Please verify your camera is connected.'
      );
      onArmedChange(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setPhoneDetected(false);
    audio.stopAlarm();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  // 3. Render and Detection loop
  useEffect(() => {
    if (!cameraActive) return;

    let active = true;

    const renderLoop = async () => {
      if (!active || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === 4 && ctx) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Draw camera frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const now = Date.now();

        // Run object detection if armed and throttled to ~7fps to prevent main-thread lag
        if (isArmed && modelRef.current && !isDetectingRef.current && now - lastPredictTimeRef.current > 140) {
          isDetectingRef.current = true;
          modelRef.current
            .detect(video)
            .then((predictions) => {
              predictionsRef.current = predictions;
              lastPredictTimeRef.current = Date.now();
              isDetectingRef.current = false;

              let found = false;
              let maxScore = 0;

              predictions.forEach((item) => {
                const isPhone = item.class === 'cell phone' || item.class === 'phone';
                if (isPhone && item.score >= 0.45) {
                  found = true;
                  if (item.score > maxScore) maxScore = item.score;
                }
              });

              setPhoneDetected(found);
              setConfidence(maxScore);

              if (found) {
                const checkTime = Date.now();
                if (checkTime - lastDetectedTimestamp.current > 4000) {
                  onDistractionDetected();
                  lastDetectedTimestamp.current = checkTime;
                }
                if (!isMuted) {
                  audio.startAlarm();
                } else {
                  audio.stopAlarm();
                }
              } else {
                audio.stopAlarm();
              }
            })
            .catch(async () => {
              isDetectingRef.current = false;
              if (tf.getBackend() !== 'cpu') {
                try {
                  await tf.setBackend('cpu');
                  await tf.ready();
                } catch {}
              }
            });
        }

        if (!isArmed) {
          predictionsRef.current = [];
          setPhoneDetected(false);
          audio.stopAlarm();
        }

        // Draw bounding box for detected phone
        if (isArmed && predictionsRef.current.length > 0) {
          predictionsRef.current.forEach((item) => {
            const isPhone = item.class === 'cell phone' || item.class === 'phone';
            if (isPhone && item.score >= 0.45) {
              const [x, y, w, h] = item.bbox;

              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, w, h);

              ctx.fillStyle = '#ef4444';
              ctx.fillRect(x, Math.max(0, y - 22), Math.max(w, 140), 22);

              ctx.fillStyle = '#ffffff';
              ctx.font = '500 12px sans-serif';
              ctx.fillText(`Phone ${Math.round(item.score * 100)}%`, x + 6, Math.max(14, y - 6));
            }
          });
        }
      }

      if (active) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    renderLoop();

    return () => {
      active = false;
      audio.stopAlarm();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [cameraActive, isArmed, isMuted, onDistractionDetected]);

  const toggleSoundTest = () => {
    if (audio.isAlarmPlaying()) {
      audio.stopAlarm();
    } else {
      audio.startAlarm();
      setTimeout(() => audio.stopAlarm(), 1500);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Camera size={16} className="text-zinc-400" />
            Distraction Guard
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitors camera stream for phone usage
          </p>
        </div>

        <button
          onClick={() => onArmedChange(!isArmed)}
          disabled={modelStatus === 'loading'}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isArmed
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {modelStatus === 'loading'
            ? 'Loading AI...'
            : isArmed
            ? 'Disarm Guard'
            : 'Arm Guard'}
        </button>
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-[4/3] w-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
        {!cameraActive && !cameraError && (
          <div className="flex flex-col items-center gap-2 text-zinc-500">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
            <span className="text-xs">Initializing video...</span>
          </div>
        )}

        {cameraError && (
          <div className="p-4 text-center flex flex-col items-center gap-2 text-zinc-400">
            <CameraOff size={28} className="text-red-400" />
            <span className="text-xs text-red-300">{cameraError}</span>
          </div>
        )}

        <video ref={videoRef} playsInline muted className="hidden" />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        />

        {/* Status indicator badge */}
        {cameraActive && (
          <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {phoneDetected && isArmed ? (
                <ShieldAlert size={15} className="text-red-400 animate-pulse" />
              ) : isArmed ? (
                <Shield size={15} className="text-emerald-400" />
              ) : (
                <Camera size={15} className="text-zinc-500" />
              )}
              <span className="text-zinc-300 font-medium">
                {!isArmed
                  ? 'Preview Mode'
                  : phoneDetected
                  ? `Phone Detected (${Math.round(confidence * 100)}%)`
                  : 'Guard Active'}
              </span>
            </div>

            <span className="text-[10px] font-mono text-zinc-500">
              {modelStatus === 'ready' ? 'COCO-SSD' : 'Initializing'}
            </span>
          </div>
        )}
      </div>

      {/* Footer controls & mute toggle */}
      <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
        <button
          onClick={() => onMuteChange(!isMuted)}
          className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
        >
          {isMuted ? (
            <>
              <VolumeX size={14} className="text-amber-400" />
              <span>Alarm Muted</span>
            </>
          ) : (
            <>
              <Volume2 size={14} className="text-zinc-400" />
              <span>Sound On</span>
            </>
          )}
        </button>

        <button
          onClick={toggleSoundTest}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors text-zinc-400"
        >
          <AlertCircle size={13} />
          <span>Test Alert</span>
        </button>
      </div>
    </div>
  );
}
