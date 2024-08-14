import React, { useState } from "react";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../firebase";
import "./ModalCreateHabitat.scss";

export default function ModalCreateHabitat({ onClose, userEmail }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState(null);
  const [ifcFile, setIfcFile] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState(false); // Nova variável booleana
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const ifcFileRef = ref(storage, `habitats/${ifcFile.name}`);
      const imageRef = image ? ref(storage, `habitats/images/${image.name}`) : null;

      const uploadIfcTask = uploadBytesResumable(ifcFileRef, ifcFile);

      uploadIfcTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Falha no upload do arquivo IFC", error);
          setIsSubmitting(false);
        },
        async () => {
          const ifcFileUrl = await getDownloadURL(uploadIfcTask.snapshot.ref);

          if (imageRef) {
            const uploadImageTask = uploadBytesResumable(imageRef, image);

            uploadImageTask.on(
              "state_changed",
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
              },
              (error) => {
                console.error("Falha no upload da imagem", error);
                setIsSubmitting(false);
              },
              async () => {
                const imageUrl = await getDownloadURL(uploadImageTask.snapshot.ref);

                const habitatRef = await addDoc(collection(db, "habitats"), {
                  name,
                  address,
                  imageUrl,
                  ifcFileUrl,
                  isPublic,
                  dataCollectionEnabled, // Adicionando a variável booleana ao documento
                  createdBy: userEmail,
                });

                // Adicionar o criador como membro do habitat
                const memberRef = doc(db, `habitats/${habitatRef.id}/members/${userEmail}`);
                await setDoc(memberRef, {
                  email: userEmail,
                  tag: "Criador",
                  color: "#004736",
                });

                console.log("Habitat criado com imagem e arquivo IFC");
                setIsSubmitting(false);
                onClose();
              }
            );
          } else {
            const habitatRef = await addDoc(collection(db, "habitats"), {
              name,
              address,
              imageUrl: null,
              ifcFileUrl,
              isPublic,
              dataCollectionEnabled, // Adicionando a variável booleana ao documento
              createdBy: userEmail,
            });

            // Adicionar o criador como membro do habitat
            const memberRef = doc(db, `habitats/${habitatRef.id}/members/${userEmail}`);
            await setDoc(memberRef, {
              email: userEmail,
              tag: "Criador",
              color: "#004736",
            });

            console.log("Habitat criado com arquivo IFC");
            setIsSubmitting(false);
            onClose();
          }
        }
      );
    } catch (error) {
      console.error("Erro ao criar habitat: ", error);
      setIsSubmitting(false);
    }
  };

  const isFormValid = name && ifcFile;

  return (
    <div className="modal-create-habitat">
      <div className="modal-create-habitat-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h1>Criar Habitat</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Nome:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Endereço (opcional):
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label>
            Imagem do Habitat:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>
          <label>
            Arquivo IFC:
            <input
              type="file"
              accept=".ifc"
              onChange={(e) => setIfcFile(e.target.files[0])}
              required
            />
          </label>
          <label>
            Público:
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </label>
          <button type="submit" disabled={!isFormValid || isSubmitting}>
            Adicionar Habitat
          </button>
        </form>
        {isSubmitting && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}
      </div>
    </div>
  );
}