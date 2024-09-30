import React, { useState, useEffect } from "react";
import axios from "axios";
import { collection, addDoc, query, onSnapshot, orderBy, doc, setDoc, getDocs, where } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useHabitatUser } from "../../../../context/HabitatUserContext";
import { FaTimes, FaCheck } from "react-icons/fa";
import "./ChatContainer.scss";

export default function ChatContainer() {
  const { habitat, user, chatMember, chatGroup, chatBot, setChatMember, setChatGroup, setChatBot, setFade } = useHabitatUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [members, setMembers] = useState({});

  const chatType = chatMember?.id ? "member" : chatGroup?.id ? "group" : chatBot?.id ? "bot" : null;

  const chatId = chatType === "member" ? [user.email, chatMember.email].sort().join("_")
    : chatType === "group" ? chatGroup.id
    : chatType === "bot" ? chatBot.id
    : null;

  const chatImage = chatType === "member" ? chatMember.profileImageUrl
    : chatType === "group" ? chatGroup.imgUrl
    : chatType === "bot" ? chatBot.imageUrl
    : "";

  const chatName = chatType === "member" ? chatMember.name
    : chatType === "group" ? chatGroup.name
    : chatType === "bot" ? chatBot.name
    : "";

  useEffect(() => {
    if (!chatId) return;

    const chatRef = chatType === "member"
      ? doc(db, `habitats/${habitat.id}/conversations/${chatId}`)
      : chatType === "group"
      ? doc(db, `habitats/${habitat.id}/groups/${chatId}`)
      : doc(db, `habitats/${habitat.id}/avatars/${chatId}/messages/${user.email}`);

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
  }, [habitat.id, chatId, chatType]);

  useEffect(() => {
    if (chatType === "group") {
      const fetchMembers = async () => {
        const membersData = {};
        const q = query(collection(db, `habitats/${habitat.id}/members`));
        const querySnapshot = await getDocs(q);
        const emailSet = new Set();
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          membersData[data.email] = data;
          emailSet.add(data.email);
        });

        const userQuery = query(collection(db, "users"), where("email", "in", Array.from(emailSet)));
        const userSnapshot = await getDocs(userQuery);
        userSnapshot.forEach((doc) => {
          const data = doc.data();
          membersData[data.email].profileImageUrl = data.profileImageUrl;
        });

        setMembers(membersData);
      };

      fetchMembers();
    }
  }, [habitat.id, chatType]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;

    const chatRef = chatType === "bot"
      ? doc(db, `habitats/${habitat.id}/avatars/${chatId}/messages/${user.email}`)
      : chatType === "member"
      ? doc(db, `habitats/${habitat.id}/conversations/${chatId}`)
      : doc(db, `habitats/${habitat.id}/groups/${chatId}`);

    const messagesRef = collection(chatRef, "messages");

    const message = {
      sender: user.email,
      message: newMessage,
      timestamp: new Date(),
    };

    await addDoc(messagesRef, message);

    if (chatType === "bot") {
      try {
        const response = await axios.post("https://roko.flowfuse.cloud/talkwithifc", {
          msg: newMessage,
          avt: chatBot.avt,
        });

        const botReply = {
          sender: "bot",
          message: response.data.comandos[0].texto,
          timestamp: new Date(),
        };

        await addDoc(messagesRef, botReply);

        if (response.data.comandos[0].fade) {
          setFade(response.data.comandos[0].fade);
        }
      } catch (error) {
        console.error("Erro ao enviar mensagem para o bot: ", error);
      }
    }

    setNewMessage("");
  };

  if (!chatType || !chatId) {
    return null;
  }

  return (
    <div className="chat-container">
      <header>
        <div className="chat-header">
          <img src={chatImage} alt={chatName} className="profile-img" />
          <div className="text">{chatName}</div>
          <button
            onClick={() => {
              if (chatType === "member") setChatMember({});
              if (chatType === "group") setChatGroup({});
              if (chatType === "bot") setChatBot({});
            }}
          >
            <FaTimes size={20} />
          </button>
        </div>
      </header>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender === user.email ? "sent" : "received"}`}>
            {msg.sender !== user.email && chatType === "group" && (
              <img src={members[msg.sender]?.profileImageUrl} alt={msg.sender} className="profile-img" />
            )}
            <p>{msg.message}</p>
            {msg.sender === user.email && (
              <img src={user.profileImageUrl} alt={user.email} className="profile-img" />
            )}
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
