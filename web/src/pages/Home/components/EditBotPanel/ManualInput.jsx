// src/components/Access/EditBotPanel/ManualInput.jsx
import React, { useState, useRef, useEffect } from "react";
import { useSceneData } from "../../../../context/SceneDataContext";
import "./ManualInput.scss";

function sanitizeString(str) {
  if (!str) return "";
  return str.trim().replace(/[\s_]+/g, "_").toLowerCase();
}

/** Retorna todas as opções se typedValue for vazio, senão filtra */
function getFilteredFadeOptions(fadeOptions, typedValue, showAllIfEmpty = true) {
  const sanitizedTyped = sanitizeString(typedValue);
  if (!sanitizedTyped && showAllIfEmpty) {
    return fadeOptions;
  }
  return fadeOptions.filter((option) => {
    const sanitizedOption = sanitizeString(option.id);
    return sanitizedOption.includes(sanitizedTyped);
  });
}

function getNoMatchMessage(fadeOptions, typedFade) {
  if (!typedFade) return "";
  const exactMatch = fadeOptions.find((opt) => opt.id === typedFade);
  if (exactMatch) return "";
  return "Nenhum local com esse nome foi encontrado";
}

export default function ManualInput({ fadeOptions, botData, setBotData }) {
  const [newInfo, setNewInfo] = useState("");
  const [newFade, setNewFade] = useState("");
  const { highlightFade } = useSceneData();

  const [openSuggestions, setOpenSuggestions] = useState(false);
  const containerRef = useRef(null);

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFadeFocus = () => {
    setOpenSuggestions(true);
  };

  const handleFadeBlur = () => {
    // Fecha ao clicar fora
  };

  const handleFadeChange = (e) => {
    const fadeValue = e.target.value;
    setNewFade(fadeValue);
    // Se corresponder a um ID exato, chamar highlight
    const selectedFade = fadeOptions.find((option) => option.id === fadeValue);
    if (selectedFade) {
      highlightFade(fadeValue);
    }
  };

  const suggestions = openSuggestions
    ? getFilteredFadeOptions(fadeOptions, newFade, true)
    : [];

  const handleSelectSuggestion = (fadeId) => {
    setNewFade(fadeId);
    highlightFade(fadeId);
    setOpenSuggestions(false);
  };

  const handleNewInfoChange = (e) => {
    setNewInfo(e.target.value);
  };

  const handleAddInfo = () => {
    const trimmedInfo = newInfo.trim();
    const trimmedFade = newFade.trim();
    if (!trimmedInfo) {
      alert("Informe a informação antes de adicionar.");
      return;
    }
    // Se fade for livre, pode ser qualquer texto
    const selectedFadeData = fadeOptions.find((option) => option.id === trimmedFade);
    const newEntry = {
      fade: trimmedFade,
      info: trimmedInfo,
      name: selectedFadeData?.name || "",
    };

    setBotData({ ...botData, data: [...botData.data, newEntry] });
    setNewInfo("");
    setNewFade("");
  };

  return (
    <div className="add-info-block" ref={containerRef}>
      <div className="manual-fade-wrapper">
        <label>Fade (opcional):</label>
        <div className="manual-fade-autocomplete">
          <input
            type="text"
            placeholder="Digite ou selecione um fade"
            value={newFade}
            onFocus={handleFadeFocus}
            onBlur={handleFadeBlur}
            onChange={handleFadeChange}
          />
          {/* Lista de sugestões */}
          {suggestions.length > 0 && openSuggestions && (
            <ul className="manual-fade-suggestions">
              {suggestions.map((opt) => (
                <li key={opt.id} onMouseDown={() => handleSelectSuggestion(opt.id)}>
                  {opt.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        {getNoMatchMessage(fadeOptions, newFade) && (
          <div className="fade-warning">{getNoMatchMessage(fadeOptions, newFade)}</div>
        )}
      </div>

      <div className="manual-info-wrapper">
        <label>Informação:</label>
        <textarea
          name="info"
          placeholder="Digite a informação"
          value={newInfo}
          onChange={handleNewInfoChange}
        />
      </div>

      <button type="button" onClick={handleAddInfo}>
        Adicionar Informação
      </button>
    </div>
  );
}
