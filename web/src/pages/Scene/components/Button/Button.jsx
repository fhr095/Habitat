import React, { useState } from "react";
import Modal from "./Modal";
import "./Button.scss";

export default function Button({ habitatId }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <div>
            <button className="button" onClick={toggleModal}>
                Open Modal
            </button>
            {isModalOpen && <Modal closeModal={toggleModal} habitatId={habitatId} />}
        </div>
    );
}
