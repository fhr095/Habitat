import React from "react";

export default function Avatar({ position }) {
  const gifUrl = "/Avatar/apontando-direita.gif"; // Substitua com o caminho do GIF correspondente

  return position.x !== 0 && position.y !== 0 ? (
    <div
      style={{
        position: "absolute",
        left: position.x - 40, // Ajuste para mover para a esquerda
        top: position.y + 40, // Ajuste para mover para baixo
        transform: "translate(-50%, -100%)", // Centraliza a div em cima do ponto
        background: "transparent", // Fundo transparente
        padding: "5px",
        borderRadius: "5px",
        width: "100px", // Define o tamanho da área onde o GIF será renderizado
        height: "100px",
      }}
    >
      <img src={gifUrl} alt="Avatar Animation" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  ) : null;
}
