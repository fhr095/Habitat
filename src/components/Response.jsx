import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "react-bootstrap";
import {
  AiFillLike,
  AiFillDislike,
  AiOutlineLike,
  AiOutlineDislike,
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
} from "react-icons/ai";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Response.scss";

import Avatar from "../assets/images/Avatar.png";

export default function Response({
  iaResponse,
  setIaReponse,
  question,
  setTranscript,
  focusOnLocation,
  onFinish,
}) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showFeedbackButtons, setShowFeedbackButtons] = useState(false);
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);

  const [like, setLike] = useState(false);
  const [dislike, setDislike] = useState(false);

  useEffect(() => {
    if (iaResponse.length > 0 && currentMessageIndex < iaResponse.length) {
      const {
        texto: message,
        audio: audioUrl,
        fade: fadeTarget,
        duration = 3000,
      } = iaResponse[currentMessageIndex] || {};

      setShowMessage(true);
      setShowFeedbackButtons(false);

      const handleAudioEnd = () => {
        setShowFeedbackButtons(true);
        if (currentMessageIndex === iaResponse.length - 1) {
          setShowProgress(true);
          timeoutRef.current = setTimeout(() => {
            setShowProgress(false);
            setShowMessage(false);
            setIaReponse([]);
            setTranscript("");
            if (onFinish) onFinish();
          }, 5000);
        } else {
          setShowMessage(false);
          handleNextMessage();
        }
      };

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play()
          .then(() => {
            audio.onended = handleAudioEnd;
          })
          .catch(error => {
            console.error("Audio play interrupted: ", error);
            handleNextMessage(); // Avança para a próxima mensagem em caso de erro
          });
      } else {
        handleNextMessage(); // Avança para a próxima mensagem se não houver áudio
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
  }, [iaResponse, currentMessageIndex]);

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
      setLike(false);
      setDislike(false);
      if (onFinish) onFinish();
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div className="response-container">
      {showMessage && iaResponse[currentMessageIndex] && (
        <div className="message-wrapper">
          <div className="bot-icon">
            <img src={Avatar} alt="Avatar" style={{ width: '30px', height: '30px' }} />
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
            {currentMessageIndex === iaResponse.length - 1 && (
              <>
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
                {showProgress && (
                  <div className="response-progress-bar-container">
                    <div className="response-progress-bar">
                      <div className="response-progress"></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}