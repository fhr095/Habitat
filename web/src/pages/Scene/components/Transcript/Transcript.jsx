import React, { useEffect, useState } from "react";

export default function Transcript({ setTranscripts }) {
  const [isListening, setIsListening] = useState(false);
  let recognition;

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Web Speech API is not supported by this browser.");
      return;
    }

    recognition = new window.webkitSpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      console.log("Recognized: ", transcript);
      setTranscripts((prevTranscripts) => [...prevTranscripts, transcript]); // Adiciona a nova transcrição ao array
    };

    recognition.onstart = () => {
      console.log("Recognition started");
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log("Recognition ended");
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Recognition error: ", event.error);
    };

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [setTranscripts]);

  return <div></div>;
}