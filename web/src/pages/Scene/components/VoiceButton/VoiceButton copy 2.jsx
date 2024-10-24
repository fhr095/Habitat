import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone } from "react-icons/fa";
import ScaleLoader from "react-spinners/ScaleLoader";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import * as Tone from "tone";

import "./VoiceButton.scss";

export default function VoiceButton({
  isListening,
  onStartListening,
  onStopListening,
  isDisabled,
  transcript,
  maxDuration = 30, // Duração em segundos
}) {
  const [progress, setProgress] = useState(0);
  const [showHint, setShowHint] = useState(false); // Controla a dica "Segure para falar"
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const hintTimeoutRef = useRef(null); // Timeout para exibir a dica
  const maxDurationMs = maxDuration * 1000; // Converte para milissegundos

  const handleStart = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    playSound();
    onStartListening();

    startTimeRef.current = Date.now();
    setProgress(0);

    // Atualiza a barra de progresso
    intervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTimeRef.current;
      const newProgress = (elapsedTime / maxDurationMs) * 100;
      setProgress(newProgress);

      if (elapsedTime >= maxDurationMs) {
        handleEnd(); // Para de escutar automaticamente após a duração máxima
      }
    }, 100); // Atualiza a cada 100 ms para um progresso mais suave
  };

  const handleEnd = () => {
    if (!transcript) {
      // Mostra "Segure para falar" se nenhuma transcrição for detectada
      setShowHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setShowHint(false);
      }, 5000); // Aumenta o tempo visível para 5 segundos
    }

    // Espera 30 ms antes de parar de escutar
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onStopListening();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setProgress(0);
    }, 30); // 30 ms de atraso após soltar o botão
  };

  useEffect(() => {
    if (!isListening) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setProgress(0);
    }
  }, [isListening]);

  const playSound = () => {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C4", "8n");
  };

  return (
    <div className="voice-button-container">
      <span className="bar-container">
        {isListening && (
          <CircularProgressbar
            className="bar"
            value={progress}
            maxValue={100}
            strokeWidth={2} // Barra de progresso mais fina
            styles={buildStyles({
              pathColor: "#eaf1f0", // Cor suave como antes
              trailColor: "transparent",
            })}
          />
        )}
        <button
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onTouchStart={handleStart}
          onTouchEnd={handleEnd}
          disabled={isDisabled || transcript !== ""}
          className={`voice-button ${isListening ? "listening" : ""}`}
          style={{ display: transcript !== "" ? "none" : "block" }}
        >
          <div className="button-content">
            <FaMicrophone className="microphone-icon" size={50} />
            {isListening && (
              <p className="status-text listening-text">Escutando...</p>
            )}
            {!isListening && showHint && (
              <p className="status-text hint-text">Segure para falar</p>
            )}
          </div>
        </button>
      </span>
    </div>
  );
}
