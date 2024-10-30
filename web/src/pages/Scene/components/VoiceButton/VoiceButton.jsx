import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaMicrophone } from "react-icons/fa";
import ScaleLoader from "react-spinners/ScaleLoader";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import * as Tone from "tone";

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
  const [showHint, setShowHint] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const hintTimeoutRef = useRef(null);
  const maxDurationMs = maxDuration * 1000;

  const activeTouches = useRef({});
  const debounceDelay = 50;

  const touchStartPos = useRef(null);
  const touchStartTime = useRef(null);
  const touchMoved = useRef(false);
  const TOUCH_SLOP = 10; // Limiar de movimento em pixels
  const MIN_TOUCH_TIME = 100; // Tempo mínimo de toque em ms

  const buttonRef = useRef(null);

  function getTimestamp() {
    return new Date().toISOString();
  }

  // Função de debounce
  function debounce(func, delay) {
    let debounceTimer;
    return function (...args) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  const handleStart = useCallback(
    (event) => {
      if (event && event.cancelable) event.preventDefault();
      console.log(`[${getTimestamp()}] handleStart chamado`);

      const touches = event.changedTouches || [event];

      if (touches.length > 1) {
        console.log(`[${getTimestamp()}] Mais de um toque detectado, ignorando`);
        return;
      }

      const touch = touches[0];
      const target = event.target;

      const rect = target.getBoundingClientRect();
      const x = touch.pageX - window.scrollX;
      const y = touch.pageY - window.scrollY;

      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        console.log(`[${getTimestamp()}] Toque fora do botão, ignorando`);
        return;
      }

      touchStartPos.current = { x: touch.pageX, y: touch.pageY };
      touchStartTime.current = Date.now();
      touchMoved.current = false;

      const touchId = touch.identifier != null ? touch.identifier : "mouse";
      activeTouches.current[touchId] = true;

      console.log(
        `[${getTimestamp()}] Toque iniciado em (${touch.pageX}, ${touch.pageY})`
      );

      if (isListening) {
        console.log(`[${getTimestamp()}] Já está escutando, retornando`);
        return;
      }

      clearIntervalsAndTimeouts();

      setShowHint(false);

      playSound();
      console.log(`[${getTimestamp()}] Iniciando a escuta`);
      setIsListening(true);
      onStartListening();

      startTimeRef.current = Date.now();
      setProgress(0);

      intervalRef.current = setInterval(() => {
        const elapsedTime = Date.now() - startTimeRef.current;
        const newProgress = (elapsedTime / maxDurationMs) * 100;
        setProgress(newProgress);

        if (elapsedTime >= maxDurationMs) {
          console.log(
            `[${getTimestamp()}] Tempo máximo atingido, chamando handleEnd`
          );
          handleEnd();
        }
      }, 100);
    },
    [isListening, onStartListening]
  );

  const handleMove = useCallback((event) => {
    if (event.cancelable) event.preventDefault();
    console.log(`[${getTimestamp()}] handleMove chamado`);

    const touches = event.changedTouches || [event];
    const touch = touches[0];

    if (!touchStartPos.current) return;

    const dx = touch.pageX - touchStartPos.current.x;
    const dy = touch.pageY - touchStartPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    console.log(
      `[${getTimestamp()}] Movimento detectado: distância = ${distance.toFixed(
        2
      )} pixels`
    );

    if (distance > TOUCH_SLOP) {
      touchMoved.current = true;
      console.log(`[${getTimestamp()}] touchMoved definido para true`);
    }
  }, []);

  const handleEnd = useCallback(
    (event) => {
      if (event && event.cancelable) event.preventDefault();
      console.log(`[${getTimestamp()}] handleEnd chamado`);

      const touches =
        event && event.changedTouches ? event.changedTouches : [event];
      const touch = touches[0];

      const touchId = touch && touch.identifier != null ? touch.identifier : "mouse";
      delete activeTouches.current[touchId];

      let touchDuration = 0;
      if (touchStartTime.current == null) {
        console.log(
          `[${getTimestamp()}] touchStartTime.current não definido, duração do toque definida como 0`
        );
      } else {
        touchDuration = Date.now() - touchStartTime.current;
      }

      console.log(`[${getTimestamp()}] Duração do toque: ${touchDuration} ms`);

      if (touchMoved.current) {
        console.log(`[${getTimestamp()}] Toque movido além do limiar, ignorando`);
        resetTouchState();
        // Não retornar aqui; continue para garantir que a escuta seja parada
      }

      if (touchDuration < MIN_TOUCH_TIME) {
        console.log(`[${getTimestamp()}] Toque muito curto, ignorando`);
        resetTouchState();
        // Não retornar aqui; continue para garantir que a escuta seja parada
      }

      if (Object.keys(activeTouches.current).length > 0) {
        console.log(
          `[${getTimestamp()}] Ainda existem toques ativos, não parando`
        );
        return;
      }

      if (!transcript) {
        setShowHint(true);
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = setTimeout(() => {
          setShowHint(false);
        }, 5000);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        console.log(`[${getTimestamp()}] Parando a escuta após timeout`);
        setIsListening(false);
        onStopListening();
        clearIntervalsAndTimeouts();
        setProgress(0);
      }, 100);

      resetTouchState();
    },
    [isListening, onStopListening, transcript]
  );

  const handleCancel = useCallback(
    (event) => {
      console.log(`[${getTimestamp()}] handleCancel chamado`);
      handleEnd(event);
    },
    [handleEnd]
  );

  const debouncedHandleStart = useCallback(
    debounce(handleStart, debounceDelay),
    [handleStart]
  );

  const debouncedHandleEnd = useCallback(
    debounce(handleEnd, debounceDelay),
    [handleEnd]
  );

  // Função para resetar o estado do toque
  function resetTouchState() {
    touchStartPos.current = null;
    touchStartTime.current = null; // Resetar aqui
    touchMoved.current = false;
    console.log(`[${getTimestamp()}] Estado do toque resetado`);
  }

  function clearIntervalsAndTimeouts() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    console.log(`[${getTimestamp()}] Intervalos e timeouts limpos`);
  }

  useEffect(() => {
    console.log(`[${getTimestamp()}] isListening mudou para: ${isListening}`);

    if (!isListening) {
      clearIntervalsAndTimeouts();
      setProgress(0);
      activeTouches.current = {};
      resetTouchState();
    }
  }, [isListening]);

  const playSound = () => {
    if (typeof Tone !== "undefined") {
      Tone.start(); // Necessário para alguns navegadores
      const synth = new Tone.Synth().toDestination();
      synth.triggerAttackRelease("C4", "8n");
      console.log(`[${getTimestamp()}] Som de ativação reproduzido`);
    }
  };

  // Adicionar os event listeners manualmente
  useEffect(() => {
    const buttonElement = buttonRef.current;

    if (!buttonElement) return;

    // Adicionar os event listeners com passive: false
    buttonElement.addEventListener("touchstart", debouncedHandleStart, {
      passive: false,
    });
    buttonElement.addEventListener("touchmove", handleMove, { passive: false });
    buttonElement.addEventListener("touchend", debouncedHandleEnd, {
      passive: false,
    });
    buttonElement.addEventListener("touchcancel", handleCancel, {
      passive: false,
    });

    // Limpar os event listeners ao desmontar
    return () => {
      buttonElement.removeEventListener("touchstart", debouncedHandleStart);
      buttonElement.removeEventListener("touchmove", handleMove);
      buttonElement.removeEventListener("touchend", debouncedHandleEnd);
      buttonElement.removeEventListener("touchcancel", handleCancel);
    };
  }, [debouncedHandleStart, handleMove, debouncedHandleEnd, handleCancel]);

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
          ref={buttonRef}
          onMouseDown={!isTouchDevice ? debouncedHandleStart : undefined}
          onMouseUp={!isTouchDevice ? debouncedHandleEnd : undefined}
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
