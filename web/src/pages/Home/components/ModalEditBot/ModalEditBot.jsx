import React, { useEffect, useState, Suspense, useRef } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Loader } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import "./ModalEditBot.scss";

const username = "habitat";
const password = "lobomau";

export default function ModalEditBot({ selectedBot, glbFileUrl, onClose }) {
    const [botData, setBotData] = useState({
        name: "",
        personality: "",
        creativity: 1,
        context: "",
        avt: selectedBot,
        data: [{ info: "", fade: "" }]
    });
    const [modelParts, setModelParts] = useState([]);
    const [highlightedPart, setHighlightedPart] = useState("");

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

    const handleAddInfo = () => {
        setBotData({ ...botData, data: [...botData.data, { info: "", fade: "" }] });
    };

    const handleRemoveInfo = (index) => {
        const newData = botData.data.filter((_, i) => i !== index);
        setBotData({ ...botData, data: newData });
    };

    const handlePartSelect = (part) => {
        setHighlightedPart(part);
    };

    const handleClose = () => {
        setHighlightedPart(""); // Reseta a parte destacada ao fechar
        onClose();
    };

    function Model({ url }) {
        const gltf = useLoader(GLTFLoader, url);
        const modelRef = useRef();

        useFrame(() => {
            if (modelRef.current) {
                modelRef.current.rotation.y += 0.01; // Adjust the rotation speed as needed
            }
        });

        useEffect(() => {
            setModelParts(Object.keys(gltf.nodes));
            // Ajusta a rotação inicial do modelo
            if (modelRef.current) {
                modelRef.current.rotation.x = Math.PI; // Rotaciona o modelo em 180 graus no eixo X
            }
        }, [gltf]);

        return (
            <group ref={modelRef}>
                {Object.keys(gltf.nodes).map((part) => (
                    <mesh
                        key={part}
                        geometry={gltf.nodes[part].geometry}
                        material={gltf.nodes[part].material}
                        material-transparent={highlightedPart !== part}
                        material-opacity={highlightedPart === part ? 1 : 0.2}
                        material-color={highlightedPart === part ? "red" : gltf.nodes[part].material?.color}
                    />
                ))}
            </group>
        );
    }

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
                                value={botData.name}
                                onChange={(e) => setBotData({ ...botData, name: e.target.value })}
                                required
                            />
                        </label>
                        <label>
                            Personalidade:
                            <input
                                type="text"
                                value={botData.personality}
                                onChange={(e) => setBotData({ ...botData, personality: e.target.value })}
                                required
                            />
                        </label>
                        <label>
                            Criatividade:
                            <input
                                type="number"
                                value={botData.creativity}
                                onChange={(e) => setBotData({ ...botData, creativity: parseInt(e.target.value) })}
                                required
                            />
                        </label>
                        <label>
                            Contexto:
                            <textarea
                                value={botData.context}
                                onChange={(e) => setBotData({ ...botData, context: e.target.value })}
                                required
                            />
                        </label>
                    </div>
                    <div className="form-section">
                        {botData.data.map((item, index) => (
                            <div key={index} className="info-section">
                                <label>
                                    Info:
                                    <input
                                        type="text"
                                        value={item.info}
                                        onChange={(e) => handleInfoChange(index, "info", e.target.value)}
                                        required
                                    />
                                </label>
                                <label>
                                    Fade:
                                    <select
                                        value={item.fade}
                                        onChange={(e) => {
                                            handleInfoChange(index, "fade", e.target.value);
                                            handlePartSelect(e.target.value);
                                        }}
                                        required
                                    >
                                        <option value="">Selecione uma parte</option>
                                        {modelParts.map((part, i) => (
                                            <option key={i} value={part}>{part}</option>
                                        ))}
                                    </select>
                                </label>
                                <button type="button" onClick={() => handleRemoveInfo(index)}>Remover</button>
                            </div>
                        ))}
                        <button className="info-button" type="button" onClick={handleAddInfo}>Adicionar Info</button>
                    </div>
                    <div className="model-viewer">
                        <Suspense fallback={<Loader />}>
                            <Canvas>
                                <ambientLight intensity={0.5} />
                                <directionalLight position={[10, 10, 5]} intensity={1} />
                                <Model url={glbFileUrl} />
                                <OrbitControls enableZoom={true} enablePan={true} />
                            </Canvas>
                        </Suspense>
                    </div>
                    <button type="submit">Atualizar Bot</button>
                </form>
            </div>
        </div>
    );
}