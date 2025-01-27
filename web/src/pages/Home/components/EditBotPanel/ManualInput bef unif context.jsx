// src/components/Access/EditBotPanel/ManualInput.jsx
import React, { useState } from "react";
import { useSceneActions } from "../../../../context/SceneContext";
import "./ManualInput.scss";

export default function ManualInput({ fadeOptions, botData, setBotData }) {
  const [newInfo, setNewInfo] = useState("");
  const [selectedFade, setSelectedFade] = useState("");
  const { highlightFade } = useSceneActions();

  const handleNewInfoChange = (e) => {
    setNewInfo(e.target.value);
  };

  const handleFadeChange = (e) => {
    const fadeId = e.target.value;
    console.log("handleFadeChange chamado com fadeId:", fadeId);
    setSelectedFade(fadeId);
    if (fadeId && typeof highlightFade === 'function') {
      console.log("Chamando highlightFade com fadeId:", fadeId);
      highlightFade(fadeId);
    }
  };
  

  const handleAddInfo = () => {
    if (!newInfo.trim() || !selectedFade.trim()) {
      alert("Informe a informação e selecione um fade.");
      return;
    }

    const selectedFadeData = fadeOptions.find((option) => option.id === selectedFade);
    const newEntry = {
      fade: selectedFade,
      info: newInfo,
      name: selectedFadeData?.name || "",
    };

    setBotData({ ...botData, data: [...botData.data, newEntry] });
    setNewInfo("");
    setSelectedFade("");
  };

  return (
    <div className="add-info-block">
      <select value={selectedFade} onChange={handleFadeChange}>
        <option value="">Selecione um Fade</option>
        {fadeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="info"
        placeholder="Digite a informação"
        value={newInfo}
        onChange={handleNewInfoChange}
      />
      <button type="button" onClick={handleAddInfo}>
        Adicionar Informação
      </button>
    </div>
  );
}
