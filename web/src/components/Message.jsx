import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import { AiFillLike, AiFillDislike } from "react-icons/ai";

export default function Message({ iaMessage, question }) {
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

  function handleDislike() {
    saveUserMessage()
      .then(() => {
        saveIaMessage("Não gostei");
      })
      .catch((e) => {
        console.error("Error saving feedback: ", e);
      });
  }

  function handleLike() {
    saveUserMessage()
      .then(() => {
        saveIaMessage("Gostei");
      })
      .catch((e) => {
        console.error("Error saving feedback: ", e);
      });
  }

  return (
    <div className="message-container">
      <p>{iaMessage}</p>
      <div className="rating-container">
        <Button
          variant="danger"
          className="rating-button"
          onClick={handleDislike}
        >
          <AiFillDislike size={24} />
        </Button>
        <Button
          variant="success"
          className="rating-button"
          onClick={handleLike}
        >
          <AiFillLike size={24} />
        </Button>
      </div>
    </div>
  );
}
