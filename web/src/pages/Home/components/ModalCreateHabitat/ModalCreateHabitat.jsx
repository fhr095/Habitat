import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../firebase";
import "./ModalCreateHabitat.scss";

export default function ModalCreateHabitat({ onClose, userEmail }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState(null);
  const [glbFile, setGlbFile] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const glbFileRef = ref(storage, `habitats/${glbFile.name}`);
      const imageRef = image ? ref(storage, `habitats/images/${image.name}`) : null;

      const uploadGlbTask = uploadBytesResumable(glbFileRef, glbFile);

      uploadGlbTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Falha no upload do GLB", error);
          setIsSubmitting(false);
        },
        async () => {
          const glbFileUrl = await getDownloadURL(uploadGlbTask.snapshot.ref);

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

                await addDoc(collection(db, "habitats"), {
                  name,
                  address,
                  imageUrl,
                  glbFileUrl,
                  isPublic,
                  createdBy: userEmail,
                  members: [userEmail],  // Adiciona o usuário como membro
                });

                console.log("Habitat criado com imagem e arquivo GLB");
                setIsSubmitting(false);
                onClose();
              }
            );
          } else {
            await addDoc(collection(db, "habitats"), {
              name,
              address,
              imageUrl: null,
              glbFileUrl,
              isPublic,
              createdBy: userEmail,
              members: [userEmail],  // Adiciona o usuário como membro
            });

            window.location.reload();
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

  const isFormValid = name && glbFile;

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
            Arquivo GLB:
            <input
              type="file"
              accept=".glb"
              onChange={(e) => setGlbFile(e.target.files[0])}
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