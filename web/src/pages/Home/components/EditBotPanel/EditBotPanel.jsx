// src/components/Access/EditBotPanel/EditBotPanel.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./EditBotPanel.scss";
import { FaSearch, FaTrash } from "react-icons/fa";
import { useSceneData } from "../../../../context/SceneDataContext";
import ManualInput from "./ManualInput";

// Sanitiza strings para comparação parcial
function sanitizeString(str) {
  if (!str) return "";
  return str.trim().replace(/[\s_]+/g, "_").toLowerCase();
}

/**
 * Se typedValue estiver vazio, retornamos todas as fadeOptions (showAllIfEmpty = true).
 * Senão, filtramos as opções cujo id (sanitizado) inclua typedValue (sanitizado).
 */
function getFilteredFadeOptions(fadeOptions, typedValue, showAllIfEmpty = true) {
  const sanitizedTyped = sanitizeString(typedValue);
  if (!sanitizedTyped && showAllIfEmpty) {
    return fadeOptions; // todas
  }
  return fadeOptions.filter((option) => {
    const sanitizedOption = sanitizeString(option.id);
    return sanitizedOption.includes(sanitizedTyped);
  });
}

// Tenta mapear fadeValue para algum id de fadeOptions se sanitizado bater. Senao devolve o valor livre.
function matchFadeNameToId(fadeOptions, fadeValue) {
  if (!fadeValue) return "";
  const sanitizedValue = sanitizeString(fadeValue);
  for (let option of fadeOptions) {
    const sanitizedOptionId = sanitizeString(option.id);
    if (sanitizedOptionId.includes(sanitizedValue)) {
      return option.id;
    }
  }
  return fadeValue;
}

// Retorna "" se encontrar correspondência exata, senão retorna mensagem de aviso
function getNoMatchMessage(fadeOptions, typedFade) {
  if (!typedFade) return "";
  const exactMatch = fadeOptions.find((opt) => opt.id === typedFade);
  if (exactMatch) return "";
  return "Nenhum local com esse nome foi encontrado";
}

