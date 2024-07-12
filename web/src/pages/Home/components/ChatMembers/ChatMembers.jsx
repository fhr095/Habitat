import React, { useState, useEffect } from "react";
import { collection, addDoc, query, where, onSnapshot, orderBy, doc, setDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { FaTimes, FaCheck } from "react-icons/fa";
import "./ChatMembers.scss";

export default function ChatMembers({ habitatId, user, chatMember, setChatMember }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const chatId = [user.email, chatMember.email].sort().join("_");
    const chatRef = doc(db, `habitats/${habitatId}/conversations/${chatId}`);
    const messagesRef = collection(chatRef, "messages");

    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messages);
    });

    return () => unsubscribe();
  }, [habitatId, user.email, chatMember.email]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;

    const chatId = [user.email, chatMember.email].sort().join("_");
    const chatRef = doc(db, `habitats/${habitatId}/conversations/${chatId}`);
    const messagesRef = collection(chatRef, "messages");

    const message = {
      sender: user.email,
      message: newMessage,
      timestamp: new Date(),
    };

    // Adicionar conversa se não existir
    await setDoc(chatRef, {
      users: [user.email, chatMember.email],
    }, { merge: true });

    // Adicionar mensagem à conversa
    await addDoc(messagesRef, message);

    setNewMessage("");
  };

  return (
    <div className="chat-members">
      <header>
        <div className="chat-member-info">
          <img src={chatMember.profileImageUrl} alt={chatMember.name} />
          <div className="text">{chatMember.name}</div>
        </div>
        <button onClick={() => setChatMember({})}>
          <FaTimes size={20} />
        </button>
      </header>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender === user.email ? "sent" : "received"}`}>
            {msg.sender !== user.email && <img src={chatMember.profileImageUrl} alt={chatMember.name} className="profile-img" />}
            <p>{msg.message}</p>
            {msg.sender === user.email && <img src={user.profileImageUrl} alt={user.name} className="profile-img" />}
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