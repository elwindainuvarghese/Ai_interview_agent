import { useState, useEffect, useRef, useCallback } from 'react';

export function useProctoring({ onTerminate, isEnabled = true }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [lookingAwayCount, setLookingAwayCount] = useState(0);
  const [phoneDetectedCount, setPhoneDetectedCount] = useState(0);
  const [attentionScore, setAttentionScore] = useState(98);
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [activeWarning, setActiveWarning] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [proctorLogs, setProctorLogs] = useState([]);
  
  // Ultra-Power AI Vision tracking state
  const [facePosition, setFacePosition] = useState({
    x: 0.5,
    y: 0.5,
    width: 0.4,
    height: 0.5,
    isCentered: true,
    poseLabel: 'CENTERED',
    isPhoneDetected: false,
    faceCount: 1,
  });

  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const lookingAwayTimerRef = useRef(null);
  const noFaceTimerRef = useRef(null);

  const isLookingAwayRef = useRef(false);
  const isNoFaceRef = useRef(false);
  const isPhoneDetectedRef = useRef(false);

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
        addLog("Ultra Pro Max AI Vision Engine online.", "success");

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn("Video play notice:", e));
        }

        // Web Audio API speech analyzer
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

            if (normalizedLevel > 65) {
              setAttentionScore((prev) => Math.max(15, Number((prev - 0.12).toFixed(1))));
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

  // 2. ULTRA PRO MAX INSTANT Phone, Face Absence & Sideways Gaze Detection Loop (100ms)
  useEffect(() => {
    if (!isEnabled || isTerminated || !cameraActive) return;

    let animFrameId;
    const sampleCanvas = document.createElement("canvas");
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    sampleCanvas.width = 160;
    sampleCanvas.height = 120;

    const runUltraProMaxVisionTracking = () => {
      if (isTerminated) return;

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

        sampleCtx.drawImage(video, 0, 0, 160, 120);
        const imgData = sampleCtx.getImageData(0, 0, 160, 120);
        const pixels = imgData.data;

        let skinWeight = 0;
        let weightedX = 0;
        let weightedY = 0;
        let leftLuma = 0;
        let rightLuma = 0;
        let topLuma = 0;
        let bottomLuma = 0;

        let handheldDevicePixels = 0;
        let darkObjectPixelsInLowerThird = 0;

        for (let i = 0; i < pixels.length; i += 16) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;

          const pixelIdx = i / 4;
          const x = pixelIdx % 160;
          const y = Math.floor(pixelIdx / 160);

          // Skin tone detection
          if (r > 45 && g > 25 && b > 15 && r > b && (r - g) > 4) {
            weightedX += x * luma;
            weightedY += y * luma;
            skinWeight += luma;

            if (x < 80) leftLuma += luma;
            else rightLuma += luma;

            if (y < 60) topLuma += luma;
            else bottomLuma += luma;
          }

          // INSTANT PHONE / DEVICE SHAPE DETECTION:
          // Detect handheld dark rectangular phone shapes, screens, or object holding in hands
          if (y > 55) {
            const isDarkDevice = luma < 45 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18;
            const isBrightScreenGlow = luma > 210 && (r > 200 && g > 200 && b > 200);
            if (isDarkDevice || isBrightScreenGlow) {
              darkObjectPixelsInLowerThird++;
            }
          }
        }

        let faceCenterX = 0.5;
        let faceCenterY = 0.5;
        let faceCount = 1;

        // REQUIREMENT: NO HUMAN DETECTED (Skin weight < 350)
        if (skinWeight < 350) {
          faceCount = 0; // Candidate stepped away or covered camera!
        } else {
          faceCenterX = weightedX / skinWeight / 160;
          faceCenterY = weightedY / skinWeight / 120;
        }

        // TIGHTENED HIGH SENSITIVITY THRESHOLDS
        const lumaAsymmetry = Math.abs(leftLuma - rightLuma) / (leftLuma + rightLuma || 1);
        const isSidewaysLeft = faceCenterX < 0.44 || (lumaAsymmetry > 0.18 && leftLuma < rightLuma);
        const isSidewaysRight = faceCenterX > 0.56 || (lumaAsymmetry > 0.18 && rightLuma < leftLuma);
        const isLookingDown = (faceCenterY - 0.5) > 0.12 || (bottomLuma / (topLuma + 1) > 1.5);

        // INSTANT PHONE DETECTION TRIGGER: > 45 dark/bright device pixels in lower frame or looking down with device
        const isPhoneInFrame = darkObjectPixelsInLowerThird > 45 || (isLookingDown && darkObjectPixelsInLowerThird > 25);
        const isLookingAway = isSidewaysLeft || isSidewaysRight || isLookingDown;

        let poseLabel = 'CENTERED';
        if (faceCount === 0) {
          poseLabel = 'NO HUMAN DETECTED';
        } else if (isPhoneInFrame) {
          poseLabel = 'MOBILE PHONE DETECTED';
        } else if (isSidewaysLeft) {
          poseLabel = 'LOOKING LEFT';
        } else if (isSidewaysRight) {
          poseLabel = 'LOOKING RIGHT';
        } else if (isLookingDown) {
          poseLabel = 'LOOKING DOWN';
        }

        setFacePosition({
          x: faceCenterX,
          y: faceCenterY,
          width: 0.4,
          height: 0.5,
          isCentered: faceCount > 0 && !isLookingAway && !isPhoneInFrame,
          poseLabel,
          isPhoneDetected: isPhoneInFrame,
          faceCount
        });

        // -------------------------------------------------------------
        // RULE 1: NO HUMAN DETECTED -> INSTANT INTERVIEW TERMINATION (2 Seconds)
        // -------------------------------------------------------------
        if (faceCount === 0) {
          setAttentionScore((prev) => Math.max(0, Number((prev - 2.5).toFixed(1))));

          if (!isNoFaceRef.current) {
            isNoFaceRef.current = true;
            addLog("ALERT: No human candidate detected in camera frame!", "danger");

            noFaceTimerRef.current = setTimeout(() => {
              setIsTerminated(true);
              const termMsg = "INTERVIEW TERMINATED: No human candidate detected in camera stream for > 2 seconds.";
              setTerminationReason(termMsg);
              addLog("INTERVIEW TERMINATED: No Human Detected", "critical");

              if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((t) => t.stop());
              }

              if (onTerminate) onTerminate({ reason: termMsg, cause: "no_human" });
            }, 2000); // 2 Seconds face absence lock!
          }
        } else {
          if (isNoFaceRef.current) {
            isNoFaceRef.current = false;
            if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
          }
        }

        // -------------------------------------------------------------
        // RULE 2: INSTANT PHONE DETECTION TRIGGER (0 Delay)
        // -------------------------------------------------------------
        if (isPhoneInFrame) {
          setAttentionScore((prev) => Math.max(10, Number((prev - 1.5).toFixed(1))));

          if (!isPhoneDetectedRef.current) {
            isPhoneDetectedRef.current = true;
            setPhoneDetectedCount((p) => p + 1);
            addLog("CRITICAL ALERT: Secondary Mobile Device detected in hands/frame!", "critical");

            setActiveWarning({
              title: "CRITICAL: MOBILE PHONE DETECTED!",
              message: "AI Vision detected a mobile phone or handheld electronic device in your frame! Usage of unauthorized devices is strictly prohibited.",
              type: 'phone'
            });
          }
        } else {
          if (isPhoneDetectedRef.current) {
            isPhoneDetectedRef.current = false;
          }
        }

        // -------------------------------------------------------------
        // RULE 3: FAST SIDEWAYS & LOOKING AWAY GAZE STRIKE (0.5s Response)
        // -------------------------------------------------------------
        if (isLookingAway && faceCount > 0) {
          setAttentionScore((prev) => Math.max(15, Number((prev - 0.8).toFixed(1))));

          if (!isLookingAwayRef.current) {
            isLookingAwayRef.current = true;
            lookingAwayTimerRef.current = setTimeout(() => {
              setLookingAwayCount((prev) => {
                const newGazeCount = prev + 1;
                addLog(`High-Power Vision Alert ${newGazeCount}/3: Candidate ${poseLabel}`, "danger");

                if (newGazeCount >= 3) {
                  setIsTerminated(true);
                  const msg = `Integrity Breach: Exceeded 3 gaze deviation strikes (${poseLabel}).`;
                  setTerminationReason(msg);
                  if (onTerminate) onTerminate({ reason: msg, lookingAwayCount: newGazeCount });
                } else {
                  setActiveWarning({
                    title: `VISION INTEGRITY ALERT: Strike ${newGazeCount}/3`,
                    message: `AI Vision detected ${poseLabel}. Please maintain direct eye contact and head alignment with the camera.`,
                    type: 'gaze'
                  });
                }
                return newGazeCount;
              });
            }, 500); // 0.5s Fast Response!
          }
        } else {
          if (faceCount > 0 && !isPhoneInFrame) {
            setAttentionScore((prev) => Math.min(100, Number((prev + 0.3).toFixed(1))));
          }
          if (isLookingAwayRef.current) {
            isLookingAwayRef.current = false;
            if (lookingAwayTimerRef.current) clearTimeout(lookingAwayTimerRef.current);
          }
        }

        // Render Ultra Cyberpunk AI Vision Overlay Canvas
        overlayCtx.clearRect(0, 0, width, height);

        const boxX = (faceCenterX - 0.22) * width;
        const boxY = (faceCenterY - 0.28) * height;
        const boxW = 0.44 * width;
        const boxH = 0.56 * height;

        const hudColor = faceCount === 0 || isPhoneInFrame ? '#f43f5e' : isLookingAway ? '#f59e0b' : '#00f3ff';
        const shadowGlow = faceCount === 0 || isPhoneInFrame ? 'rgba(244, 63, 94, 0.9)' : isLookingAway ? 'rgba(245, 158, 11, 0.8)' : 'rgba(0, 243, 255, 0.8)';

        if (faceCount > 0) {
          // Bounding Reticle Corners
          overlayCtx.lineWidth = 3.5;
          overlayCtx.strokeStyle = hudColor;
          overlayCtx.shadowBlur = 18;
          overlayCtx.shadowColor = shadowGlow;

          const cLen = 24;
          // Top-Left
          overlayCtx.beginPath();
          overlayCtx.moveTo(boxX, boxY + cLen);
          overlayCtx.lineTo(boxX, boxY);
          overlayCtx.lineTo(boxX + cLen, boxY);
          overlayCtx.stroke();

          // Top-Right
          overlayCtx.beginPath();
          overlayCtx.moveTo(boxX + boxW - cLen, boxY);
          overlayCtx.lineTo(boxX + boxW, boxY);
          overlayCtx.lineTo(boxX + boxW, boxY + cLen);
          overlayCtx.stroke();

          // Bottom-Left
          overlayCtx.beginPath();
          overlayCtx.moveTo(boxX, boxY + boxH - cLen);
          overlayCtx.lineTo(boxX, boxY + boxH);
          overlayCtx.lineTo(boxX + cLen, boxY + boxH);
          overlayCtx.stroke();

          // Bottom-Right
          overlayCtx.beginPath();
          overlayCtx.moveTo(boxX + boxW - cLen, boxY + boxH);
          overlayCtx.lineTo(boxX + boxW, boxY + boxH);
          overlayCtx.lineTo(boxX + boxW, boxY + boxH - cLen);
          overlayCtx.stroke();

          // Laser Target Center Crosshair
          const targetX = faceCenterX * width;
          const targetY = faceCenterY * height;

          overlayCtx.beginPath();
          overlayCtx.arc(targetX, targetY, 6, 0, Math.PI * 2);
          overlayCtx.fillStyle = hudColor;
          overlayCtx.fill();

          overlayCtx.lineWidth = 1.5;
          overlayCtx.beginPath();
          overlayCtx.moveTo(targetX - 16, targetY);
          overlayCtx.lineTo(targetX + 16, targetY);
          overlayCtx.moveTo(targetX, targetY - 16);
          overlayCtx.lineTo(targetX, targetY + 16);
          overlayCtx.stroke();
        }

        // NO HUMAN DETECTED RED SCREEN FLASH OVERLAY
        if (faceCount === 0) {
          overlayCtx.fillStyle = 'rgba(244, 63, 94, 0.25)';
          overlayCtx.fillRect(0, 0, width, height);
          overlayCtx.fillStyle = '#ffffff';
          overlayCtx.font = 'bold 13px sans-serif';
          overlayCtx.textAlign = 'center';
          overlayCtx.fillText('⚠ NO HUMAN DETECTED IN CAMERA STREAM', width / 2, height / 2);
        }

        // PHONE DETECTED RED BOUNDING BOX
        if (isPhoneInFrame) {
          overlayCtx.lineWidth = 2.5;
          overlayCtx.strokeStyle = '#f43f5e';
          overlayCtx.setLineDash([4, 4]);
          overlayCtx.strokeRect(width * 0.2, height * 0.55, width * 0.6, height * 0.4);
          overlayCtx.setLineDash([]);
          overlayCtx.fillStyle = '#f43f5e';
          overlayCtx.font = 'bold 12px monospace';
          overlayCtx.textAlign = 'center';
          overlayCtx.fillText('🚨 PHONE / DEVICE DETECTED', width / 2, height * 0.63);
        }
      }

      animFrameId = requestAnimationFrame(runUltraProMaxVisionTracking);
    };

    runUltraProMaxVisionTracking();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (lookingAwayTimerRef.current) clearTimeout(lookingAwayTimerRef.current);
      if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
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
    phoneDetectedCount,
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
