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
  // Obtém as opções de fade e a função de destaque do contexto unificado
  const { fadeOptions, highlightFade } = useSceneData();

  // Ajusta o estado inicial do bot, já incluindo o campo "avt"
  // selectedBot pode ser um objeto como { id: "...", name: "...", avt: "...", ... }
  const [botData, setBotData] = useState({
    name: "",
    personality: "",
    creativity: 1,
    context: "",
    //avt: selectedBot?.avt || "", // Se existir, preenche; caso contrário, vazio
    avt: "centroadm",
    data: [{ info: "", fade: "" }],
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Quando o componente monta ou o selectedBot muda, busca os dados do bot
  useEffect(() => {
    const fetchBotData = async () => {
      // Verifica se há um avt válido para evitar requisições desnecessárias
      if (!selectedBot?.avt) return;
      try {
        const response = await axios.get(
          /*`https://vps.felipehenriquerafael.tech/nodered/trainDataJSON?utm_source=${selectedBot.avt}`,*/
          `https://vps.felipehenriquerafael.tech/nodered/trainDataJSON?utm_source=centroadm`,
          {
            auth: { username, password },
          }
        );
        setBotData({
          ...response.data,
          // Garante que sempre tenha um array no mínimo com 1 objeto vazio
          data: response.data.data?.length > 0 ? response.data.data : [{ info: "", fade: "" }],
        });
      } catch (error) {
        console.error("Erro ao buscar dados do bot: ", error);
      }
    };

    fetchBotData();
  }, [selectedBot]);

  // Envia o botData atualizado para o endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Observação: aqui estamos garantindo que a propriedade "avt" exista
      // Se ela não existir, o endpoint pode não saber qual bot atualizar
      if (!botData.avt) {
        alert("Não foi possível atualizar. O identificador (avt) do bot está vazio.");
        return;
      }

      await axios.post("https://vps.felipehenriquerafael.tech/nodered/trainDataJSON", botData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
      });
      alert("Bot atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao editar bot: ", error);
      alert("Erro ao atualizar bot. Tente novamente.");
    }
  };

  // Atualiza as informações de fade e info no array de dados
  const handleInfoChange = (index, field, value) => {
    const newData = [...botData.data];
    newData[index][field] = value;

    if (field === "fade") {
      const selectedFade = fadeOptions.find((option) => option.id === value);
      // Armazena o nome do fade no campo 'name' (se quiser)
      newData[index].name = selectedFade?.name || "";

      if (value) {
        highlightFade(value); // Destaca o objeto ao alterar o fade
      }
    }

    setBotData({ ...botData, data: newData });
  };

  // Remove um item do array de dados
  const handleRemoveInfo = (index) => {
    const newData = botData.data.filter((_, i) => i !== index);
    setBotData({ ...botData, data: newData });
  };

  // Filtra a lista de dados pelo termo de busca (fade ou info)
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
          {/* ManualInput para adicionar itens à lista de data */}
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
              onClick={() => handleRemoveInfo(index)}
            >
              <FaTrash className="delete-icon" />
            </button>
          </div>
        ))}

        <button type="submit">Atualizar Bot</button>
      </form>
    </div>
  );
}
