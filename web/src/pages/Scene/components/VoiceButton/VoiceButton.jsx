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
  const maxDurationMs = maxDuration * 1000; // Converter para milissegundos

  // Iniciar a gravação
  const handleStart = (event) => {
    // Chame preventDefault apenas para eventos de mouse
    if (event.type === "mousedown") {
      event.preventDefault();
    }

    // Limpar quaisquer intervalos ou timeouts existentes
    clearIntervalsAndTimeouts();

    setShowHint(false); // Ocultar a dica imediatamente ao pressionar

    playSound();
    onStartListening();

    startTimeRef.current = Date.now();
    setProgress(0);

    // Adicionar listener global apenas para mouseup
    window.addEventListener("mouseup", handleEnd);

    // Atualizar barra de progresso
    intervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTimeRef.current;
      const newProgress = (elapsedTime / maxDurationMs) * 100;
      setProgress(newProgress);

      if (elapsedTime >= maxDurationMs) {
        handleEnd(); // Parar automaticamente após a duração máxima
      }
    }, 100); // Atualizar a cada 100 ms para uma progressão suave
  };

  // Finalizar a gravação
  const handleEnd = (event) => {
    // Chame preventDefault apenas para eventos de mouse
    if (event && event.type === "mouseup") {
      event.preventDefault();
    }

    // Remover listener global
    window.removeEventListener("mouseup", handleEnd);

    if (!transcript) {
      // Mostrar "Segure para falar" se nenhum áudio foi capturado
      setShowHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setShowHint(false);
      }, 5000); // Exibir dica por 5 segundos
    }

    // Aguardar brevemente antes de parar a gravação
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onStopListening();
      clearIntervalsAndTimeouts();
      setProgress(0);
    }, 100); // Pequeno atraso após soltar o botão
  };

  const clearIntervalsAndTimeouts = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!isListening) {
      clearIntervalsAndTimeouts();
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
            strokeWidth={2}
            styles={buildStyles({
              pathColor: "#eaf1f0",
              trailColor: "transparent",
            })}
          />
        )}
        <button
          onTouchStart={handleStart}
          onTouchEnd={handleEnd} // Adicionado
          onMouseDown={handleStart}
          onMouseUp={handleEnd} // Adicionado
          onTouchCancel={handleEnd}
          onMouseLeave={handleEnd}
          disabled={isDisabled || transcript !== ""}
          className={`voice-button ${isListening ? "listening" : ""}`}
          style={{ display: transcript !== "" ? "none" : "block" }}
        >
          {isListening ? (
            <div>
              <ScaleLoader
                color="#eaf1f0"
                height={20}
                width={3}
                radius={1}
                margin={2}
              />
            </div>
          ) : (
            <FaMicrophone color="#eaf1f0" size={25} />
          )}
        </button>
      </span>
      <div className="text-container">
        <p className={`status-text ${isListening ? "listening-text" : ""}`}>
          {isListening ? "Escutando..." : ""}
        </p>
        {!isListening && showHint && (
          <p className="hint-text">Segure para falar</p>
        )}
      </div>
    </div>
  );
}
