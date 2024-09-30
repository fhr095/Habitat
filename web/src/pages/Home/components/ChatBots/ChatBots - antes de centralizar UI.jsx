import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaCheck } from "react-icons/fa";
import { collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../../../firebase";
import "./ChatBots.scss";
import { useHabitatUser } from "../../../../context/HabitatUserContext"; // Importando o contexto

export default function ChatBots() {
  const { habitat, user, chatBot, setChatBot, setFade } = useHabitatUser(); // Acessando o contexto
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const userMessagesRef = collection(db, `habitats/${habitat.id}/avatars/${chatBot.id}/messages/${user.email}/userMessages`);
    const q = query(userMessagesRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messages);
    });

    return () => unsubscribe();
  }, [habitat.id, chatBot.id, user.email]);

  const sendMessage = async (message) => {
    try {
      const response = await axios.post("https://roko.flowfuse.cloud/talkwithifc", {
        msg: message,
        avt: chatBot.avt
      });

      const userMessage = {
        sender: user.email,
        message,
        timestamp: new Date(),
      };

      const userMessagesRef = collection(db, `habitats/${habitat.id}/avatars/${chatBot.id}/messages/${user.email}/userMessages`);
      
      // Adicionar a mensagem do usuário ao Firestore
      await addDoc(userMessagesRef, userMessage);

      // Processar e adicionar todas as respostas do bot ao Firestore
      response.data.comandos.forEach(async (comando) => {
        const botReply = {
          sender: "bot",
          message: comando.texto,
          timestamp: new Date(),
        };
        await addDoc(userMessagesRef, botReply);

        // Enviar valor fade para setFade se existir
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
          <img src={chatBot.imageUrl} alt={chatBot.name} />
          <div className="text">{chatBot.name}</div>
        </div>
        <button onClick={() => setChatBot({})}>
          <FaTimes size={20} />
        </button>
      </header>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === user.email ? "sent" : "received"}`}>
            {msg.sender !== user.email && <img src={chatBot.imageUrl} alt="Bot" className="profile-img" />}
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
