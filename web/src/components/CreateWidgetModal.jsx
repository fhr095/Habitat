import React, { useState } from 'react';
import { Modal, Button, Form, Input, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const { TextArea } = Input;

export default function CreateWidgetModal({ open, handleClose, handleCreate }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [finalizeError, setFinalizeError] = useState('');

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleUpload = async () => {
    let imageUrl = '';
    if (imageFile) {
      const imageRef = ref(storage, `widgets/${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
      console.log('Image URL obtained:', imageUrl); // Verificar URL da imagem
    }
    return imageUrl;
  };

  const handleSubmit = async () => {
    try {
      const imageUrl = await handleUpload();
      console.log('Image URL before creating widget:', imageUrl); // Verificar URL da imagem antes de criar o widget
      handleCreate({ content, imageUrl });
      setContent('');
      setImageFile(null);
      handleClose();
    } catch (err) {
      setFinalizeError('Ocorreu um erro ao carregar a imagem. Tente novamente mais tarde.');
    }
  };

  const handleImageChange = (e) => {
    if (e.file) {
      setImageFile(e.file.originFileObj);
    }
  };

  return (
    <Modal
      title="Criar Widget"
      open={open}
      onOk={handleSubmit}
      onCancel={handleClose}
      centered
    >
      <Form>
        <Form.Item label="Conteúdo">
          <TextArea
            rows={4}
            value={content}
            onChange={handleContentChange}
            placeholder="Enter text content"
            required
          />
        </Form.Item>
        <Form.Item label="Upload Imagem">
          <Upload
            name="file"
            customRequest={({ file, onSuccess }) => {
              handleImageChange({ file });
              onSuccess("ok");
            }}
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </Form.Item>
        {finalizeError && <p className="text-danger">{finalizeError}</p>}
      </Form>
    </Modal>
  );
}