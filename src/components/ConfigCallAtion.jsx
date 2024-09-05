import React, { useEffect, useState } from "react";
import { db } from "../firebase"; // Certifique-se de que o caminho está correto
import { doc, getDoc, setDoc } from "firebase/firestore";
import "../styles/ConfigCallAction.scss";

export default function ConfigCallAction() {
    const [actionText, setActionText] = useState("");
    const [activate, setActivate] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const callActionRef = doc(db, "callAction", "seplag");
                const docSnap = await getDoc(callActionRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setActionText(data.actionText || "");
                    setActivate(data.activate || false);
                } else {
                    console.log("Nenhum documento encontrado!");
                }
            } catch (error) {
                console.error("Erro ao buscar dados: ", error);
            }
        };

        fetchData();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const callActionRef = doc(db, "callAction", "seplag");
            await setDoc(callActionRef, {
                actionText,
                activate
            }, { merge: true });
            alert("Dados salvos com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar dados: ", error);
            alert("Erro ao salvar dados.");
        }
    };

    return (
        <div className="config-call-action">
            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label htmlFor="actionText">Texto para chamada da ação:</label>
                    <input
                        type="text"
                        id="actionText"
                        name="actionText"
                        value={actionText}
                        onChange={(e) => setActionText(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="activate">
                        Ativar:
                        <input
                            type="checkbox"
                            id="activate"
                            name="activate"
                            checked={activate}
                            onChange={(e) => setActivate(e.target.checked)}
                        />
                    </label>
                </div>
                <button type="submit">Salvar</button>
            </form>
        </div>
    );
}