import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../firebase";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import "../styles/Habitat.scss";

export default function Habitat() {
    const [habitats, setHabitats] = useState([]);
    const [habitatName, setHabitatName] = useState('');
    const [glbFile, setGlbFile] = useState(null);
    const auth = getAuth();
    const user = auth.currentUser;

    useEffect(() => {
        if (user) {
            fetchHabitats(user.email);
        }
    }, [user]);

    const fetchHabitats = async (email) => {
        const q = query(collection(db, "habitats"), where("userEmail", "==", email));
        const querySnapshot = await getDocs(q);
        const fetchedHabitats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHabitats(fetchedHabitats);
    };

    const handleHabitatNameChange = (e) => {
        setHabitatName(e.target.value);
    };

    const handleGlbFileChange = (e) => {
        setGlbFile(e.target.files[0]);
    };

    const handleCreateHabitat = async () => {
        if (!habitatName || !glbFile) {
            alert("Por favor, preencha o nome do habitat e selecione um arquivo GLB.");
            return;
        }

        const glbRef = ref(storage, `habitats/${habitatName}.glb`);
        await uploadBytes(glbRef, glbFile);

        await addDoc(collection(db, "habitats"), {
            name: habitatName,
            userEmail: user.email,
            glbPath: glbRef.fullPath,
        });

        setHabitatName('');
        setGlbFile(null);
        fetchHabitats(user.email);
        alert("Habitat criado com sucesso!");
    };

    return (
        <Container fluid className="habitat-container">
                <Col md={4} className="list-container">
                    <h2>Habitats</h2>
                    <div className="habitat-list">
                        {habitats.map((habitat) => (
                            <Card key={habitat.id} className="habitat-item mb-3">
                                <Card.Body>
                                    <Card.Title>{habitat.name}</Card.Title>
                                    {/* Add more habitat details here */}
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                </Col>
                <Col md={8} className="model-container">
                    <h2>Criar Habitat</h2>
                    <Form>
                        <Form.Group controlId="formHabitatName">
                            <Form.Label>Nome do Habitat</Form.Label>
                            <Form.Control
                                type="text"
                                value={habitatName}
                                onChange={handleHabitatNameChange}
                                placeholder="Digite o nome do habitat"
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="formGlbUpload" className="mt-3">
                            <Form.Label>Upload do modelo GLB</Form.Label>
                            <Form.Control type="file" onChange={handleGlbFileChange} />
                        </Form.Group>
                        <Button variant="primary" className="mt-3" onClick={handleCreateHabitat}>
                            Criar Habitat
                        </Button>
                    </Form>
                    <div className="large-div mt-4">
                        {/* Placeholder for the future component */}
                    </div>
                </Col>
        </Container>
    );
}