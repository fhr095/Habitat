import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import "./ModalEditBot.scss";
import Scene from "./Scene";

const username = "habitat";
const password = "lobomau";

export default function ModalEditBot({ selectedBot, ifcFileUrl, onClose }) {
    const [botData, setBotData] = useState({
        name: "",
        personality: "",
        creativity: 1,
        context: "",
        avt: selectedBot,
        data: [{ info: "", fade: "", name: "" }]
    });
    const [fade, setFade] = useState({});

    useEffect(() => {
        const fetchBotData = async () => {
            try {
                const response = await axios.get(`https://roko.flowfuse.cloud/trainDataJSON?utm_source=${selectedBot}`, {
                    auth: {
                        username,
                        password
                    }
                });
                setBotData(response.data);
            } catch (error) {
                console.error("Erro ao buscar dados do bot: ", error);
            }
        };

        fetchBotData();
    }, [selectedBot]);

    useEffect(() => {
        if (fade.id) {
            setBotData((prevData) => ({
                ...prevData,
                data: [...prevData.data, { info: "", fade: fade.id, name: fade.name }]
            }));
        }
    }, [fade]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("https://roko.flowfuse.cloud/trainDataJSON", botData, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${btoa(`${username}:${password}`)}`
                }
            });
            alert("Bot atualizado com sucesso!");
            handleClose();
        } catch (error) {
            console.error("Erro ao editar bot: ", error);
            alert("Erro ao atualizar bot. Tente novamente.");
        }
    };

    const handleInfoChange = (index, field, value) => {
        const newData = [...botData.data];
        newData[index][field] = value;
        setBotData({ ...botData, data: newData });
    };

    const handleRemoveInfo = (index) => {
        const newData = botData.data.filter((_, i) => i !== index);
        setBotData({ ...botData, data: newData });
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <div className="edit-bot-page">
            <div className="page-content">
                <span className="close" onClick={handleClose}><FaTimes /></span>
                <h2>Editar Bot</h2>
                <form onSubmit={handleSubmit}>
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
                                onChange={(e) => setBotData({ ...botData, creativity: parseInt(e.target.value) })}
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
                    <div className="form-section">
                        <p>Digite: "Você está aqui" e selecione um local no modelo caso queira definir um ponto inicial para quem for visualizar</p>
                        {botData.data && botData.data.length > 0 ? (
                            botData.data.map((item, index) => (
                                <div key={index} className="info-section">
                                    <label>
                                        Info:
                                        <input
                                            type="text"
                                            value={item.info || ""}
                                            onChange={(e) => handleInfoChange(index, "info", e.target.value)}
                                            required
                                        />
                                    </label>
                                    <label>
                                        Nome do Fade:
                                        <input
                                            type="text"
                                            value={item.name || ""}
                                            readOnly
                                        />
                                    </label>
                                    <button type="button" onClick={() => handleRemoveInfo(index)}>Remover</button>
                                </div>
                            ))
                        ) : (
                            <p>Nenhuma informação disponível</p>
                        )}
                    </div>
                    <div className="model-viewer">
                        <Scene ifcFileUrl={ifcFileUrl} setFade={setFade} />
                    </div>
                    <button type="submit">Atualizar Bot</button>
                </form>
            </div>
        </div>
    );
}