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
                updatedMessages.push({ id: doc.id, ...doc.data() });
            });
            setMessages(updatedMessages);
        });

        return () => unsubscribe(); // Clean up the subscription on unmount
    }, []);

    return (
        <div className={`chat-container ${isOpen ? 'show' : 'hide'}`}>
            <div className='chat-inner'>
                {messages.map((message) => (
                    <div key={message.id} className={`message-item ${message.tag}`}>
                        <div className="message-content">
                            <strong>{message.tag === 'user' ? 'Usuário: ' : 'IA: '}</strong>
                            <p>{message.question}</p>
                            {message.tag === 'ia' && <div className="message-rating">Avaliação do Usuário: <strong>{message.rating}</strong></div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}