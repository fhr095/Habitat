import React, { useEffect, useState, useRef } from "react";

export default function Transcript({ setTranscripts }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const isManuallyStopped = useRef(false); // Flag to avoid infinite restart loop

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Web Speech API is not supported by this browser.");
      return;
    }

    const startRecognition = () => {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      }
    };

    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.lang = "pt-BR";
    recognitionRef.current.continuous = true;  // Continuously listen for speech
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript.trim();
      setTranscripts((prevTranscripts) => [...prevTranscripts, transcript]);
    };

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (!isManuallyStopped.current) {
        console.log("Restarting recognition...");
        startRecognition();  // Restart recognition automatically if it stops
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Recognition error: ", event.error);
      if (event.error === "no-speech" || event.error === "network") {
        console.log("Error occurred, restarting recognition...");
        startRecognition();  // Restart on specific errors
      }
    };

    startRecognition();

    return () => {
      isManuallyStopped.current = true; // Prevent restarting after unmount
      recognitionRef.current.stop();
    };
  }, [setTranscripts]);

  return <></>;
}