export default function EditBotPanel({ selectedBot, ifcFileUrl }) {
  const { fadeOptions, highlightFade } = useSceneData();

  // Estado principal do bot
  const [botData, setBotData] = useState({
    name: "",
    personality: "",
    creativity: 1,
    context: "",
    avt: "centroadm",
    data: [{ info: "", fade: "" }],
  });

  // Guarda o estado inicial para comparar e destacar mudanças
  const [initialBotData, setInitialBotData] = useState(null);

  // Campo de busca
  const [searchTerm, setSearchTerm] = useState("");

  // Qual índice de item está com a lista de sugestões aberta
  const [openSuggestionsIndex, setOpenSuggestionsIndex] = useState(null);

  // Ref do container para fechar no clique externo
  const containerRef = useRef(null);

  useEffect(() => {
    // Fecha a lista caso clique fora do containerRef
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenSuggestionsIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Carrega dados do bot
  useEffect(() => {
    const fetchBotData = async () => {
      if (!selectedBot?.avt) return;
      try {
        const response = await axios.get(
          `https://vps.felipehenriquerafael.tech/nodered/trainDataJSON?utm_source=centroadm`,
          {
            auth: { username: "habitat", password: "lobomau" },
          }
        );
        const newBotData = { ...response.data };

        if (!newBotData.data || newBotData.data.length === 0) {
          newBotData.data = [{ info: "", fade: "" }];
        }
        // Mapeia cada fade pro id real (se possível)
        newBotData.data = newBotData.data.map((item) => ({
          ...item,
          fade: matchFadeNameToId(fadeOptions, item.fade),
        }));

        setBotData(newBotData);
        setInitialBotData(JSON.parse(JSON.stringify(newBotData)));
      } catch (error) {
        console.error("Erro ao buscar dados do bot:", error);
      }
    };
    fetchBotData();
  }, [selectedBot, fadeOptions]);

  // Submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!botData.avt) {
        alert("Não foi possível atualizar. O identificador (avt) do bot está vazio.");
        return;
      }
      await axios.post("https://vps.felipehenriquerafael.tech/nodered/trainDataJSON", botData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa("habitat:lobomau")}`,
        },
      });
      alert("Bot atualizado com sucesso!");
      // Reinicializa o estado inicial
      setInitialBotData(JSON.parse(JSON.stringify(botData)));
    } catch (error) {
      console.error("Erro ao editar bot:", error);
      alert("Erro ao atualizar bot. Tente novamente.");
    }
  };

  // Checa se o campo (fade ou info) foi modificado
  function isModified(realIndex, field) {
    if (!initialBotData) return false;
    if (!initialBotData.data[realIndex]) return true;
    return botData.data[realIndex][field] !== initialBotData.data[realIndex][field];
  }

  // Atualiza fade ou info
  const handleInfoChange = (index, field, value) => {
    const newData = [...botData.data];
    newData[index][field] = value;
    if (field === "fade") {
      // Se for ID exato, destaca
      const selectedFade = fadeOptions.find((opt) => opt.id === value);
      newData[index].name = selectedFade?.name || "";
      if (selectedFade) {
        highlightFade(value);
      }
    }
    setBotData({ ...botData, data: newData });
  };

  const handleRemoveInfo = (index) => {
    const newData = botData.data.filter((_, i) => i !== index);
    setBotData({ ...botData, data: newData });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Filtra a lista para exibir
  const filteredData = botData.data.filter((item) => {
    const fade = item.fade?.toLowerCase() || "";
    const info = item.info?.toLowerCase() || "";
    return fade.includes(searchTerm) || info.includes(searchTerm);
  });

  // Abertura das sugestões ao focar no input
  const handleFadeFocus = (index) => {
    setOpenSuggestionsIndex(index);
  };

  /**
   * Fechamos a dropdown no blur, mas usando setTimeout
   * para permitir clique nas sugestões (que usam onMouseDown).
   */
  const handleFadeBlur = (index) => {
    setTimeout(() => {
      if (openSuggestionsIndex === index) {
        setOpenSuggestionsIndex(null);
      }
    }, 150);
  };

  // Selecionar sugestão via clique
  const handleSelectSuggestion = (index, fadeId) => {
    const newData = [...botData.data];
    newData[index].fade = fadeId;
    const option = fadeOptions.find((opt) => opt.id === fadeId);
    newData[index].name = option?.name || "";
    highlightFade(fadeId);
    setBotData({ ...botData, data: newData });
    setOpenSuggestionsIndex(null);
  };

  return (
    <div className="edit-bot-panel" ref={containerRef}>
      <div className="panel-header">
        <h2>Editar Bot</h2>
      </div>

      <form onSubmit={handleSubmit} className="panel-content">
        {/* Cabeçalho do Bot */}
        <div className="form-section">
          <label>
            Nome do Bot:
            <input
              type="text"
              value={botData.name || ""}
              onChange={(e) => setBotData({ ...botData, name: e.target.value })}
              required
              className={
                initialBotData && botData.name !== initialBotData.name ? "modified" : ""
              }
            />
          </label>

          <label>
            Personalidade:
            <input
              type="text"
              value={botData.personality || ""}
              onChange={(e) => setBotData({ ...botData, personality: e.target.value })}
              required
              className={
                initialBotData && botData.personality !== initialBotData.personality
                  ? "modified"
                  : ""
              }
            />
          </label>

          <label>
            Criatividade:
            <input
              type="number"
              value={botData.creativity || 1}
              onChange={(e) =>
                setBotData({
                  ...botData,
                  creativity: parseInt(e.target.value, 10),
                })
              }
              required
              className={
                initialBotData && botData.creativity !== initialBotData.creativity
                  ? "modified"
                  : ""
              }
            />
          </label>

          <label>
            Contexto:
            <textarea
              value={botData.context || ""}
              onChange={(e) => setBotData({ ...botData, context: e.target.value })}
              required
              className={
                initialBotData && botData.context !== initialBotData.context
                  ? "modified"
                  : ""
              }
            />
          </label>
        </div>

        {/* Barra de busca */}
        <h4>Pesquisar por Fade ou Informação:</h4>
        <div className="search-block">
          <input
            type="text"
            placeholder="Digite o termo de pesquisa"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <FaSearch className="search-icon" />
        </div>

        {/* ManualInput: adiciona novos itens */}
        <div className="form-section">
          <p>Aqui você pode adicionar novas informações manualmente associadas a um fade:</p>
          <ManualInput fadeOptions={fadeOptions} botData={botData} setBotData={setBotData} />
        </div>

        {/* Lista de dados: Fades e Infos */}
        <h3>Fades e Informações</h3>
        {filteredData.map((item, idxFiltered) => {
          // Índice real no botData
          const realIndex = botData.data.findIndex((d) => d === item);

          // Se esse item estiver em foco, listamos as opções
          const fadeSuggestions =
            openSuggestionsIndex === realIndex
              ? getFilteredFadeOptions(fadeOptions, item.fade, true)
              : [];

          return (
            <div key={realIndex} className="fade-info-block">
              {/* Campo Fade */}
              <div className="field-fade">
                <label>Fade:</label>
                <div
                  className={`fade-autocomplete-wrapper ${
                    isModified(realIndex, "fade") ? "modified" : ""
                  }`}
                >
                  <input
                    type="text"
                    value={item.fade || ""}
                    onFocus={() => handleFadeFocus(realIndex)}
                    onBlur={() => handleFadeBlur(realIndex)}
                    onChange={(e) => handleInfoChange(realIndex, "fade", e.target.value)}
                  />
                  {fadeSuggestions.length > 0 && (
                    <ul className="fade-suggestions">
                      {fadeSuggestions.map((option) => (
                        <li
                          key={option.id}
                          onMouseDown={() => handleSelectSuggestion(realIndex, option.id)}
                        >
                          {option.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Mensagem de aviso se não tiver correspondência exata */}
                {getNoMatchMessage(fadeOptions, item.fade) && (
                  <div className="fade-warning">
                    {getNoMatchMessage(fadeOptions, item.fade)}
                  </div>
                )}
              </div>

              {/* Campo Info (textarea) */}
              <div className="field-info">
                <label>Informação:</label>
                <textarea
                  name="info"
                  value={item.info || ""}
                  onChange={(e) => handleInfoChange(realIndex, "info", e.target.value)}
                  className={isModified(realIndex, "info") ? "modified" : ""}
                />
              </div>

              <button
                type="button"
                className="delete-button"
                onClick={() => handleRemoveInfo(realIndex)}
              >
                <FaTrash className="delete-icon" />
              </button>
            </div>
          );
        })}

        <button type="submit">Atualizar Bot</button>
      </form>
    </div>
  );
}
