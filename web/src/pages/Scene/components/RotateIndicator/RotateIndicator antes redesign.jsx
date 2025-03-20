import React, { useEffect, useState } from 'react';
import './RotateIndicator.scss'; // Vamos criar este arquivo de estilo

export default function RotateIndicator() {
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    function handleResize() {
      setIsPortrait(window.innerHeight > window.innerWidth);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    isPortrait && (
      <div className="rotate-indicator">
        <div className="icon"></div>
        <p>Gire seu dispositivo para melhorar a visualização</p>
      </div>
    )
  );
}
