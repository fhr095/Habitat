import React, { useState, useEffect } from "react";
import { collection, addDoc, query, onSnapshot, orderBy, doc, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import { FaCheck, FaTimes } from "react-icons/fa";

import "./ChatGroups.scss";

export default function ChatGroups({ habitatId, user, group, setChatGroup }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [members, setMembers] = useState({});

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

  useEffect(() => {
    const fetchMembers = async () => {
      const membersData = {};
      const q = query(collection(db, `habitats/${habitatId}/members`));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        membersData[data.email] = data;
      });
      setMembers(membersData);
    };

    fetchMembers();
  }, [habitatId]);

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
          <div className="text">{group.name}</div>
        </div>
        <button onClick={() => setChatGroup({})}>
          <FaTimes size={20} />
        </button>
      </header>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender === user.email ? "sent" : "received"}`}>
            {msg.sender !== user.email && <img src={members[msg.sender]?.profileImageUrl} alt={msg.sender} className="profile-img" />}
            <p>{msg.message}</p>
            {msg.sender === user.email && <img src={user.profileImageUrl} alt={user.email} className="profile-img" />}
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
        <button onClick={handleSendMessage}>
          <FaCheck size={20} />
        </button>
      </footer>
    </div>
  );
}