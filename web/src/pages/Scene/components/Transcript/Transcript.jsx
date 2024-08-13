import React, { useEffect, useState } from "react";

export default function Transcript({ setTranscript }) {
  const [isListening, setIsListening] = useState(false);
  let recognition;

  useEffect(() => {
    // Verifica se o navegador suporta a Web Speech API
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Web Speech API is not supported by this browser.");
      return;
    }

    // Cria uma instância do reconhecimento de fala
    recognition = new window.webkitSpeechRecognition();
    recognition.lang = "pt-BR"; // Definindo o idioma para português
    recognition.continuous = true; // Para capturar a fala continuamente
    recognition.interimResults = false; // Para receber apenas os resultados finais

    // Evento disparado quando o usuário fala algo e o reconhecimento tem um resultado
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      console.log("Recognized: ", transcript);
      setTranscript(transcript);
    };

    // Evento disparado quando o reconhecimento começa
    recognition.onstart = () => {
      console.log("Recognition started");
      setIsListening(true);
    };

    // Evento disparado quando o reconhecimento para
    recognition.onend = () => {
      console.log("Recognition ended");
      setIsListening(false);
    };

    // Evento disparado em caso de erro
    recognition.onerror = (event) => {
      console.error("Recognition error: ", event.error);
    };

    // Inicia o reconhecimento de fala
    recognition.start();

    // Cleanup function para parar o reconhecimento quando o componente desmonta
    return () => {
      recognition.stop();
    };
  }, [setTranscript]);

  return (
    <div>

    </div>
  );
}