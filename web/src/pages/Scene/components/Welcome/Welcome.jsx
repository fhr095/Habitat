// Welcome.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import eventBus from '../../../../eventBus'; // Certifique-se que o caminho está correto
//import "./Welcome.scss";

export default function Welcome({
  isPersonDetected,
  isPorcupine,
  history,
  transcript,
  avt,
  persons,
  setIsFinished,
}) {
  const [isCooldown, setIsCooldown] = useState(false);
  const audioRef = useRef(null);

  // Dispara eventos de detecção de pessoa
  useEffect(() => {
    if (isPersonDetected || isPorcupine) {
      eventBus.emit('personDetected'); // Dispara evento para acenar
    } else {
      eventBus.emit('personLost'); // Dispara evento para retornar ao idle
    }
    console.log("Detectouuuuuuuuuuuu")
  }, [isPersonDetected, isPorcupine]);

  if (isPorcupine){
    setIsFinished(true); 
  };

  // Lógica para fazer o POST e tocar o áudio
  useEffect(() => {
    if (isPersonDetected && persons.length > 0 && !isCooldown && history.length === 0) {
      setIsFinished(false);  // Bloqueia fala enquanto o POST é feito
      const postData = async () => {
        try {
          const res = await axios.post(
            "https://habitat-avatar.netlify.app/.netlify/functions/welcome",
            {
              avt: "centroadm",
              persons: persons,
            }
          );
          // Tocar o áudio quando a resposta for recebida
          if (res.data && res.data.audioUrl) {
            audioRef.current.src = res.data.audioUrl;
            audioRef.current.play();
            eventBus.emit('audioStarted'); // Dispara evento quando o áudio começa
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

  // Disparar evento quando o áudio termina
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.onended = () => {
        setIsFinished(true);  // Libera fala após o áudio terminar
        eventBus.emit('audioEnded'); // Dispara evento quando o áudio termina
      };

      audioElement.onplay = () => {
        eventBus.emit('audioStarted'); // Dispara evento quando o áudio começa
      };
    }
  }, [setIsFinished]);

  // Remover o estado e JSX relacionado a GIFs
  const containerClass =
    history.length > 0 || transcript !== "" ? "welcome-container minimized" : "welcome-container";

  return (
    <div className={containerClass}>
      {/* Removido o <img> de GIFs */}
      <audio ref={audioRef} />
    </div>
  );
}
