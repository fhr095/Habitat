import React, { useEffect, useState, useRef } from "react";
import { FaMicrophone } from "react-icons/fa";
import ScaleLoader from "react-spinners/ScaleLoader";

import "../styles/VoiceButton.scss";

export default function VoiceButton({ setTranscript, isDisabled }) {
  const [listening, setListening] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "pt-BR";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        setListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setListening(false);
      };

      recognitionRef.current.onend = () => {
        setListening(false);
      };
    } else {
      console.warn("Web Speech API not supported in this browser.");
    }
  }, [setTranscript]);

  const handleStartListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    setShowTooltip(false);
    handleStartListening();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleStopListening();
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setShowTooltip(false);
    handleStartListening();
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    handleStopListening();
  };

  const handleMouseLeave = (e) => {
    e.preventDefault();
    handleStopListening();
  };

  const handleMouseClick = (e) => {
    e.preventDefault();
    setShowTooltip(true);
    setTimeout(() => {
      setShowTooltip(false);
    }, 2000);
  };

  return (
    <div className="voice-button-container">
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleMouseClick}
        disabled={isDisabled}
        className="voice-button"
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