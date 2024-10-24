import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone } from "react-icons/fa";
import ScaleLoader from "react-spinners/ScaleLoader";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import * as Tone from 'tone';

import "./VoiceButton.scss";

export default function VoiceButton({ setTranscript, newTranscript, isDisabled }) {
  const [listening, setListening] = useState(false);
  const [count, setCount] = useState(1);
  const timerRef = useRef(null); 
  const intervalRef = useRef(null);

  const startListening = () => SpeechRecognition.startListening({ continuous: true, language: 'pt-BR' });
  const stopListening = () => SpeechRecognition.stopListening();

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  if (!browserSupportsSpeechRecognition) {
    console.log("Browser doesn't support speech recognition.");
    return null;
  }

  const handleStart = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    playSound();
    setListening(true);
    startListening();

    intervalRef.current = setInterval(() => {
      setCount((count) => count + 1);
    }, 1000);

    timerRef.current = setTimeout(() => {
      reseteDatas();
    }, 30000);
  };

  const handleEnd = () => {
    timerRef.current = setTimeout(() => {
      reseteDatas();
    }, 30);
  };

  const reseteDatas = () => {
    setListening(false);
      stopListening();
      setCount(1);
      intervalRef.current = clearInterval(intervalRef.current);
      if (transcript !== "") {
        setTranscript(transcript);
      }
      resetTranscript();
  };

  const playSound = () => {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease('C4', '8n');
  };

  return (
    <div className="voice-button-container">
      <span className="bar-container">
        {listening && <CircularProgressbar className="bar" value={count} maxValue={30} strokeWidth={2} styles={buildStyles({
          pathColor: `#eaf1f0`,
          trailColor: 'transparent',
        })} />}
        <button
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onTouchStart={handleStart} // Para toque na tela
          onTouchEnd={handleEnd} // Para final do toque
          disabled={isDisabled || newTranscript !== ""}
          className={`voice-button ${listening ? "listening" : ""}`}
          style={{ display: newTranscript !== "" ? "none" : "block" }}
        >
          {listening ? (
            <div>
              <ScaleLoader color="#eaf1f0" height={20} width={3} radius={1} margin={2} />
            </div>
          ) : (
            <FaMicrophone color="#eaf1f0" size={25} />
          )}
        </button>
      </span>
      <p style={{ color: listening ? "#eaf1f0" : "#eaf1f0" }}>
        {listening ? "Escutando..." : newTranscript !== "" ? "" : "Clique para Falar"}
        </p>

    </div>
  );
}