import React, { useEffect } from "react";

export default function Message({ message }) {

  useEffect(() => {
    if(message){
      console.log(message);
    }
  }, [message]);

  return (
    <div className="text">
      <p>{message}</p>
    </div>
  );
}
