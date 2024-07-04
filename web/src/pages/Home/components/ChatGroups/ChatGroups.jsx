import React, { useState, useEffect } from "react";
import { collection, addDoc, query, onSnapshot, orderBy, doc } from "firebase/firestore";
import { db } from "../../../../firebase";
import "./ChatGroups.scss";

export default function ChatGroups({ habitatId, user, group, setChatGroup }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const chatRef = doc(db, `habitats/${habitatId}/groups/${group.id}`);
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
  }, [habitatId, group.id]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;

    const chatRef = doc(db, `habitats/${habitatId}/groups/${group.id}`);
    const messagesRef = collection(chatRef, "messages");

    const message = {
      sender: user.email,
      message: newMessage,
      timestamp: new Date(),
    };

    await addDoc(messagesRef, message);
    setNewMessage("");
  };

  return (
    <div className="chat-groups">
      <header>
        <div className="chat-group-info">
          <img src={group.imgUrl} alt={group.name} />
          <p>{group.name}</p>
        </div>
        <button onClick={() => setChatGroup({})}>✖</button>
      </header>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender === user.email ? "sent" : "received"}`}>
            <p>{msg.message}</p>
          </div>
        ))}
      </div>
      <footer>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={handleSendMessage}>Send</button>
      </footer>
    </div>
  );
}