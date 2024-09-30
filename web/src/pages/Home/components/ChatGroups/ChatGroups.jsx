import React from "react";
import { useHabitatUser } from "../../../../context/HabitatUserContext";

export default function ChatGroups({ group }) {
  const { setChatGroup } = useHabitatUser();

  const handleSelectGroup = () => {
    setChatGroup(group);
  };

  return (
    <div className="group-item" onClick={handleSelectGroup}>
      <img src={group.imgUrl} alt={group.name} />
      <div className="text">{group.name}</div>
    </div>
  );
}
