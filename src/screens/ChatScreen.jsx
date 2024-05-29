import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Container, ListGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import '../styles/ChatScreen.scss';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "feedback"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const updatedMessages = [];
      querySnapshot.forEach((doc) => {
        updatedMessages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(updatedMessages);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Container fluid className="chat-container">
      <ListGroup variant="flush">
        {messages.map((msg) => (
          <ListGroup.Item
            key={msg.id}
            className={`chat-message ${msg.tag === "user" ? "user-message" : "ia-message"}`}
          >
            <div className="message-content">
              <div className="text">{msg.question}</div>
              {msg.tag === "ia" && <div className="message-rating">Avaliação: {msg.rating}</div>}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Container>
  );
}