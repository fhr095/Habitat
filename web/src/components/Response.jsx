import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "react-bootstrap";
import { AiFillLike, AiFillDislike, AiOutlineRobot, AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";
import "bootstrap/dist/css/bootstrap.min.css";
import '../styles/Response.scss';

export default function Response({ iaResponse, setIaReponse, question, focusOnLocation }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (iaResponse.length > 0 && currentMessageIndex < iaResponse.length) {
      const { texto: message, audio: audioUrl, fade: fadeTarget, duration = 3000 } = iaResponse[currentMessageIndex];

      setShowMessage(true);

      const handleAudioEnd = () => {
        if (currentMessageIndex === iaResponse.length - 1) {
          setShowProgress(true);
          setTimeout(() => {
            setShowProgress(false);
            setShowMessage(false);
            setIaReponse([]);
          }, 5000); // Barra de progresso visível por 5 segundos
        } else {
          setShowMessage(false);
          handleNextMessage();
        }
      };

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = handleAudioEnd;
      } else {
        setTimeout(handleAudioEnd, duration);
      }

      if (fadeTarget) {
        focusOnLocation(fadeTarget);
      }
    }
  }, [currentMessageIndex, iaResponse, focusOnLocation]);

  const handleNextMessage = () => {
    setCurrentMessageIndex((prevIndex) => prevIndex + 1);
  };

  const handlePreviousMessage = () => {
    if (currentMessageIndex > 0) {
      setCurrentMessageIndex((prevIndex) => prevIndex - 1);
    }
  };

  const saveFeedback = async (rating) => {
    try {
      await addDoc(collection(db, "feedback"), {
        question,
        responses: iaResponse.map((message) => message.texto),
        ratings: rating,
        timestamp: serverTimestamp(),
      });
      setShowProgress(false);
      setShowMessage(false);
      setIaReponse([]);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div className="response-container">
      {showMessage && (
        <div className="message-container">
          <div className="response">
            <div className="bot-icon">
              <AiOutlineRobot size={24} color="white" />
            </div>
            <p>{iaResponse[currentMessageIndex].texto}</p>
          </div>
          <div className="pagination">
            {currentMessageIndex + 1} / {iaResponse.length}
          </div>
          <div className="navigation-buttons">
            <Button variant="secondary" onClick={handlePreviousMessage} disabled={currentMessageIndex === 0}>
              <AiOutlineArrowLeft size={24} />
            </Button>
            <Button variant="secondary" onClick={handleNextMessage} disabled={currentMessageIndex === iaResponse.length - 1}>
              <AiOutlineArrowRight size={24} />
            </Button>
          </div>
          {currentMessageIndex === iaResponse.length - 1 && (
            <div className="feedback-buttons-container">
              <Button variant="danger" onClick={() => saveFeedback("Não gostei")}>
                <AiFillDislike size={24} />
              </Button>
              <Button variant="success" onClick={() => saveFeedback("Gostei")}>
                <AiFillLike size={24} />
              </Button>
            </div>
          )}
          {currentMessageIndex === iaResponse.length - 1 && showProgress && (
            <div className="response-progress-bar-container">
              <div className="response-progress-bar">
                <div className="response-progress"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
