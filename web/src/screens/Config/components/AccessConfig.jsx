import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase"; // Certifique-se de ajustar o caminho para o seu arquivo de configuração do Firebase
import { Button, Form, InputGroup, ListGroup } from "react-bootstrap";

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

    const handleCopyLink = () => {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl).then(() => {
            alert("Link copiado para a área de transferência!");
        }, (err) => {
            console.error("Erro ao copiar o link: ", err);
        });
    };

    return (
        <div className="components-container container mt-3">
            <h2>Configuração de Acesso</h2>
            <p>Adicione os emails daqueles que terão acesso a esta página:</p>
            <InputGroup className="mb-3">
                <Form.Control
                    type="text"
                    value={window.location.href}
                    readOnly
                />
                <Button variant="outline-secondary" onClick={handleCopyLink}>
                    Copiar Link
                </Button>
            </InputGroup>
            <InputGroup className="mb-3">
                <Form.Control
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Digite o email"
                />
                <Button variant="outline-secondary" onClick={handleAddEmail}>Adicionar</Button>
            </InputGroup>
            {error && <p className="text-danger">{error}</p>}
            <div className="access-emails-list">
                <h3>Emails com acesso:</h3>
                <ListGroup>
                    {accessEmails.map((email, index) => (
                        <ListGroup.Item key={index}>{email}</ListGroup.Item>
                    ))}
                </ListGroup>
            </div>
        </div>
    );
}