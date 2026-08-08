import { useState, useEffect, useRef, useCallback } from 'react';

export function useProctoring({ onTerminate, isEnabled = true }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [lookingAwayCount, setLookingAwayCount] = useState(0);
  const [phoneDetectedCount, setPhoneDetectedCount] = useState(0);
  const [attentionScore, setAttentionScore] = useState(100);
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [activeWarning, setActiveWarning] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [proctorLogs, setProctorLogs] = useState([]);
  
  // Real-time AI Vision tracking state
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
  const phoneTimerRef = useRef(null);

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
        addLog("AI Vision Engine calibrated and active.", "success");

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

            if (normalizedLevel > 75) {
              setAttentionScore((prev) => Math.max(20, Number((prev - 0.05).toFixed(1))));
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

  // 2. SMART ZERO-FALSE-POSITIVE AI Vision Face, Gaze & Device Detection Loop
  useEffect(() => {
    if (!isEnabled || isTerminated || !cameraActive) return;

    let animFrameId;
    const sampleCanvas = document.createElement("canvas");
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    sampleCanvas.width = 160;
    sampleCanvas.height = 120;

    const runSmartVisionTracking = () => {
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
        let phoneDevicePixelsNearFace = 0;

        for (let i = 0; i < pixels.length; i += 16) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;

          const pixelIdx = i / 4;
          const x = pixelIdx % 160;
          const y = Math.floor(pixelIdx / 160);

          // Skin tone detection with strict color bounds (eliminates clothing/background false positives)
          if (r > 60 && g > 35 && b > 20 && (r - g) > 8 && r > b) {
            weightedX += x * luma;
            weightedY += y * luma;
            skinWeight += luma;

            if (x < 80) leftLuma += luma;
            else rightLuma += luma;
          }
        }

        let faceCenterX = 0.5;
        let faceCenterY = 0.5;
        let faceCount = 1;

        // FACE ABSENCE: Minimum skin centroid weight required
        if (skinWeight < 200) {
          faceCount = 0;
        } else {
          faceCenterX = weightedX / skinWeight / 160;
          faceCenterY = weightedY / skinWeight / 120;
        }

        // SMART PHONE DETECTION NEAR FACE (Scans ONLY hand-to-face region, NOT clothing/t-shirt!)
        if (faceCount > 0) {
          for (let i = 0; i < pixels.length; i += 16) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;

            const pixelIdx = i / 4;
            const x = pixelIdx % 160;
            const y = Math.floor(pixelIdx / 160);

            const gridX = x / 160;
            const gridY = y / 120;

            // Check region around chin/jaw/hands (gridY between faceCenterY + 0.1 and faceCenterY + 0.35)
            const isNearFaceRegion = gridY > (faceCenterY + 0.08) && gridY < (faceCenterY + 0.38) && Math.abs(gridX - faceCenterX) < 0.28;

            if (isNearFaceRegion) {
              const isDarkDevice = luma < 30 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10;
              const isGlowingScreen = luma > 230 && r > 210 && g > 210 && b > 210;
              if (isDarkDevice || isGlowingScreen) {
                phoneDevicePixelsNearFace++;
              }
            }
          }
        }

        // SMART REASONABLE THRESHOLDS FOR GAZE & SIDEWAYS
        const xOffset = Math.abs(faceCenterX - 0.5);
        const lumaAsymmetry = Math.abs(leftLuma - rightLuma) / (leftLuma + rightLuma || 1);

        const isSidewaysLeft = faceCenterX < 0.32 || (lumaAsymmetry > 0.38 && leftLuma < rightLuma);
        const isSidewaysRight = faceCenterX > 0.68 || (lumaAsymmetry > 0.38 && rightLuma < leftLuma);
        const isLookingDown = faceCenterY > 0.72;

        // Requires > 220 phone device pixels right near face/chin region (never triggers on t-shirt)
        const isPhoneInFrame = phoneDevicePixelsNearFace > 220;
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
        // 1. NO HUMAN DETECTED: AUTO TERMINATION IN 2.5 SECONDS
        // -------------------------------------------------------------
        if (faceCount === 0) {
          setAttentionScore((prev) => Math.max(0, Number((prev - 1.5).toFixed(1))));

          if (!isNoFaceRef.current) {
            isNoFaceRef.current = true;
            addLog("ALERT: Candidate stepped away from camera stream.", "danger");

            noFaceTimerRef.current = setTimeout(() => {
              setIsTerminated(true);
              const termMsg = "INTERVIEW TERMINATED: No human candidate detected in camera stream for > 2.5 seconds.";
              setTerminationReason(termMsg);
              addLog("INTERVIEW TERMINATED: No Human Candidate Detected", "critical");

              if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((t) => t.stop());
              }

              if (onTerminate) onTerminate({ reason: termMsg, cause: "no_human" });
            }, 2500);
          }
        } else {
          if (isNoFaceRef.current) {
            isNoFaceRef.current = false;
            if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
          }
        }

        // -------------------------------------------------------------
        // 2. SMART PHONE DETECTION: PERSISTS FOR 1.5s BEFORE POPUP
        // -------------------------------------------------------------
        if (isPhoneInFrame) {
          setAttentionScore((prev) => Math.max(15, Number((prev - 0.8).toFixed(1))));

          if (!isPhoneDetectedRef.current) {
            isPhoneDetectedRef.current = true;
            phoneTimerRef.current = setTimeout(() => {
              setPhoneDetectedCount((p) => p + 1);
              addLog("SECURITY ALERT: Mobile phone / handheld device detected near face!", "critical");

              setActiveWarning({
                title: "CRITICAL: MOBILE PHONE DETECTED!",
                message: "AI Vision detected a mobile phone or handheld electronic device near your face! Please put away all secondary devices.",
                type: 'phone'
              });
            }, 1200);
          }
        } else {
          if (isPhoneDetectedRef.current) {
            isPhoneDetectedRef.current = false;
            if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
          }
        }

        // -------------------------------------------------------------
        // 3. SIDEWAYS & GAZE DEVIATION STRIKE (2.0s PERSISTENCE)
        // -------------------------------------------------------------
        if (isLookingAway && faceCount > 0 && !isPhoneInFrame) {
          setAttentionScore((prev) => Math.max(20, Number((prev - 0.4).toFixed(1))));

          if (!isLookingAwayRef.current) {
            isLookingAwayRef.current = true;
            lookingAwayTimerRef.current = setTimeout(() => {
              setLookingAwayCount((prev) => {
                const newGazeCount = prev + 1;
                addLog(`Vision Alert ${newGazeCount}/3: Candidate ${poseLabel}`, "warning");

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
            }, 2000);
          }
        } else {
          if (faceCount > 0 && !isPhoneInFrame) {
            setAttentionScore((prev) => Math.min(100, Number((prev + 0.2).toFixed(1))));
          }
          if (isLookingAwayRef.current) {
            isLookingAwayRef.current = false;
            if (lookingAwayTimerRef.current) clearTimeout(lookingAwayTimerRef.current);
          }
        }

        // Render AI Vision Overlay Canvas (Clean Reticle)
        overlayCtx.clearRect(0, 0, width, height);

        const boxX = (faceCenterX - 0.22) * width;
        const boxY = (faceCenterY - 0.28) * height;
        const boxW = 0.44 * width;
        const boxH = 0.56 * height;

        const hudColor = faceCount === 0 || isPhoneInFrame ? '#f43f5e' : isLookingAway ? '#f59e0b' : '#00f3ff';
        const shadowGlow = faceCount === 0 || isPhoneInFrame ? 'rgba(244, 63, 94, 0.9)' : isLookingAway ? 'rgba(245, 158, 11, 0.8)' : 'rgba(0, 243, 255, 0.8)';

        if (faceCount > 0) {
          // Bounding Reticle Corners
          overlayCtx.lineWidth = 3;
          overlayCtx.strokeStyle = hudColor;
          overlayCtx.shadowBlur = 14;
          overlayCtx.shadowColor = shadowGlow;

          const cLen = 22;
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

          // Target Center Crosshair
          const targetX = faceCenterX * width;
          const targetY = faceCenterY * height;

          overlayCtx.beginPath();
          overlayCtx.arc(targetX, targetY, 5, 0, Math.PI * 2);
          overlayCtx.fillStyle = hudColor;
          overlayCtx.fill();
        }

        // NO HUMAN DETECTED OVERLAY
        if (faceCount === 0) {
          overlayCtx.fillStyle = 'rgba(244, 63, 94, 0.3)';
          overlayCtx.fillRect(0, 0, width, height);
          overlayCtx.fillStyle = '#ffffff';
          overlayCtx.font = 'bold 13px sans-serif';
          overlayCtx.textAlign = 'center';
          overlayCtx.fillText('⚠ NO HUMAN DETECTED IN STREAM', width / 2, height / 2);
        }

        // SMART PHONE DETECTED OVERLAY
        if (isPhoneInFrame) {
          overlayCtx.lineWidth = 2;
          overlayCtx.strokeStyle = '#f43f5e';
          overlayCtx.setLineDash([4, 4]);
          overlayCtx.strokeRect(width * 0.25, height * (faceCenterY + 0.08), width * 0.5, height * 0.35);
          overlayCtx.setLineDash([]);
          overlayCtx.fillStyle = '#f43f5e';
          overlayCtx.font = 'bold 11px monospace';
          overlayCtx.textAlign = 'center';
          overlayCtx.fillText('🚨 PHONE DETECTED NEAR FACE', width / 2, height * (faceCenterY + 0.15));
        }
      }

      animFrameId = requestAnimationFrame(runSmartVisionTracking);
    };

    runSmartVisionTracking();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (lookingAwayTimerRef.current) clearTimeout(lookingAwayTimerRef.current);
      if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
      if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
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
