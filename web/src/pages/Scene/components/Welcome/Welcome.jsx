import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import eventBus from '../../../../eventBus';

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
  const [welcomedIds, setWelcomedIds] = useState([]);
  const audioRef = useRef(null);

  // Event handling for person detection
  useEffect(() => {
    if (isPersonDetected || isPorcupine || isScreenTouched) {
      eventBus.emit('personDetected');
    } else {
      eventBus.emit('personLost');
    }
    console.log("Person detection event emitted");
  }, [isPersonDetected, isPorcupine, isScreenTouched]);

  // Main logic for sending POST request and playing audio
  useEffect(() => {
    const now = Date.now();
    const MAX_WELCOME_TIME = 1 * 60 * 1000; // 5 minutes

    // Remove IDs that were welcomed more than 5 minutes ago
    setWelcomedIds((prevWelcomedIds) =>
      prevWelcomedIds.filter(
        (welcomed) => now - welcomed.timestamp < MAX_WELCOME_TIME
      )
    );

    // Check for new persons
    const newPersons = persons.filter(
      (person) =>
        !welcomedIds.some((welcomed) => welcomed.id === person.id)
    );
    console.log("NEW: ", newPersons)
    if (
      (isPersonDetected || isPorcupine || isScreenTouched) &&
      !isCooldown &&
      history.length === 0 &&
      newPersons.length > 0
    ) {
      setIsFinished(false); // Block speech while POST is made

      const postData = async () => {
        try {
          const res = await axios.post(
            "https://habitat-chatbot-test.netlify.app/.netlify/functions/welcome",
            {
              avt: "centroadm",
              persons: newPersons,
            }
          );
          console.log(persons);
          // Play audio when response is received
          if (res.data && res.data.audioUrl) {
            audioRef.current.src = res.data.audioUrl;
            audioRef.current.play();
            eventBus.emit('audioStarted');
          }
          // Add new IDs to welcomedIds with timestamp
          const newWelcomed = newPersons.map((person) => ({
            id: person.id,
            timestamp: now,
          }));
          setWelcomedIds((prevIds) => [...prevIds, ...newWelcomed]);
        } catch (error) {
          console.error("Error sending data:", error);
        }
      };

      // Start cooldown after sending data
      setIsCooldown(true);
      setTimeout(() => {
        setIsCooldown(false);
      }, 10000); // 10 seconds

      postData();
    }

    if (isPorcupine || isScreenTouched ) {
      setIsFinished(true);
    }
  }, [
    isPersonDetected,
    isPorcupine,
    isScreenTouched,
    persons,
    avt,
    isCooldown,
    history,
    setIsFinished,
  ]);

  // Handle audio events
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.onended = () => {
        setIsFinished(true);
        eventBus.emit('audioEnded');
      };

      audioElement.onplay = () => {
        eventBus.emit('audioStarted');
      };
    }
  }, [setIsFinished]);

  const containerClass =
    history.length > 0 || transcript !== ""
      ? "welcome-container minimized"
      : "welcome-container";

  return (
    <div className={containerClass}>
      <audio ref={audioRef} />
    </div>
  );
}
