// src/components/Access/EditBotPanel/EditBotPanel.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./EditBotPanel.scss";
import { FaSearch, FaTrash } from "react-icons/fa";
import { useSceneData } from "../../../../context/SceneDataContext";
import ManualInput from "./ManualInput";

const username = "habitat";
const password = "lobomau";

export default function EditBotPanel({ selectedBot, ifcFileUrl }) {
  // Antes: const { fadeOptions } = useFades();
  //       const { highlightFade } = useSceneActions();
  // Agora:
  const { fadeOptions, highlightFade } = useSceneData();
  console.log(selectedBot)

  const [botData, setBotData] = useState({
    name: "",
    personality: "",
    creativity: 1,
    context: "",
    avt: selectedBot.avt,
    data: [{ info: "", fade: ""}]
  });

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBotData = async () => {
      if (!selectedBot) return;
      try {
        const response = await axios.get(
          `https://vps.felipehenriquerafael.tech/nodered/trainDataJSON?utm_source=${selectedBot}`,
          {
            auth: { username, password }
          }
        );
        setBotData({
          ...response.data,
          data: response.data.data || [{ info: "", fade: ""}]
        });
      } catch (error) {
        console.error("Erro ao buscar dados do bot: ", error);
      }
    };

    fetchBotData();
  }, [selectedBot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        console.log(botData)
      await axios.post("https://vps.felipehenriquerafael.tech/nodered/trainDataJSON", botData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${username}:${password}`)}`
        }
      });
      alert("Bot atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao editar bot: ", error);
      alert("Erro ao atualizar bot. Tente novamente.");
    }
  };

  const handleInfoChange = (index, field, value) => {
    const newData = [...botData.data];
    newData[index][field] = value;

    if (field === "fade") {
      const selectedFade = fadeOptions.find(option => option.id === value);
      newData[index].name = selectedFade?.name || "";
      if (value) {
        highlightFade(value); // Destaca o objeto ao alterar o fade
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

  const filteredData = botData.data.filter(
    (item) =>
      (item.fade && item.fade.toLowerCase().includes(searchTerm)) ||
      (item.info && item.info.toLowerCase().includes(searchTerm))
  );

  return (
    <div className="edit-bot-panel">
      <div className="panel-header">
        <h2>Editar Bot</h2>
      </div>
      <form onSubmit={handleSubmit} className="panel-content">
        <div className="form-section">
          <label>
            Nome do Bot:
            <input
              type="text"
              value={botData.name || ""}
              onChange={(e) => setBotData({ ...botData, name: e.target.value })}
              required
            />
          </label>
          <label>
            Personalidade:
            <input
              type="text"
              value={botData.personality || ""}
              onChange={(e) => setBotData({ ...botData, personality: e.target.value })}
              required
            />
          </label>
          <label>
            Criatividade:
            <input
              type="number"
              value={botData.creativity || 1}
              onChange={(e) =>
                setBotData({ ...botData, creativity: parseInt(e.target.value, 10) })
              }
              required
            />
          </label>
          <label>
            Contexto:
            <textarea
              value={botData.context || ""}
              onChange={(e) => setBotData({ ...botData, context: e.target.value })}
              required
            />
          </label>
        </div>

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

        <div className="form-section">
          <p>Aqui você pode adicionar novas informações manualmente associadas a um fade:</p>
          <ManualInput fadeOptions={fadeOptions} botData={botData} setBotData={setBotData} />
        </div>

        <h3>Fades e Informações</h3>
        {filteredData.map((item, index) => (
          <div key={index} className="fade-info-block">
            <label>
              Fade:
              <select
                name="fade"
                value={item.fade || ""}
                onChange={(e) => handleInfoChange(index, "fade", e.target.value)}
              >
                <option value="">Selecione um fade</option>
                {fadeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Informação:
              <input
                type="text"
                name="info"
                value={item.info || ""}
                onChange={(e) => handleInfoChange(index, "info", e.target.value)}
              />
            </label>

            <button
              type="button"
              className="delete-button"
              onClick={() => handleRemoveInfo(botData.data.indexOf(item))}
            >
              <FaTrash className="delete-icon" />
              Excluir
            </button>
          </div>
        ))}

        <button type="submit">Atualizar Bot</button>
      </form>
    </div>
  );
}
