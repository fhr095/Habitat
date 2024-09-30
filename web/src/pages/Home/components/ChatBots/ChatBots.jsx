import React from "react";
import { useHabitatUser } from "../../../../context/HabitatUserContext";

export default function ChatBots({ bot }) {
  const { setChatBot } = useHabitatUser();

  const handleSelectBot = () => {
    setChatBot(bot);
  };

  return (
    <div className="bot-item" onClick={handleSelectBot}>
      <img src={bot.imageUrl} alt={bot.name} />
      <div className="text">{bot.name}</div>
    </div>
  );
}
