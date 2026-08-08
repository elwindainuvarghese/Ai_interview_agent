import { useState, useEffect, useRef, useCallback } from 'react';

export function useProctoring({ onTerminate, isEnabled = true }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [lookingAwayCount, setLookingAwayCount] = useState(0);
  const [attentionScore, setAttentionScore] = useState(98);
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [activeWarning, setActiveWarning] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [proctorLogs, setProctorLogs] = useState([]);
  
  // Real-time AI Vision tracking metrics for Canvas overlay
  const [facePosition, setFacePosition] = useState({ x: 0.5, y: 0.5, width: 0.4, height: 0.5, isCentered: true, poseLabel: 'CENTERED' });

  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const lookingAwayTimerRef = useRef(null);
  const isLookingAwayRef = useRef(false);

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setProctorLogs((prev) => [...prev, { time: timestamp, message, type }]);
  }, []);

  // 1. Setup Camera & Web Audio API
  useEffect(() => {
    if (!isEnabled || isTerminated) return;

    let isMounted = true;

    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: 30 },
          audio: true
        });

        if (!isMounted) return;

        mediaStreamRef.current = stream;
        setCameraActive(true);
        setMicActive(true);
        addLog("Webcam & Audio stream connected.", "success");

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn("Video play notice:", e));
        }

        // Web Audio API analyzer
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkAudio = () => {
            if (!isMounted || isTerminated) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const normalizedLevel = Math.min(100, Math.round((average / 128) * 100));
            setAudioLevel(normalizedLevel);

            // Deduct attention score slightly if excessive noise / speech detected
            if (normalizedLevel > 60) {
              setAttentionScore((prev) => Math.max(25, Number((prev - 0.08).toFixed(1))));
            }

            requestAnimationFrame(checkAudio);
          };
          checkAudio();
        } catch (audioErr) {
          console.warn("Audio Context init notice:", audioErr);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraActive(false);
        addLog("Camera access error: " + err.message, "danger");
      }
    }

    setupMedia();

    return () => {
      isMounted = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isEnabled, isTerminated, addLog]);

  // 2. Real-Time AI Vision Face Tracking & Cyberpunk HUD Canvas Overlay
  useEffect(() => {
    if (!isEnabled || isTerminated || !cameraActive) return;

    let animFrameId;
    const sampleCanvas = document.createElement("canvas");
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    sampleCanvas.width = 160;
    sampleCanvas.height = 120;

    let frameCounter = 0;

    const runVisionTracking = () => {
      if (isTerminated) return;
      frameCounter++;

      const video = videoRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      if (video && video.readyState >= 2 && overlayCanvas) {
        const overlayCtx = overlayCanvas.getContext("2d");
        const width = video.videoWidth || 320;
        const height = video.videoHeight || 240;

        if (overlayCanvas.width !== width || overlayCanvas.height !== height) {
          overlayCanvas.width = width;
          overlayCanvas.height = height;
        }

        // Draw video frame to sample canvas for luminance/centroid processing
        sampleCtx.drawImage(video, 0, 0, 160, 120);
        const imgData = sampleCtx.getImageData(0, 0, 160, 120);
        const pixels = imgData.data;

        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;
        let leftLuma = 0;
        let rightLuma = 0;

        for (let i = 0; i < pixels.length; i += 16) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;

          // Skin tone weight bias
          if (r > 60 && g > 40 && b > 20 && r > b) {
            const pixelIdx = i / 4;
            const x = pixelIdx % 160;
            const y = Math.floor(pixelIdx / 160);

            weightedX += x * luma;
            weightedY += y * luma;
            totalWeight += luma;

            if (x < 80) leftLuma += luma;
            else rightLuma += luma;
          }
        }

        let faceCenterX = 0.5;
        let faceCenterY = 0.5;

        if (totalWeight > 0) {
          faceCenterX = weightedX / totalWeight / 160;
          faceCenterY = weightedY / totalWeight / 120;
        }

        const asymmetry = Math.abs(leftLuma - rightLuma) / (leftLuma + rightLuma || 1);
        const xOffset = Math.abs(faceCenterX - 0.5);
        const isLookingAway = xOffset > 0.18 || asymmetry > 0.4;

        let poseLabel = 'CENTERED';
        if (isLookingAway) {
          poseLabel = faceCenterX < 0.45 ? 'LOOKING LEFT' : faceCenterX > 0.55 ? 'LOOKING RIGHT' : 'GAZE DEVIATION';
        }

        setFacePosition({
          x: faceCenterX,
          y: faceCenterY,
          width: 0.4,
          height: 0.5,
          isCentered: !isLookingAway,
          poseLabel
        });

        // Update Dynamic Attention Score
        if (isLookingAway) {
          setAttentionScore((prev) => Math.max(15, Number((prev - 0.35).toFixed(1))));

          if (!isLookingAwayRef.current) {
            isLookingAwayRef.current = true;
            lookingAwayTimerRef.current = setTimeout(() => {
              setLookingAwayCount((prev) => {
                const newGazeCount = prev + 1;
                addLog(`Gaze Violation Strike ${newGazeCount}/3: Head turned (${poseLabel}).`, "warning");

                if (newGazeCount >= 3) {
                  setIsTerminated(true);
                  const msg = "Integrity Violation: Repeatedly looking away from camera screen.";
                  setTerminationReason(msg);
                  if (onTerminate) onTerminate({ reason: msg, lookingAwayCount: newGazeCount });
                } else {
                  setActiveWarning({
                    title: `GAZE ALERT: Strike ${newGazeCount}/3`,
                    message: `Head pose anomaly detected (${poseLabel}). Please maintain direct eye contact with the screen.`,
                    type: 'gaze'
                  });
                }
                return newGazeCount;
              });
            }, 3000);
          }
        } else {
          setAttentionScore((prev) => Math.min(100, Number((prev + 0.15).toFixed(1))));
          if (isLookingAwayRef.current) {
            isLookingAwayRef.current = false;
            if (lookingAwayTimerRef.current) clearTimeout(lookingAwayTimerRef.current);
          }
        }

        // Render Futuristic AI Cyberpunk HUD Mesh Overlay on Canvas
        overlayCtx.clearRect(0, 0, width, height);

        const boxX = (faceCenterX - 0.2) * width;
        const boxY = (faceCenterY - 0.25) * height;
        const boxW = 0.4 * width;
        const boxH = 0.5 * height;

        const mainColor = isLookingAway ? '#f43f5e' : '#00f3ff';
        const shadowColor = isLookingAway ? 'rgba(244, 63, 94, 0.6)' : 'rgba(0, 243, 255, 0.6)';

        // Draw Floating Target Box Reticle Corners
        overlayCtx.lineWidth = 2.5;
        overlayCtx.strokeStyle = mainColor;
        overlayCtx.shadowBlur = 12;
        overlayCtx.shadowColor = shadowColor;

        const cornerLen = 20;
        // Top-Left
        overlayCtx.beginPath();
        overlayCtx.moveTo(boxX, boxY + cornerLen);
        overlayCtx.lineTo(boxX, boxY);
        overlayCtx.lineTo(boxX + cornerLen, boxY);
        overlayCtx.stroke();

        // Top-Right
        overlayCtx.beginPath();
        overlayCtx.moveTo(boxX + boxW - cornerLen, boxY);
        overlayCtx.lineTo(boxX + boxW, boxY);
        overlayCtx.lineTo(boxX + boxW, boxY + cornerLen);
        overlayCtx.stroke();

        // Bottom-Left
        overlayCtx.beginPath();
        overlayCtx.moveTo(boxX, boxY + boxH - cornerLen);
        overlayCtx.lineTo(boxX, boxY + boxH);
        overlayCtx.lineTo(boxX + cornerLen, boxY + boxH);
        overlayCtx.stroke();

        // Bottom-Right
        overlayCtx.beginPath();
        overlayCtx.moveTo(boxX + boxW - cornerLen, boxY + boxH);
        overlayCtx.lineTo(boxX + boxW, boxY + boxH);
        overlayCtx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
        overlayCtx.stroke();

        // Draw Center Crosshair Pupil Target
        const targetX = faceCenterX * width;
        const targetY = faceCenterY * height;

        overlayCtx.beginPath();
        overlayCtx.arc(targetX, targetY, 4, 0, Math.PI * 2);
        overlayCtx.fillStyle = mainColor;
        overlayCtx.fill();

        // Crosshair Lines
        overlayCtx.lineWidth = 1;
        overlayCtx.beginPath();
        overlayCtx.moveTo(targetX - 12, targetY);
        overlayCtx.lineTo(targetX + 12, targetY);
        overlayCtx.moveTo(targetX, targetY - 12);
        overlayCtx.lineTo(targetX, targetY + 12);
        overlayCtx.stroke();

        // Draw Facial Landmark Dots Matrix
        const dots = [
          { x: targetX - 22, y: targetY - 15 }, // Left Eye
          { x: targetX + 22, y: targetY - 15 }, // Right Eye
          { x: targetX, y: targetY + 5 },       // Nose Tip
          { x: targetX - 15, y: targetY + 28 }, // Mouth Left
          { x: targetX + 15, y: targetY + 28 }, // Mouth Right
        ];

        overlayCtx.fillStyle = mainColor;
        dots.forEach(dot => {
          overlayCtx.beginPath();
          overlayCtx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
          overlayCtx.fill();
        });
      }

      animFrameId = requestAnimationFrame(runVisionTracking);
    };

    runVisionTracking();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (lookingAwayTimerRef.current) clearTimeout(lookingAwayTimerRef.current);
    };
  }, [isEnabled, isTerminated, cameraActive, onTerminate, addLog]);

  // 3. Tab Switch & Blur Listener
  useEffect(() => {
    if (!isEnabled || isTerminated) return;

    const handleViolation = (reasonText) => {
      setTabSwitchCount((prevCount) => {
        const newCount = prevCount + 1;
        addLog(`Security Violation Strike ${newCount}/3: ${reasonText}`, "danger");

        setAttentionScore((score) => Math.max(10, score - 25));

        if (newCount >= 3) {
          setIsTerminated(true);
          const termMsg = "Multiple Integrity Violations: Exceeded 3 tab switches/window blurs.";
          setTerminationReason(termMsg);
          addLog("INTERVIEW TERMINATED: Exceeded 3 Strike Limit", "critical");

          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          }

          if (onTerminate) onTerminate({ reason: termMsg, tabSwitchCount: newCount });
        } else {
          setActiveWarning({
            title: `SECURITY WARNING: Strike ${newCount}/3`,
            message: `Tab switching or navigating away is strictly forbidden during this interview! (Strike ${newCount} of 3)`,
            type: 'strike'
          });
        }
        return newCount;
      });
    };

    const handleVisibility = () => {
      if (document.hidden) handleViolation("Tab switch or browser minimization detected.");
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (!document.hasFocus()) handleViolation("Window blur/focus loss detected.");
      }, 500);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isEnabled, isTerminated, onTerminate, addLog]);

  const dismissWarning = () => setActiveWarning(null);

  return {
    videoRef,
    overlayCanvasRef,
    cameraActive,
    micActive,
    tabSwitchCount,
    lookingAwayCount,
    attentionScore,
    isTerminated,
    terminationReason,
    activeWarning,
    audioLevel,
    proctorLogs,
    facePosition,
    dismissWarning,
  };
}
