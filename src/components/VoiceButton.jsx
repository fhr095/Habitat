import React, { useEffect, useState } from "react";
import { FaMicrophone } from "react-icons/fa";
import ScaleLoader from "react-spinners/ScaleLoader";

import "../styles/VoiceButton.scss";

export default function VoiceButton({ setTranscript, isDisabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "pt-BR";

      recognitionInstance.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim();
            setTranscript(transcript);
          }
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error("Erro de reconhecimento de voz:", event.error);
      };

      setRecognition(recognitionInstance);
    } else {
      console.error("Este navegador não suporta reconhecimento de voz.");
    }
  }, [setTranscript]);

  const handleMouseDown = () => {
    if (recognition) {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleMouseUp = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  return (
    <button
      className="voice-button"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        transform: isRecording ? "scale(1.2)" : "scale(1)",
        transition: "transform 0.2s",
      }}
      disabled={isDisabled} // Desabilitar botão quando isDisabled for true
    >
      {isRecording ? (
        <ScaleLoader color="white" height={15} width={3} radius={2} margin={2} />
      ) : (
        <FaMicrophone color="white" size={20} />
      )}
    </button>
  );
}
