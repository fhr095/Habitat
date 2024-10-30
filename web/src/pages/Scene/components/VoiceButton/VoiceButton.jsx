import React, { useState, useRef, useEffect, useCallback } from "react";
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

  // Função de debounce
  function debounce(func, delay) {
    let debounceTimer;
    return function (...args) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  const handleStart = useCallback((event) => {
    event.preventDefault();

    const touches = event.changedTouches || [event];

    if (touches.length > 1) {
      // Mais de um toque detectado, ignorar
      return;
    }

    const touch = touches[0];
    const target = event.target;

    const rect = target.getBoundingClientRect();
    const x = touch.pageX - window.scrollX;
    const y = touch.pageY - window.scrollY;

    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      // Toque fora do botão, ignorar
      return;
    }

    touchStartPos.current = { x: touch.pageX, y: touch.pageY };
    touchStartTime.current = Date.now();
    touchMoved.current = false;

    activeTouches.current[touch.identifier || "mouse"] = true;

    if (isListening) return;

    clearIntervalsAndTimeouts();

    setShowHint(false);

    playSound();
    onStartListening();

    startTimeRef.current = Date.now();
    setProgress(0);

    intervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTimeRef.current;
      const newProgress = (elapsedTime / maxDurationMs) * 100;
      setProgress(newProgress);

      if (elapsedTime >= maxDurationMs) {
        handleEnd(); // Para automaticamente após o tempo máximo
      }
    }, 100);
  }, [isListening, onStartListening]);

  const handleMove = useCallback((event) => {
    event.preventDefault();

    const touches = event.changedTouches || [event];
    const touch = touches[0];

    if (!touchStartPos.current) return;

    const dx = touch.pageX - touchStartPos.current.x;
    const dy = touch.pageY - touchStartPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > TOUCH_SLOP) {
      touchMoved.current = true;
    }
  }, []);

  const handleEnd = useCallback((event) => {
    event.preventDefault();

    const touches = event.changedTouches || [event];
    const touch = touches[0];

    delete activeTouches.current[touch.identifier || "mouse"];

    const touchDuration = Date.now() - touchStartTime.current;

    if (touchMoved.current || touchDuration < MIN_TOUCH_TIME) {
      resetTouchState();
      return;
    }

    if (Object.keys(activeTouches.current).length > 0) return;

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
      onStopListening();
      clearIntervalsAndTimeouts();
      setProgress(0);
    }, 100);

    resetTouchState();
  }, [onStopListening, transcript]);

  const debouncedHandleStart = useCallback(
    debounce(handleStart, debounceDelay),
    [handleStart]
  );

  const debouncedHandleEnd = useCallback(
    debounce(handleEnd, debounceDelay),
    [handleEnd]
  );

  function resetTouchState() {
    touchStartPos.current = null;
    touchStartTime.current = null;
    touchMoved.current = false;
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
  }

  useEffect(() => {
    if (!isListening) {
      clearIntervalsAndTimeouts();
      setProgress(0);
    }
    activeTouches.current = {};
    resetTouchState();
  }, [isListening]);

  const playSound = () => {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C4", "8n");
  };

  // Adicionar os event listeners manualmente
  useEffect(() => {
    const buttonElement = buttonRef.current;

    if (!buttonElement) return;

    // Adicionar os event listeners com passive: false
    buttonElement.addEventListener("touchstart", debouncedHandleStart, { passive: false });
    buttonElement.addEventListener("touchmove", handleMove, { passive: false });
    buttonElement.addEventListener("touchend", debouncedHandleEnd, { passive: false });

    // Limpar os event listeners ao desmontar
    return () => {
      buttonElement.removeEventListener("touchstart", debouncedHandleStart);
      buttonElement.removeEventListener("touchmove", handleMove);
      buttonElement.removeEventListener("touchend", debouncedHandleEnd);
    };
  }, [debouncedHandleStart, handleMove, debouncedHandleEnd]);

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
