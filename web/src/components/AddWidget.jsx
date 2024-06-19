import React, { useState, useEffect } from 'react';
import { Form, Button, Table } from 'react-bootstrap';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { storage, db } from '../firebase';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function AddWidget() {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [finalizeError, setFinalizeError] = useState('');
  const [widgets, setWidgets] = useState([]);

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    const widgetsSnapshot = await getDocs(collection(db, 'widgets'));
    const loadedWidgets = widgetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWidgets(loadedWidgets);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!imageFile) return '';

    const imageRef = ref(storage, `widgets/${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    return await getDownloadURL(imageRef);
  };

  const handleSubmit = async () => {
    try {
      const imageUrl = await handleUpload();
      const widgetData = { content, imageUrl };
      await addDoc(collection(db, 'widgets'), widgetData);
      setContent('');
      setImageFile(null);
      loadWidgets();
      alert('Widget adicionado com sucesso!');
    } catch (err) {
      setFinalizeError('Ocorreu um erro ao carregar a imagem. Tente novamente mais tarde.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'widgets', id));
      loadWidgets();
      alert('Widget deletado com sucesso!');
    } catch (err) {
      alert('Erro ao deletar o widget. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="add-widget">
      <h2>Adicionar Widget</h2>
      <Form>
        <Form.Group controlId="formContent">
          <Form.Label>Conteúdo</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={content}
            onChange={handleContentChange}
            placeholder="Digite o conteúdo"
            required
          />
        </Form.Group>
        <Form.Group controlId="formImageUpload">
          <Form.Label>Upload Imagem</Form.Label>
          <Form.Control type="file" onChange={handleImageChange} />
        </Form.Group>
        {finalizeError && <p className="text-danger">{finalizeError}</p>}
        <Button variant="primary" onClick={handleSubmit}>
          Adicionar Widget
        </Button>
      </Form>
      <h3 className="mt-4">Widgets</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Conteúdo</th>
            <th>Imagem</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {widgets.map((widget, index) => (
            <tr key={widget.id}>
              <td>{index + 1}</td>
              <td>{widget.content}</td>
              <td>
                {widget.imageUrl ? (
                  <img src={widget.imageUrl} alt="widget" width="50" />
                ) : (
                  'Sem imagem'
                )}
              </td>
              <td>
                <Button variant="danger" onClick={() => handleDelete(widget.id)}>
                  Deletar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}