import React, { useEffect } from "react"; 
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { toast, ToastContainer } from 'react-toastify';
import { Button } from "react-bootstrap";
import { AiFillLike, AiFillDislike, AiOutlineRobot } from "react-icons/ai";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

export default function Message({ iaMessage, question }) {
  
  useEffect(() => {
    showToast();
  }, [iaMessage]);

  const showToast = () => {
    toast(
      <div>
        <AiOutlineRobot size={24} style={{ marginRight: 10 }} />
        <strong>{iaMessage}</strong>
        <div style={{ marginTop: 10 }}>
          <Button
            variant="danger"
            onClick={() => handleRating("Não gostei")}
          >
            <AiFillDislike size={24} />
          </Button>
          <Button
            variant="success"
            onClick={() => handleRating("Gostei")}
          >
            <AiFillLike size={24} />
          </Button>
        </div>
      </div>,
      {
        position: "bottom-right",
        autoClose: false,
        closeOnClick: false,
        draggable: true,
        onClose: () => {}
      }
    );
  };

  function handleRating(rating){
    saveUserMessage().then(() => {
      saveIaMessage(rating);
    }).catch((e) => {
      console.error("Error saving feedback: ", e);
    });
  };

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
      <ToastContainer />
    </div>
  );
}