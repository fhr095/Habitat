import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Welcome.scss";

export default function Welcome({
  isPersonDetected,
  history,
  transcript,
  avt,
  persons,
  setIsFinished,
}) {
  const [currentGif, setCurrentGif] = useState("/Avatar/falando.gif");
  const [isCooldown, setIsCooldown] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isPersonDetected) {
      setCurrentGif("/Avatar/acenando.gif");
    } else {
      const timer = setTimeout(() => {
        setCurrentGif("/Avatar/falando.gif");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isPersonDetected]);

  useEffect(() => {
    if (isPersonDetected && persons.length > 0 && !isCooldown && history.length === 0) {
      setIsFinished(false);  // Bloqueia fala enquanto o POST é feito
      const postData = async () => {
        try {
          const res = await axios.post(
            // "https://roko.flowfuse.cloud/talkwithifc",
            "https://habitat-avatar.netlify.app/.netlify/functions/welcome",
            {
              avt: "centroadm",
              persons: persons,
            }
          );
          // Play the audio when response is received
          if (res.data && res.data.audioUrl) {
            audioRef.current.src = res.data.audioUrl;
            audioRef.current.play();
          }
        } catch (error) {
          console.error("Error sending data:", error);
        }
      };

      // Inicia o cooldown de 5 minutos após o envio dos dados
      setIsCooldown(true);
      setTimeout(() => {
        setIsCooldown(false);
      }, 300000); // 5 minutos

      postData();
    }
  }, [isPersonDetected, persons, avt, isCooldown, history]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.onended = () => {
        setIsFinished(true);  // Libera fala após o áudio terminar
      };
    }
  }, [setIsFinished]);

  const containerClass =
    history.length > 0 || transcript !== "" ? "welcome-container minimized" : "welcome-container";

  return (
    <div className={containerClass}>
      <img src={currentGif} alt="Animated GIF" className="gif" />
      <audio ref={audioRef} />
    </div>
  );
}
