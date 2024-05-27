import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "react-bootstrap";
import {
  AiFillLike,
  AiFillDislike,
  AiOutlineLike,
  AiOutlineDislike,
  AiOutlineRobot,
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
} from "react-icons/ai";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Response.scss";

export default function Response({
  iaResponse,
  setIaReponse,
  question,
  focusOnLocation,
  onFinish,
}) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);
  const [showFeedbackButtons, setShowFeedbackButtons] = useState(false); // Estado para controlar a exibição dos botões de feedback

  const [like, setLike] = useState(false);
  const [dislike, setDislike] = useState(false);

  useEffect(() => {
    if (iaResponse.length > 0 && currentMessageIndex < iaResponse.length) {
      const {
        texto: message,
        audio: audioUrl,
        fade: fadeTarget,
        duration = 3000,
      } = iaResponse[currentMessageIndex];

      setShowMessage(true);

      const handleAudioEnd = () => {
        if (currentMessageIndex === iaResponse.length - 1) {
          setShowProgress(true);
          timeoutRef.current = setTimeout(() => {
            setShowProgress(false);
            setShowMessage(false);
            setIaReponse([]);
            setShowFeedbackButtons(true); // Mostrar botões de feedback após o áudio terminar
            if (onFinish) onFinish(); // Chama onFinish quando a resposta termina
          }, 5000); // Barra de progresso visível por 5 segundos
        } else {
          setShowMessage(false);
          handleNextMessage();
        }
      };

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play();
        audio.onended = handleAudioEnd;
      } else {
        timeoutRef.current = setTimeout(handleAudioEnd, duration);
      }

      if (fadeTarget) {
        focusOnLocation(fadeTarget, duration);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentMessageIndex, iaResponse, focusOnLocation, onFinish]);

  const handleNextMessage = () => {
    stopCurrentExecution();
    setCurrentMessageIndex((prevIndex) => prevIndex + 1);
  };

  const handlePreviousMessage = () => {
    if (currentMessageIndex > 0) {
      stopCurrentExecution();
      setCurrentMessageIndex((prevIndex) => prevIndex - 1);
    }
  };

  const stopCurrentExecution = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
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
      setLike(false);
      setDislike(false);
      if (onFinish) onFinish(); // Chama onFinish quando o feedback termina
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div className="response-container">
      {showMessage && (
        <div className="message-wrapper">
          <div className="bot-icon">
            <AiOutlineRobot size={24} color="black" />
          </div>
          <div className="message-container">
            <div className="response">
              <p>{iaResponse[currentMessageIndex].texto}</p>
            </div>
            <div className="pagination">
              {currentMessageIndex + 1} / {iaResponse.length}
            </div>
            <div className="navigation-buttons">
              <Button
                variant="secondary"
                onClick={handlePreviousMessage}
                disabled={currentMessageIndex === 0}
              >
                <AiOutlineArrowLeft size={24} />
              </Button>
              <Button
                variant="secondary"
                onClick={handleNextMessage}
                disabled={currentMessageIndex === iaResponse.length - 1}
              >
                <AiOutlineArrowRight size={24} />
              </Button>
            </div>
            {currentMessageIndex === iaResponse.length - 1 && showProgress && (
              <div className="response-progress-bar-container">
                <div className="response-progress-bar">
                  <div className="response-progress"></div>
                </div>
              </div>
            )}
            {showFeedbackButtons && (
              <div className="feedback-buttons-container">
                <Button
                  variant="link"
                  onClick={() => {
                    saveFeedback("Dislike");
                    setDislike(true);
                    setLike(false);
                  }}
                >
                  {dislike ? (
                    <AiFillDislike size={24} color="red" />
                  ) : (
                    <AiOutlineDislike size={24} color="#222" />
                  )}
                </Button>
                <Button
                  variant="link"
                  onClick={() => {
                    saveFeedback("Like");
                    setLike(true);
                    setDislike(false);
                  }}
                >
                  {like ? (
                    <AiFillLike size={24} color="green" />
                  ) : (
                    <AiOutlineLike size={24} color="#222" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
