import { useState, useEffect, useRef, useCallback } from 'react';

export function useProctoring({ onTerminate, isEnabled = true }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [lookingAwayCount, setLookingAwayCount] = useState(0);
  const [attentionScore, setAttentionScore] = useState(100);
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [activeWarning, setActiveWarning] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [proctorLogs, setProctorLogs] = useState([]);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const lookingAwayTimerRef = useRef(null);
  const isLookingAwayRef = useRef(false);

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setProctorLogs((prev) => [...prev, { time: timestamp, message, type }]);
  }, []);

  // 1. Initialize Camera and Microphone Stream
  useEffect(() => {
    if (!isEnabled || isTerminated) return;

    let isMounted = true;

    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: 15 },
          audio: true
        });

        if (!isMounted) return;

        mediaStreamRef.current = stream;
        setCameraActive(true);
        setMicActive(true);
        addLog("Webcam & Audio stream initialized successfully.", "success");

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn("Video play notice:", e));
        }

        // Web Audio API setup for voice activity check
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
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
              setAttentionScore((prev) => Math.max(50, prev - 0.2));
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
        addLog("Failed to access camera/mic: " + err.message, "danger");
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

  // 2. Strict Tab Switch & Window Blur Detection (3 Strikes)
  useEffect(() => {
    if (!isEnabled || isTerminated) return;

    const handleSecurityViolation = (reasonText) => {
      setTabSwitchCount((prevCount) => {
        const newCount = prevCount + 1;
        addLog(`Security Violation Strike ${newCount}/3: ${reasonText}`, "danger");

        setAttentionScore((score) => Math.max(20, score - 20));

        if (newCount >= 3) {
          // Terminate on 3rd Strike
          setIsTerminated(true);
          const termMsg = "Multiple Integrity Violations Detected: Exceeded 3 tab switches/window blurs.";
          setTerminationReason(termMsg);
          addLog("INTERVIEW TERMINATED: Exceeded 3 Strike Limit", "critical");

          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          }

          if (onTerminate) {
            onTerminate({ reason: termMsg, tabSwitchCount: newCount });
          }
        } else {
          setActiveWarning({
            title: `WARNING: Strike ${newCount}/3`,
            message: `Tab switching or navigating away is strictly forbidden during this interview! (Strike ${newCount} of 3)`,
            type: 'strike'
          });
        }
        return newCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleSecurityViolation("User switched tab or minimized browser window.");
      }
    };

    const handleWindowBlur = () => {
      // Small delay to prevent false positives from clicking popups
      setTimeout(() => {
        if (!document.hasFocus()) {
          handleSecurityViolation("Window focus lost (Blur event detected).");
        }
      }, 500);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isEnabled, isTerminated, onTerminate, addLog]);

  // 3. Gaze & Head Orientation Check (Simulated Vision Landmarker Loop)
  useEffect(() => {
    if (!isEnabled || isTerminated || !cameraActive) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = 160;
    canvas.height = 120;

    let visionInterval = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      ctx.drawImage(videoRef.current, 0, 0, 160, 120);
      const frameData = ctx.getImageData(0, 0, 160, 120);

      // Lightweight luminance & skin centroid detection to check head orientation
      let totalLuma = 0;
      let leftSideLuma = 0;
      let rightSideLuma = 0;

      const data = frameData.data;
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuma += luma;

        const pixelIdx = i / 4;
        const x = pixelIdx % 160;
        if (x < 80) leftSideLuma += luma;
        else rightSideLuma += luma;
      }

      // Check asymmetry ratio (head turned far left or right)
      const ratio = Math.abs(leftSideLuma - rightSideLuma) / (totalLuma || 1);
      const isLookingAway = ratio > 0.38;

      if (isLookingAway) {
        if (!isLookingAwayRef.current) {
          isLookingAwayRef.current = true;
          lookingAwayTimerRef.current = setTimeout(() => {
            setLookingAwayCount((prev) => {
              const newGazeCount = prev + 1;
              addLog(`Gaze Violation Strike ${newGazeCount}/3: User turned head away from center screen.`, "warning");

              if (newGazeCount >= 3) {
                setIsTerminated(true);
                const msg = "Integrity Violation: Repeatedly looking away from the camera screen.";
                setTerminationReason(msg);
                if (onTerminate) onTerminate({ reason: msg, lookingAwayCount: newGazeCount });
              } else {
                setActiveWarning({
                  title: `GAZE ALERT: Strike ${newGazeCount}/3`,
                  message: "Please maintain direct eye contact with the screen during the evaluation.",
                  type: 'gaze'
                });
              }
              return newGazeCount;
            });
          }, 3000); // 3 seconds continuous threshold
        }
      } else {
        if (isLookingAwayRef.current) {
          isLookingAwayRef.current = false;
          if (lookingAwayTimerRef.current) {
            clearTimeout(lookingAwayTimerRef.current);
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(visionInterval);
      if (lookingAwayTimerRef.current) clearTimeout(lookingAwayTimerRef.current);
    };
  }, [isEnabled, isTerminated, cameraActive, onTerminate, addLog]);

  const dismissWarning = () => {
    setActiveWarning(null);
  };

  return {
    videoRef,
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
    dismissWarning,
  };
}
