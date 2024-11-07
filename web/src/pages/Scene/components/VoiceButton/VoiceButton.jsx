import React, { useState, useEffect, useRef } from "react";
import { FaMicrophone } from "react-icons/fa";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import "./VoiceButton.scss";

export default function VoiceButton({
  onStartListening,
  onStopListening,
  isDisabled,
  transcript,
  maxDuration = 30, // Duração em segundos
}) {
  const [isListening, setIsListening] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressTimerRef = useRef(null);

  const startListening = () => {
    if (isListening) return; // Evita múltiplas chamadas

    setIsListening(true);
    onStartListening();

    // Iniciar temporizador de duração máxima
    timerRef.current = setTimeout(() => {
      stopListening();
    }, maxDuration * 1000);

    // Iniciar progresso visual do tempo
    setProgress(0);
    const interval = (maxDuration * 1000) / 100; // Intervalo para atualizar a cada 1% de progresso
    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 100));
    }, interval);
  };

  const stopListening = () => {
    if (!isListening) return; // Evita chamadas se não estiver escutando

    clearTimeout(timerRef.current);
    clearInterval(progressTimerRef.current);
    timerRef.current = null;
    progressTimerRef.current = null;

    setIsListening(false);
    onStopListening();
    setProgress(0);
  };

  useEffect(() => {
    // Limpa os temporizadores ao desmontar o componente
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, []);

  // Detectar se o dispositivo é de toque
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  return (
    <div className="voice-button-container">
      <span className="bar-container">
        {isListening && (
          <CircularProgressbar
            className="bar"
            value={progress}
            maxValue={100}
            strokeWidth={2}
            styles={buildStyles({
              pathColor: "#eaf1f0",
              trailColor: "transparent",
            })}
          />
        )}
        <button
          onPointerDown={startListening}
          onPointerUp={stopListening}
          onPointerLeave={isListening ? stopListening : null}
          disabled={isDisabled || transcript !== ""}
          className={`voice-button ${isListening ? "listening" : ""}`}
          style={{ display: transcript !== "" ? "none" : "block" }}
        >
          <FaMicrophone color="#eaf1f0" size={25} />
        </button>
      </span>
      <div className="text-container">
        <p className={`status-text ${isListening ? "listening-text" : ""}`}>
          {isListening ? "Escutando..." : ""}
        </p>
      </div>
    </div>
  );
}
