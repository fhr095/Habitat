import React, { useEffect, useState, useRef } from "react";
import { FaMicrophone } from "react-icons/fa";
import ScaleLoader from "react-spinners/ScaleLoader";

export default function VoiceButton({ setTranscript }) {
  const [listening, setListening] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [audioCaptured, setAudioCaptured] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recognitionRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const [forceStop, setForceStop] = useState(false);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "pt-BR";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setListening(true);
        setAudioCaptured(false);  // Reset audio captured status
        setShowTooltip(false);  // Esconder o tooltip quando a gravação começa
        startRecordingTimer();
      };

      recognitionRef.current.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        console.log("Transcript:", result); // Adicionado para depuração
        setAudioCaptured(true);  // Audio foi captado
        setListening(false);
        stopRecordingTimer();
      };

      recognitionRef.current.onerror = (event) => {
        setListening(false);
        stopRecordingTimer();
      };

      recognitionRef.current.onend = () => {
        if (!audioCaptured) {
          setShowTooltip(true);  // Mostrar tooltip se nenhum áudio foi captado
          setTimeout(() => {
            setShowTooltip(false);
          }, 2000);
        }
        setListening(false);
        stopRecordingTimer();
      };
    }
  }, [setTranscript, audioCaptured]);

  useEffect(() => {
    if (forceStop && listening) {
      handleStopListening();
    }
  }, [forceStop, listening]);

  const startRecordingTimer = () => {
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prevTime) => {
        const newTime = prevTime + 1;
        if (newTime >= 15) {
          handleStopListening();
        }
        return newTime;
      });
    }, 1000);
  };

  const stopRecordingTimer = () => {
    clearInterval(recordingIntervalRef.current);
    setRecordingTime(0);
  };

  const handleStartListening = () => {
    if (recognitionRef.current && !listening) {
      recognitionRef.current.start();
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);  // Força a atualização imediata do estado
      stopRecordingTimer();
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    setShowTooltip(false);
    setForceStop(false);
    handleStartListening();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setForceStop(true);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setShowTooltip(false);
    setForceStop(false);
    handleStartListening();
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    setForceStop(true);
  };

  const handleMouseLeave = (e) => {
    e.preventDefault();
    handleStopListening();
  };

  return (
    <div className="voice-button-container">
      <div className={`progress-ring ${listening ? "listening" : ""}`}>
        <svg className="progress-ring__svg" width="100" height="100">
          <circle
            className="progress-ring__circle"
            stroke="url(#gradient)"
            strokeWidth="6"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
            style={{
              strokeDasharray: 283,
              strokeDashoffset: listening ? 283 - (283 / 15) * recordingTime : 283,
              transition: `stroke-dashoffset 1s linear`,
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#FF5733", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#FFC300", stopOpacity: 1 }} />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.preventDefault()}
        className={`voice-button ${listening ? "listening" : ""}`}
      >
        {listening ? (
          <ScaleLoader color="white" height={15} width={3} radius={2} margin={2} />
        ) : (
          <FaMicrophone color="white" size={20} />
        )}
      </button>
      {showTooltip && <div className="tooltip">Segure para falar e depois solte</div>}
    </div>
  );
}