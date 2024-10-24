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
  maxDuration = 30, // Duration in seconds
}) {
  const [progress, setProgress] = useState(0);
  const [showHint, setShowHint] = useState(false); // Controls the "Segure para falar" hint
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const hintTimeoutRef = useRef(null); // Timeout for hint display
  const maxDurationMs = maxDuration * 1000; // Convert to milliseconds

  // Handle the start of the button press
  const handleStart = (event) => {
    // Prevent default behavior to avoid conflicts (e.g., context menu, scrolling)
    event.preventDefault();

    // Clear any existing intervals or timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }

    setShowHint(false); // Hide the hint immediately on press

    playSound();
    onStartListening();

    startTimeRef.current = Date.now();
    setProgress(0);

    // Update progress bar
    intervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTimeRef.current;
      const newProgress = (elapsedTime / maxDurationMs) * 100;
      setProgress(newProgress);

      if (elapsedTime >= maxDurationMs) {
        handleEnd(); // Automatically stop listening after maxDuration
      }
    }, 100); // Update every 100 ms for smoother progress
  };

  // Handle the end of the button press
  const handleEnd = (event) => {
    // Prevent default behavior
    if (event) event.preventDefault();

    if (!transcript) {
      // Show "Segure para falar" if no transcript is detected
      setShowHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setShowHint(false);
      }, 5000); // Show hint for 5 seconds
    }

    // Wait 30 ms before stopping listening
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
    }, 100); // 30 ms delay after releasing the button
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
            strokeWidth={2}
            styles={buildStyles({
              pathColor: "#eaf1f0",
              trailColor: "transparent",
            })}
          />
        )}
        <button
          onPointerDown={handleStart}
          onPointerUp={handleEnd}
          onPointerCancel={handleEnd}
          onPointerLeave={handleEnd}
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
