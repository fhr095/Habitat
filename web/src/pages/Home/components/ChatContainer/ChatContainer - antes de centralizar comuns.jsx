import React, { useEffect } from "react";
import ChatMembers from "../ChatMembers/ChatMembers";
import ChatGroups from "../ChatGroups/ChatGroups";
import ChatBots from "../ChatBots/ChatBots";
import { useHabitatUser } from "../../../../context/HabitatUserContext";

export default function ChatContainer() {
  const { chatMember, chatGroup, chatBot } = useHabitatUser();

  useEffect(() => {
    console.log("ChatContainer rendered");
    console.log("ChatMember:", chatMember);
    console.log("ChatGroup:", chatGroup);
    console.log("ChatBot:", chatBot);
  }, [chatMember, chatGroup, chatBot]);

  return (
    <>
      {chatMember.id && (
        <ChatMembers chatMember={chatMember} />
      )}
      {chatGroup.id && (
        <ChatGroups chatGroup={chatGroup} />
      )}
      {chatBot.id && (
        <ChatBots chatBot={chatBot} />
      )}
    </>
  );
}
