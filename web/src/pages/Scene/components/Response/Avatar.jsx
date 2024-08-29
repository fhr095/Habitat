import React from "react";

export default function Avatar({ animation }) {
  const gifUrl = animation === "pensando"
    ? "/Avatar/falando.gif"
    : "/Avatar/falando.gif";

  return (
    <div className="avatar-container">
      <img src={gifUrl} alt="Avatar Animation" className="avatar-gif" />
    </div>
  );
}
