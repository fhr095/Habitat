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
  const [showHint, setShowHint] = useState(false); // Controla o hint "Segure para falar"
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const hintTimeoutRef = useRef(null); // Timeout para exibir o hint
  const maxDurationMs = maxDuration * 1000; // Converter para milissegundos

  const activeTouches = useRef({}); // Controle de toques ativos
  const debounceDelay = 50; // Delay para debounce

  // Função de debounce
  function debounce(func, delay) {
    let debounceTimer;
    return function (...args) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Funções com debounce aplicado
  const debouncedHandleStart = debounce(handleStart, debounceDelay);
  const debouncedHandleEnd = debounce(handleEnd, debounceDelay);

  // Manipulador para início do toque
  function handleStart(event) {
    event.preventDefault();

    const touches = event.changedTouches || [event];
    for (let touch of touches) {
      activeTouches.current[touch.identifier || "mouse"] = {
        startTime: Date.now(),
        isActive: true,
      };
    }

    // Se já estiver escutando, não faça nada
    if (isListening) return;

    // Limpa intervalos e timeouts anteriores
    clearIntervalsAndTimeouts();

    setShowHint(false); // Esconde o hint imediatamente ao pressionar

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
        handleEnd(); // Para automaticamente após o tempo máximo
      }
    }, 100); // Atualiza a cada 100 ms para uma progressão mais suave
  }

  // Manipulador para fim do toque
  function handleEnd(event) {
    if (event) event.preventDefault();

    const touches = event.changedTouches || [event];
    for (let touch of touches) {
      delete activeTouches.current[touch.identifier || "mouse"];
    }

    // Se ainda houver toques ativos, não pare de escutar
    if (Object.keys(activeTouches.current).length > 0) return;

    if (!transcript) {
      // Exibe "Segure para falar" se nenhum transcript for detectado
      setShowHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setShowHint(false);
      }, 5000); // Exibe o hint por 5 segundos
    }

    // Aguarda um pequeno delay antes de parar de escutar
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onStopListening();
      clearIntervalsAndTimeouts();
      setProgress(0);
    }, 100); // Delay de 100 ms após soltar o botão
  }

  // Função para limpar intervalos e timeouts
  function clearIntervalsAndTimeouts() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(() => {
    if (!isListening) {
      clearIntervalsAndTimeouts();
      setProgress(0);
    }
    // Limpa toques ativos quando parar de escutar
    activeTouches.current = {};
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
          onTouchStart={debouncedHandleStart}
          onTouchEnd={debouncedHandleEnd}
          onMouseDown={debouncedHandleStart}
          onMouseUp={debouncedHandleEnd}
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
