import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import { FaThumbsUp, FaThumbsDown, FaTimes } from "react-icons/fa";

import "./Rating.scss";

export default function Rating({ habitatId, onClose }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      const feedbackRef = collection(db, `habitats/${habitatId}/feedback`);
      const feedbackQuery = query(feedbackRef);
      const feedbackSnapshot = await getDocs(feedbackQuery);
      const feedbackList = feedbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeedbacks(feedbackList);
    };

    fetchFeedbacks();
  }, [habitatId]);

  const filteredFeedbacks = feedbacks.filter(feedback => 
    filter === "all" || feedback.feedback === filter
  );

  return (
    <div className="rating-container">
      <header className="rating-header">
        <h2>Avaliações</h2>
        <button onClick={onClose} className="close-button">
            <FaTimes size={20} color="#333"/>
        </button>
        <div className="filter-buttons">
          <button 
            onClick={() => setFilter("all")} 
            className={filter === "all" ? "active" : ""}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter("like")} 
            className={filter === "like" ? "activeLike" : ""}
          >
            <FaThumbsUp /> 
          </button>
          <button 
            onClick={() => setFilter("dislike")} 
            className={filter === "dislike" ? "activeDislike" : ""}
          >
            <FaThumbsDown /> 
          </button>
        </div>
      </header>
      <div className="feedback-list">
        {filteredFeedbacks.map(feedback => (
          <div key={feedback.id} className="feedback-item">
            <p><strong>Pergunta:</strong> {feedback.question}</p>
            <p><strong>Resposta:</strong> {feedback.response}</p>
            <p><strong>Avaliação:</strong> {feedback.feedback === "like" ? <FaThumbsUp color="green" /> : <FaThumbsDown color="red" />}</p>
          </div>
        ))}
      </div>
    </div>
  );
}