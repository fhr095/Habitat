import React from "react";
import { useHabitatUser } from "../../../../context/HabitatUserContext";

export default function ChatMembers({ member }) {
  const { setChatMember } = useHabitatUser();

  const handleSelectMember = () => {
    setChatMember(member);
  };

  return (
    <div className="member-item" onClick={handleSelectMember}>
      <img src={member.profileImageUrl} alt={member.name} />
      <div className="text">{member.name}</div>
    </div>
  );
}
