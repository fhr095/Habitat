import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase"; // Certifique-se de ajustar o caminho para o seu arquivo de configuração do Firebase

export default function AccessConfig({ habitatId }) {
    const [emailInput, setEmailInput] = useState("");
    const [userEmails, setUserEmails] = useState([]);
    const [accessEmails, setAccessEmails] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            const querySnapshot = await getDocs(collection(db, "users"));
            const emails = querySnapshot.docs.map(doc => doc.data().email);
            setUserEmails(emails);
        };

        const fetchAccessList = async () => {
            const habitatDocRef = doc(db, "habitats", habitatId);
            const habitatDoc = await getDoc(habitatDocRef);
            if (habitatDoc.exists()) {
                setAccessEmails(habitatDoc.data().accessList || []);
            }
        };

        fetchUsers();
        fetchAccessList();
    }, [habitatId]);

    const handleAddEmail = async () => {
        if (userEmails.includes(emailInput)) {
            try {
                const habitatDocRef = doc(db, "habitats", habitatId);
                const habitatDoc = await getDoc(habitatDocRef);
                
                // Verifica se o campo accessList existe
                let currentAccessList = habitatDoc.exists() && habitatDoc.data().accessList ? habitatDoc.data().accessList : [];

                await setDoc(habitatDocRef, {
                    accessList: [...currentAccessList, emailInput]
                }, { merge: true });

                setAccessEmails(prevEmails => [...prevEmails, emailInput]);
                setEmailInput("");
                setError("");
            } catch (error) {
                setError("Erro ao adicionar email à lista de acesso.");
            }
        } else {
            setError("Email não cadastrado na tabela de usuários.");
        }
    };

    return (
        <div className="components-container">
            <h2>Configuração de Acesso</h2>
            <p>Adicione os emails daqueles que terão acesso a esta página:</p>
            <div className="email-input-container">
                <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Digite o email"
                />
                <button onClick={handleAddEmail}>Adicionar</button>
            </div>
            {error && <p className="error-message">{error}</p>}
            <div className="access-emails-list">
                <h3>Emails com acesso:</h3>
                <ul>
                    {accessEmails.map((email, index) => (
                        <li key={index}>{email}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}