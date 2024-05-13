import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { db } from '../firebase'; // Adjust the path as necessary
import { collection, addDoc } from 'firebase/firestore';

function StarRating({ rating, onRating }) {
  const changeRating = (index) => () => {
    onRating(index);
  };

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((idx) => (
        <span key={idx} onClick={changeRating(idx)}>
          {idx <= rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

export default function ModalAssessment({ show, onClose, question, messageIa }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleFeedbackChange = (e) => setFeedback(e.target.value);
  const handleRatingChange = (newRating) => setRating(newRating);

  const handleSubmit = async () => {
    console.log("Submitting Feedback:", { question, feedback, rating, messageIa });
    try {
        await addDoc(collection(db, "feedbacks"), {
            question: question,
            feedback: feedback,
            rating: rating,
            messageIa: messageIa,
            timestamp: new Date()
        });
        onClose(); // Close the modal after submitting
    } catch (error) {
        console.error("Error submitting feedback: ", error);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Avalie a resposta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="userFeedback">
              <Form.Label>Sua Mensagem:</Form.Label>
              <Form.Control as="textarea" rows={3} value={feedback} onChange={handleFeedbackChange} />
            </Form.Group>
            <Form.Label>Avaliação:</Form.Label>
            <StarRating rating={rating} onRating={handleRatingChange} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
          <Button variant="primary" onClick={handleSubmit}>Enviar Avaliação</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
