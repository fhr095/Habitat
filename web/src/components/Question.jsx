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

            setTimeout(() => {
                if (toastId.current) {
                    toast.update(toastId.current, {
                        render: `Resposta: ${question}`,
                        type: "info",
                        autoClose: 5000,
                        isLoading: false,
                    });
                    toastId.current = null;
                }
            }, 5000); // Fechar após 5 segundos
        }

        return () => {
            if (toastId.current) {
                toast.dismiss(toastId.current);
            }
        };
    }, [question]);

    return <ToastContainer />;
}