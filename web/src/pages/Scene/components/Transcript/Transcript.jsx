import React, { useEffect, useRef } from "react";

export default function Transcript({ setTranscript }) {
  const recognizerRef = useRef(null);

  useEffect(() => {
    const startRecognition = () => {
      if (recognizerRef.current && recognizerRef.current.recognizing) {
        return; // Se o reconhecimento já está ativo, não faça nada
      }

      try {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.error("Browser does not support speech recognition.");
          return;
        }

        const recognizer = new SpeechRecognition();
        recognizer.lang = "pt-BR";
        recognizer.continuous = true;
        recognizer.interimResults = false;
        recognizer.recognizing = false;

        recognizer.onstart = () => {
          recognizer.recognizing = true; // Marca o reconhecimento como ativo
        };

        recognizer.onend = () => {
          recognizer.recognizing = false; // Marca o reconhecimento como inativo
          if (recognizerRef.current) {
            recognizer.start(); // Reinicie o reconhecimento se estiver ativo
          }
        };

        recognizer.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join(' ')
            .trim();

          if (transcript) {
            setTranscript(prevTranscript => {
              if (prevTranscript.trim() !== transcript.trim()) {
                return transcript; // Apenas atualiza se o texto for diferente
              }
              return prevTranscript; // Mantém o mesmo texto se for igual
            });
          }
        };

        recognizer.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "no-speech") {
            if (recognizerRef.current && !recognizerRef.current.recognizing) {
              recognizer.start(); // Reinicia se ocorrer o erro "no-speech" e não estiver ativo
            }
          } else {
            stopRecognition();
          }
        };

        const stopRecognition = () => {
          if (recognizerRef.current) {
            recognizerRef.current.stop();
            recognizerRef.current = null;
          }
        };

        recognizerRef.current = recognizer;
        recognizer.start();
      } catch (error) {
        console.error("Error initializing recognition:", error);
      }
    };

    startRecognition();

    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
        recognizerRef.current = null;
      }
    };
  }, [setTranscript]);

  return null;
}