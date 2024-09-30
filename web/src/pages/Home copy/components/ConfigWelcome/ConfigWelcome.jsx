import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import "./ConfigWelcome.scss";

export default function ConfigWelcome({ habitat }) {
  const [text, setText] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    const fetchWelcomeData = async () => {
      const welcomeRef = doc(db, `habitats/${habitat.id}/welcome/welcomeData`);
      const welcomeDoc = await getDoc(welcomeRef);
      if (welcomeDoc.exists()) {
        const data = welcomeDoc.data();
        setText(data.text);
        setActive(data.active);
      }
    };

    fetchWelcomeData();
  }, [habitat.id]);

  const handleSave = async () => {
    const welcomeRef = doc(db, `habitats/${habitat.id}/welcome/welcomeData`);
    await setDoc(welcomeRef, { text, active });
    alert("Mensagem de boas-vindas salva com sucesso!");
  };

  return (
    <div className="config-welcome-container">
      <h3>Configurar Mensagem de Boas-vindas</h3>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <label>
        Ativo
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
      </label>
      <button onClick={handleSave}>Salvar</button>
    </div>
  );
}