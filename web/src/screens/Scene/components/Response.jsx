import React, { useEffect, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import "../styles/Response.scss";

export default function Response({ habitatId, transcript, responses = [], setFade }) {
  const [isLoading, setIsLoading] = useState(false);
  const [visible, setVisible] = useState(true);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    if (transcript && responses.length === 0) {
      setIsLoading(true);
      setVisible(true);
      setShowButtons(false);
    } else if (responses.length > 0) {
      setIsLoading(false);
    }
  }, [transcript, responses]);

  useEffect(() => {
    if (responses.length > 0) {
      const processNextResponse = () => {
        const currentResponse = responses[currentResponseIndex];
        const { texto, audio, fade } = currentResponse;

        if (texto) {
          setVisible(true);
        }

        if (fade) {
          setFade(fade);
        }

        if (audio) {
          const audioElement = new Audio(audio);

          audioElement.play();

          audioElement.addEventListener("ended", () => {
            if (currentResponseIndex < responses.length - 1) {
              setCurrentResponseIndex(currentResponseIndex + 1);
            } else {
              setShowButtons(true);
              const buttonTimer = setTimeout(() => {
                setVisible(false);
              }, 5000); // Show buttons for 5 seconds

              return () => clearTimeout(buttonTimer); // Cleanup timer on unmount or change
            }
          });
        }
      };

      processNextResponse();
    }
  }, [responses, currentResponseIndex, setFade]);

  const handleFeedback = async (rating) => {
    try {
      await addDoc(collection(db, "habitats", habitatId, "reviews"), {
        question: transcript,
        ratings: rating,
        responses: responses.map(response => response.texto), // Store all responses
        timestamp: serverTimestamp(),
      });
      setShowButtons(false); // Hide buttons after feedback is given
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  if (!visible) return null;

  return (
    <div className="response-container">
      {transcript && (
        <div className="chat-bubble user-message">
          {transcript}
        </div>
      )}
      {isLoading && (
        <div className="chat-bubble loading-message">
          Carregando...
        </div>
      )}
      {responses.length > 0 && !isLoading && (
        <div className="chat-bubble response-message">
          {responses[currentResponseIndex].texto} {/* Show the current response */}
        </div>
      )}
      {showButtons && (
        <div className="feedback-buttons">
          <button onClick={() => handleFeedback("Like")}>
            <FaThumbsUp />
          </button>
          <button onClick={() => handleFeedback("Dislike")}>
            <FaThumbsDown />
          </button>
        </div>
      )}
    </div>
  );
}