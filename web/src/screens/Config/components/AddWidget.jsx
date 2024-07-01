import React, { useState, useEffect } from "react";
import { Form, Button, Card, Alert, ProgressBar } from "react-bootstrap";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db, storage } from "../../../firebase";
import "../styles/AddWidget.scss";

export default function AddWidget({ habitatId }) {
  const [widgetData, setWidgetData] = useState({ text: "", imageFile: null });
  const [widgets, setWidgets] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("");

  useEffect(() => {
    const fetchWidgets = async () => {
      if (!habitatId) return;
      const widgetsCollection = collection(db, `habitats/${habitatId}/widgets`);
      const widgetsSnapshot = await getDocs(widgetsCollection);
      const widgetsList = widgetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWidgets(widgetsList);
    };

    fetchWidgets();
  }, [habitatId]);

  const handleInputChange = (e) => {
    setWidgetData({
      ...widgetData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setWidgetData({
      ...widgetData,
      imageFile: e.target.files[0]
    });
  };

  const handleSaveWidget = async () => {
    if (!widgetData.text || !widgetData.imageFile) {
      setAlertMessage("Por favor, preencha todos os campos e envie uma imagem.");
      setAlertVariant("danger");
      return;
    }

    setLoading(true);

    try {
      const imageRef = ref(storage, `widgets/${habitatId}/${widgetData.imageFile.name}`);
      const uploadTask = uploadBytesResumable(imageRef, widgetData.imageFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Erro ao enviar imagem:", error);
          setAlertMessage("Falha ao enviar a imagem. Tente novamente.");
          setAlertVariant("danger");
          setLoading(false);
        },
        async () => {
          const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);

          const widgetDataToSave = {
            text: widgetData.text,
            imageUrl,
          };

          const widgetsCollectionRef = collection(db, `habitats/${habitatId}/widgets`);
          const widgetDocRef = await addDoc(widgetsCollectionRef, widgetDataToSave);
          setWidgets([...widgets, { id: widgetDocRef.id, ...widgetDataToSave }]);

          setWidgetData({ text: "", imageFile: null });
          setUploadProgress(0);
          setAlertMessage("Widget salvo com sucesso.");
          setAlertVariant("success");
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Erro ao salvar widget:", error);
      setAlertMessage("Falha ao salvar o widget. Tente novamente.");
      setAlertVariant("danger");
      setLoading(false);
    }
  };

  const handleDeleteWidget = async (widgetId, imageUrl) => {
    setLoading(true);
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      await deleteDoc(doc(db, `habitats/${habitatId}/widgets`, widgetId));
      setWidgets(widgets.filter(widget => widget.id !== widgetId));
      setAlertMessage("Widget deletado com sucesso.");
      setAlertVariant("success");
    } catch (error) {
      console.error("Erro ao deletar widget:", error);
      setAlertMessage("Falha ao deletar o widget. Tente novamente.");
      setAlertVariant("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="components-container">
      {alertMessage && (
        <Alert variant={alertVariant} onClose={() => setAlertMessage("")} dismissible>
          {alertMessage}
        </Alert>
      )}
      <Card className="widget-card">
        <Card.Body>
          <Form.Group>
            <Form.Label>Texto</Form.Label>
            <Form.Control
              type="text"
              name="text"
              value={widgetData.text}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Imagem</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {uploadProgress > 0 && (
              <ProgressBar now={uploadProgress} label={`${Math.round(uploadProgress)}%`} className="mb-3" />
            )}
          </Form.Group>
          <Button onClick={handleSaveWidget} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Widget"}
          </Button>
        </Card.Body>
      </Card>

      <div className="widgets-list">
        {widgets.map(widget => (
          <Card key={widget.id} className="widget-card">
            <Card.Body>
              <Card.Text>{widget.text}</Card.Text>
              <Card.Img variant="top" src={widget.imageUrl} />
              <Button variant="danger" onClick={() => handleDeleteWidget(widget.id, widget.imageUrl)} disabled={loading}>
                Deletar
              </Button>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
}