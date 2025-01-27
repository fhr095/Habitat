// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o estado para exibir a UI de fallback
    return { hasError: true, errorInfo: error };
  }

  componentDidCatch(error, errorInfo) {
    // Você pode logar o erro em um serviço de monitoramento
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Renderiza uma UI alternativa
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Algo deu errado.</h2>
          <p>Por favor, tente novamente mais tarde.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
