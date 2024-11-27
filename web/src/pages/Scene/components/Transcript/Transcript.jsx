import React, { useEffect, useRef } from "react";

export default function Transcript({ setTranscript }) {
  const recognizerRef = useRef(null);

  useEffect(() => {
    // Inicia o reconhecimento quando o componente é montado
    startRecognition();

    // Para o reconhecimento quando o componente é desmontado
    return () => {
      stopRecognition();
    };
  }, []);

  const startRecognition = () => {
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error("O navegador não suporta reconhecimento de voz.");
        return;
      }

      const recognizer = new SpeechRecognition();
      recognizer.lang = "pt-BR";
      recognizer.continuous = true;
      recognizer.interimResults = false;
      

      recognizer.onstart = () => {
        console.log("Reconhecimento de voz iniciado.");
      };

      recognizer.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join(" ")
          .trim();

        if (transcript) {
          setTranscript((prevTranscript) => {
            if (prevTranscript.trim() !== transcript.trim()) {
              return transcript; // Atualiza se o texto for diferente
            }
            return prevTranscript; // Mantém o mesmo texto se for igual
          });
        }
      };

      recognizer.onerror = (event) => {
        console.error("Erro no reconhecimento de voz:", event.error);
      };

      recognizer.onend = () => {
        console.log("Reconhecimento de voz encerrado.");
        // Reinicia o reconhecimento se o componente ainda estiver montado
        if (recognizerRef.current) {
          recognizer.start();
        }
      };

      recognizerRef.current = recognizer;
      recognizer.start();
    } catch (error) {
      console.error("Erro ao iniciar o reconhecimento:", error);
    }
  };

  const stopRecognition = () => {
    if (recognizerRef.current) {
      recognizerRef.current.onend = null; // Evita reiniciar ao parar
      recognizerRef.current.stop();
      recognizerRef.current = null;
    }
  };

  // O componente não renderiza nada na interface
  return null;
}
