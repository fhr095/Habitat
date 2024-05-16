import React, { useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Question({ question }) {
    const toastId = useRef(null); // Movido para fora do useEffect

    useEffect(() => {
        if (question && !toastId.current) {
            toastId.current = toast.loading(`Carregando resposta para: "${question}"`, {
                position: "bottom-right",
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: true,
                draggable: true,
            });
        } else if (question && toastId.current) {
            toast.update(toastId.current, {
                render: `Resposta: ${question}`,
                type: toast.TYPE.INFO,
                autoClose: 5000,
                isLoading: false,
            });
            toastId.current = null;
        }

        return () => {
            if (toastId.current) {
                toast.dismiss(toastId.current);
            }
        };
    }, [question]); // As dependências permanecem inalteradas

    return <ToastContainer />;
}