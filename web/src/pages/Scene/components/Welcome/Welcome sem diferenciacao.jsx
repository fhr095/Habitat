// Welcome.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import eventBus from '../../../../eventBus'; // Certifique-se que o caminho está correto
//import "./Welcome.scss";

export default function Welcome({
  isPersonDetected,
  isPorcupine,
  isScreenTouched,
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
    if (isPersonDetected || isPorcupine || isScreenTouched) {
      eventBus.emit('personDetected'); // Dispara evento para acenar
    } else {
      eventBus.emit('personLost'); // Dispara evento para retornar ao idle
    }
    console.log("Detectouuuuuuuuuuuu")
  }, [isPersonDetected, isPorcupine, isScreenTouched]);

  useEffect(() => {
    
  },[]);
  // Lógica para fazer o POST e tocar o áudio
  useEffect(() => {
    if ((isPersonDetected || isPorcupine || isScreenTouched) /*&& persons.length > 0*/ && !isCooldown && history.length === 0) {
      setIsFinished(false);  // Bloqueia fala enquanto o POST é feito
      const postData = async () => {
        try {
          const res = await axios.post(
            /*"https://habitat-avatar.netlify.app/.netlify/functions/welcome"*/"https://habitat-chatbot-test.netlify.app/.netlify/functions/welcome"
            /*"https://13.59.188.36:1880/talkwithifc"*/,
            {
              avt: "centroadm",
              persons: persons,
            }
          );
          console.log(persons);
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
      }, 10000); // 5 minutos

      postData();
    }
    if (isPorcupine || isScreenTouched){
      setIsFinished(true); 
    };
  }, [isPersonDetected, isPorcupine, isScreenTouched, persons, avt, isCooldown, history]);

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
