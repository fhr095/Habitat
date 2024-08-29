import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Welcome.scss";

export default function Welcome({
  isPersonDetected,
  history,
  transcripts,
  avt,
  persons,
  isFinished,
}) {
  const [currentGif, setCurrentGif] = useState("/Avatar/chegando.gif");
  const [isCooldown, setIsCooldown] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isPersonDetected) {
      setCurrentGif("/Avatar/acenando.gif");
    } else {
      const timer = setTimeout(() => {
        setCurrentGif("/Avatar/conversando-feliz.gif");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isPersonDetected]);

  useEffect(() => {
    if (isPersonDetected && persons.length > 0 && !isCooldown && history.length === 0) {
      isFinished(true);  // Bloqueia fala enquanto o POST é feito
      const postData = async () => {
        try {
          const res = await axios.post(
            "https://roko.flowfuse.cloud/talkwithifc",
            {
              avt: avt,
              persons: persons,
            }
          );
          // Play the audio when response is received
          if (res.data.comandos && res.data.comandos.audio) {
            audioRef.current.src = res.data.comandos.audio;
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
        isFinished(false);  // Libera fala após o áudio terminar
      };
    }
  }, [isFinished]);

  const containerClass =
    history.length > 0 || transcripts !== "" ? "welcome-container minimized" : "welcome-container";

  return (
    <div className={containerClass}>
      <img src={currentGif} alt="Animated GIF" className="gif" />
      <audio ref={audioRef} />
    </div>
  );
}
