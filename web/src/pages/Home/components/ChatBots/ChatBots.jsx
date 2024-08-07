import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaCheck } from "react-icons/fa";
import { collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../../../firebase";
import "./ChatBots.scss";

export default function ChatBots({ habitatId, user, bot, setChatBot, setFade }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        const userMessagesRef = collection(db, `habitats/${habitatId}/avatars/${bot.id}/messages/${user.email}/userMessages`);
        const q = query(userMessagesRef, orderBy("timestamp"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const messages = [];
            querySnapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            setMessages(messages);
        });

        return () => unsubscribe();
    }, [habitatId, bot.id, user.email]);

    const sendMessage = async (message) => {
        try {
            const response = await axios.post("https://roko.flowfuse.cloud/talkwithifc", {
                msg: message,
                avt: bot.avt
            });

            const userMessage = {
                sender: user.email,
                message,
                timestamp: new Date(),
            };

            const userMessagesRef = collection(db, `habitats/${habitatId}/avatars/${bot.id}/messages/${user.email}/userMessages`);
            
            // Add user message to Firestore
            await addDoc(userMessagesRef, userMessage);

            // Process and add all bot replies to Firestore
            response.data.comandos.forEach(async (comando) => {
                const botReply = {
                    sender: "bot",
                    message: comando.texto,
                    timestamp: new Date(),
                };
                await addDoc(userMessagesRef, botReply);

                // Send fade value to setFade if exists
                if (comando.fade) {
                    setFade(comando.fade);
                }
            });

        } catch (error) {
            console.error("Erro ao enviar mensagem para o bot: ", error);
        }
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === "") return;

        await sendMessage(newMessage);
        setNewMessage("");
    };

    return (
        <div className="chat-bots">
            <header>
                <div className="chat-bot-info">
                    <img src={bot.imageUrl} alt={bot.name} />
                    <div className="text">{bot.name}</div>
                </div>
                <button onClick={() => setChatBot({})}>
                    <FaTimes size={20} />
                </button>
            </header>
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender === user.email ? "sent" : "received"}`}>
                        {msg.sender !== user.email && <img src={bot.imageUrl} alt="Bot" className="profile-img" />}
                        <p>{msg.message}</p>
                        {msg.sender === user.email && <img src={user.profileImageUrl} alt="User" className="profile-img" />}
                    </div>
                ))}
            </div>
            <footer>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem"
                />
                <button onClick={handleSendMessage}>
                    <FaCheck size={20} />
                </button>
            </footer>
        </div>
    );
}