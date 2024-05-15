import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { toast, ToastContainer } from "react-toastify";
import { Button } from "react-bootstrap";
import { AiFillLike, AiFillDislike, AiOutlineRobot } from "react-icons/ai";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

export default function Message({ iaMessage, question }) {
  const [toastId, setToastId] = useState(null); // Guarda o ID do toast para controle

  useEffect(() => {
    if (iaMessage) {
      const id = toast(
        <div className="message-container">
          <div className="response-container">
            <div className="bot-icon"> 
              <AiOutlineRobot size={24} color="white"/>
            </div>
            <p>{iaMessage}</p>
          </div>
          <div className="buttons-container">
            <Button variant="danger" onClick={() => handleRating("Não gostei")}>
              <AiFillDislike size={24} />
            </Button>
            <Button variant="success" onClick={() => handleRating("Gostei")}>
              <AiFillLike size={24} />
            </Button>
          </div>
        </div>,
        {
          position: "bottom-center",
          autoClose: false,
          closeOnClick: false,
          draggable: true,
          onClose: () => setToastId(null),
        }
      );
      setToastId(id);
    }
  }, [iaMessage]); // Dependência apenas em iaMessage

  function handleRating(rating) {
    toast.dismiss(toastId); // Fecha o toast imediatamente ao clicar em um botão
    saveUserMessage()
      .then(() => {
        saveIaMessage(rating);
      })
      .catch((e) => {
        console.error("Error saving feedback: ", e);
      });
  }

  async function saveUserMessage() {
    try {
      await addDoc(collection(db, "feedback"), {
        question: question,
        tag: "user",
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  async function saveIaMessage(rating) {
    try {
      console.log("Rating: ", rating);
      await addDoc(collection(db, "feedback"), {
        question: iaMessage,
        tag: "ia",
        rating: rating,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  return (
    <div>
      <ToastContainer style={{width: "70%", marginBottom: "-20px"}} />
    </div>
  );
}