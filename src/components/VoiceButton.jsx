import React, { useEffect, useState } from "react";

import { FaMicrophone } from "react-icons/fa";

export default function VoiceButton({ setTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const sepeechRecognition = new window.webkitSpeechRecognition();
      sepeechRecognition.continuous = true;
      sepeechRecognition.interimResults = true;
      sepeechRecognition.lang = "pt-BR";

      sepeechRecognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim();
            setTranscript(transcript);
          }
        }
      };

      sepeechRecognition.onerror = (event) => {
        console.error("Erro de reconhecimento de voz:", event.error);
      };

      setRecording(sepeechRecognition);
    } else {
      console.error("Este navegador não suporta reconhecimento de voz.");
    }
  }, []);

  const handleMouseDown = () => {
    if (recording) {
      recording.start();
      setIsRecording(true);
    }
  };

  const handleMouseUp = () => {
    if (recording) {
      recording.stop();
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
        transform: isRecording ? "scale(0.9)" : "scale(1)",
        transition: "transform 0.2s",
      }}
    >
      <FaMicrophone color="white" size={20}/>
    </button>
  );
}
