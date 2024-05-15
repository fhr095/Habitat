// Chat.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Button, ListGroup, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import '../styles/SceneScreen.scss';

export default function Chat({ isOpen }) {
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

        return () => unsubscribe(); // Clean up the subscription on unmount
    }, []);

    return (
        <div className={`chat-container ${isOpen ? 'show' : 'hide'}`}>
            <Container>
                <ListGroup>
                    {messages.map((message) => (
                        <ListGroup.Item key={message.id} className={`message-item ${message.tag}`}>
                            <div className="message-content">
                                <strong>{message.tag === 'user' ? 'Você: ' : 'IA: '}</strong>
                                <p>{message.question}</p>
                                {message.tag === 'ia' && <div className="message-rating">Avaliação: {message.rating}</div>}
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Container>
        </div>
    );
}