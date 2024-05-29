import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import '../styles/Chat.scss';

export default function Chat({ isOpen }) {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "feedback"), orderBy("timestamp", "asc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const updatedMessages = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                updatedMessages.push({
                    id: doc.id,
                    question: data.question,
                    responses: data.responses,
                    ratings: data.ratings,
                    timestamp: data.timestamp,
                });
            });
            setMessages(updatedMessages);
        });

        return () => unsubscribe(); // Clean up the subscription on unmount
    }, []);

    return (
        <div className={`chat-container ${isOpen ? 'show' : 'hide'}`}>
            <div className='chat-inner'>
                {messages.map((message) => (
                    <div key={message.id} className="message-item">
                        <div className="message-content">
                            <strong>Usuário:</strong>
                            <p>{message.question}</p>
                            {message.responses.map((response, index) => (
                                <div key={index} className="message-response">
                                    <strong>IA:</strong>
                                    <p>{response}</p>
                                </div>
                            ))}
                            <div className="message-rating">
                                Avaliação do Usuário: <strong>{message.ratings}</strong>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}