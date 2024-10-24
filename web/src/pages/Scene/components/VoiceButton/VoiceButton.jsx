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
  const [listening, setListening] = useState(false); // State to handle listening
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const maxDurationMs = maxDuration * 1000; // Convert to milliseconds

  const handleClick = () => {
    if (!listening) {
      // Start listening
      playSound();
      onStartListening();
      startTimeRef.current = Date.now();
      setProgress(0);
      setListening(true);

      // Update progress bar
      intervalRef.current = setInterval(() => {
        const elapsedTime = Date.now() - startTimeRef.current;
        const newProgress = (elapsedTime / maxDurationMs) * 100;
        setProgress(newProgress);

        if (elapsedTime >= maxDurationMs) {
          handleStop(); // Automatically stop after maxDuration
        }
      }, 100);
    } else {
      // Stop listening and send data
      handleStop();
    }
  };

  const handleStop = () => {
    onStopListening();
    setListening(false);
    setProgress(0);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isListening && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
        {listening && (
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
          onClick={handleClick}
          disabled={isDisabled || transcript !== ""}
          className={`voice-button ${listening ? "listening" : ""}`}
          style={{ display: transcript !== "" ? "none" : "block" }}
        >
          {listening ? (
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
        <p className={`status-text ${listening ? "listening-text" : ""}`}>
          {listening ? "Escutando..." : ""}
        </p>
      </div>
    </div>
  );
}
