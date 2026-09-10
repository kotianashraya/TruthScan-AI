import React, { useRef, useState, useEffect } from 'react';

export default function CameraCapture({ onCapture, onError, onClose }: { onCapture: (blob: Blob) => void; onError: (msg: string) => void; onClose: () => void; }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const start = async () => {
      setStarting(true);
      try {
        const constraints: MediaStreamConstraints = { video: { facingMode: { ideal: 'environment' } }, audio: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current && mounted) {
          videoRef.current.srcObject = stream;
          // Ensure preview is not visually mirrored by any CSS or UA defaults
          try {
            videoRef.current.style.transform = 'none';
            // vendor-prefixed variant
            // @ts-ignore
            videoRef.current.style.webkitTransform = 'none';
          } catch (e) {
            /* ignore */
          }
          await videoRef.current.play();
        }
      } catch (err: any) {
        console.error('Camera error', err);
        onError(err?.message || 'Unable to access camera.');
      } finally {
        setStarting(false);
      }
    };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onError('Camera not supported in this browser.');
      return undefined;
    }

    void start();

    return () => {
      mounted = false;
      // stop tracks
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return onError('Camera feed not available.');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return onError('Unable to capture image.');
    // Ensure the canvas has a default (non-flipped) transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        // stop stream
        streamRef.current?.getTracks().forEach(t => t.stop());
        onCapture(blob);
      } else {
        onError('Capture failed.');
      }
    }, 'image/jpeg');
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-lg overflow-hidden bg-black/60 border border-white/10">
        <video ref={videoRef} className="w-full h-64 object-cover" playsInline muted />
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <button onClick={handleCapture} className="px-5 py-2 rounded-full bg-cyan-500 text-black font-semibold" aria-label="Capture photo">Capture Photo</button>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5">Cancel</button>
      </div>
    </div>
  );
}
