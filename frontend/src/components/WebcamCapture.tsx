import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

export function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCaptured(null);
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError('Camera access denied. Please allow camera permission and try again.');
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  const triggerCountdown = () => {
    let count = 3;
    setCountdown(count);
    const timer = setInterval(() => {
      count -= 1;
      if (count === 0) {
        clearInterval(timer);
        setCountdown(null);
        takeSnapshot();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL('image/jpeg', 0.92));
    // Stop stream
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const confirm = () => {
    if (!captured || !canvasRef.current) return;
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      'image/jpeg',
      0.92,
    );
  };

  const retake = () => {
    setCaptured(null);
    void startCamera();
  };

  return (
    <div className="webcam-overlay" role="dialog" aria-modal="true" aria-label="Liveness face capture">
      <div className="webcam-modal">
        <div className="webcam-header">
          <div className="webcam-title">
            <Camera size={20} />
            <span>Live Face Capture</span>
          </div>
          <button className="webcam-close" onClick={onClose} aria-label="Close camera">
            <X size={18} />
          </button>
        </div>

        <div className="webcam-body">
          {error ? (
            <div className="webcam-error">
              <p>{error}</p>
              <button className="primary-button" onClick={() => void startCamera()}>Retry</button>
            </div>
          ) : captured ? (
            <div className="webcam-preview">
              <img src={captured} alt="Captured selfie" className="webcam-snapshot" />
              <p className="webcam-hint">Looking good? Confirm to use this photo or retake.</p>
              <div className="webcam-actions">
                <button className="webcam-btn-secondary" onClick={retake}><RefreshCw size={16} />Retake</button>
                <button className="webcam-btn-primary" onClick={confirm}><Check size={16} />Use Photo</button>
              </div>
            </div>
          ) : (
            <div className="webcam-live">
              <div className="webcam-frame">
                <video ref={videoRef} autoPlay playsInline muted className="webcam-video" />
                {countdown !== null && (
                  <div className="webcam-countdown">{countdown}</div>
                )}
                <div className="face-ring" />
              </div>
              <p className="webcam-hint">Position your face inside the circle and click Capture.</p>
              <button
                className="webcam-btn-primary webcam-capture-btn"
                onClick={triggerCountdown}
                disabled={countdown !== null}
                id="webcam-capture-button"
              >
                <Camera size={18} />
                {countdown !== null ? `Capturing in ${countdown}…` : 'Capture Face'}
              </button>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
