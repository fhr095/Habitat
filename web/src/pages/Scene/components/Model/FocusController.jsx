// FocusController.jsx - Controlador para gerenciar o foco em objetos da cena
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import { objectLocationMapper } from '../../utils/ObjectLocationMapper';

// Gerenciador de eventos para comunicação com a IA
const focusEventEmitter = {
  listeners: new Set(),
  
  addEventListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  
  emit(eventType, data) {
    this.listeners.forEach(listener => {
      try {
        listener(eventType, data);
      } catch (error) {
        console.error("Erro em listener do focusEventEmitter:", error);
      }
    });
  }
};

/**
 * Componente para controlar o foco em objetos da cena e facilitar a integração 
 * entre IA, FocusOnObject e SketchMode
 * 
 * @param {Object} props
 * @param {Function} props.onFocusRequest - Callback para quando um foco é solicitado
 * @param {Function} props.onReturnRequest - Callback para quando um retorno é solicitado
 */
const FocusController = ({ onFocusRequest, onReturnRequest }) => {
  const { currentMode } = useVisualizationMode();
  const focusStateRef = useRef({
    currentTarget: null,
    lastFocused: null,
    pendingCommands: [],
    isProcessing: false
  });
  
  // Processa a fila de comandos de foco
  const processQueue = useCallback(async () => {
    if (focusStateRef.current.isProcessing || 
        focusStateRef.current.pendingCommands.length === 0) {
      return;
    }
    
    focusStateRef.current.isProcessing = true;
    
    try {
      const command = focusStateRef.current.pendingCommands.shift();
      
      if (command.type === 'focus') {
        focusStateRef.current.currentTarget = command.target;
        
        if (onFocusRequest && typeof onFocusRequest === 'function') {
          await onFocusRequest(command.target, command.duration || 3000);
        }
        
        focusStateRef.current.lastFocused = command.target;
      } 
      else if (command.type === 'return') {
        focusStateRef.current.currentTarget = null;
        
        if (onReturnRequest && typeof onReturnRequest === 'function') {
          await onReturnRequest(command.duration || 2000);
        }
      }
      
      // Emite evento para informar que o comando foi processado
      focusEventEmitter.emit('commandProcessed', {
        type: command.type,
        target: command.target || null,
        success: true
      });
    } catch (error) {
      console.error("Erro ao processar comando de foco:", error);
      
      // Emite evento de erro
      focusEventEmitter.emit('commandError', {
        error: error.message,
        command: focusStateRef.current.pendingCommands[0]
      });
    } finally {
      focusStateRef.current.isProcessing = false;
      
      // Processa o próximo comando na fila, se houver
      if (focusStateRef.current.pendingCommands.length > 0) {
        setTimeout(() => processQueue(), 50);
      }
    }
  }, [onFocusRequest, onReturnRequest]);
  
  // Adiciona um comando à fila
  const queueCommand = useCallback((command) => {
    focusStateRef.current.pendingCommands.push(command);
    processQueue();
  }, [processQueue]);
  
  // Função para focalizar em um objeto
  const focusOnTarget = useCallback((target, duration = 3000) => {
    queueCommand({
      type: 'focus',
      target: target,
      duration: duration
    });
  }, [queueCommand]);
  
  // Função para retornar à posição original
  const returnToOriginal = useCallback((duration = 2000) => {
    queueCommand({
      type: 'return',
      duration: duration
    });
  }, [queueCommand]);
  
  // Função para lidar com ações da IA
  const handleAIAction = useCallback((action) => {
    if (!action || !action.type) return;
    
    if (action.type === 'focusLocation') {
      if (action.targetName) {
        focusOnTarget(action.targetName, action.duration);
      }
    } 
    else if (action.type === 'returnCamera') {
      returnToOriginal(action.duration);
    }
  }, [focusOnTarget, returnToOriginal]);
  
  // Expõe a API para acesso global
  useEffect(() => {
    // Cria ou obtém o objeto de navegação global
    window._navigation = window._navigation || {};
    
    // Expõe métodos para uso externo
    window._navigation.focusOnTarget = focusOnTarget;
    window._navigation.returnToOriginal = returnToOriginal;
    window._navigation.getCurrentTarget = () => focusStateRef.current.currentTarget;
    window._navigation.getLastFocused = () => focusStateRef.current.lastFocused;
    window._navigation.clearQueue = () => {
      focusStateRef.current.pendingCommands = [];
      return true;
    };
    window._navigation.handleAIAction = handleAIAction;
    
    // Adiciona tratamento para comandos da IA
    if (window._ai && !window._ai.onFocusCommand) {
      window._ai.onFocusCommand = handleAIAction;
    }
    
    return () => {
      // Limpa somente as referências que este componente criou
      if (window._navigation) {
        delete window._navigation.focusOnTarget;
        delete window._navigation.returnToOriginal;
        delete window._navigation.getCurrentTarget;
        delete window._navigation.getLastFocused;
        delete window._navigation.clearQueue;
        delete window._navigation.handleAIAction;
      }
      
      if (window._ai) {
        delete window._ai.onFocusCommand;
      }
    };
  }, [focusOnTarget, returnToOriginal, handleAIAction]);
  
  // Monitora mudanças no modo de visualização
  useEffect(() => {
    // Se temos um alvo focado no modo atual, vamos tentar mantê-lo focado
    // quando mudarmos de modo
    const currentTarget = focusStateRef.current.currentTarget;
    
    if (currentTarget) {
      // Emite evento de mudança de modo
      focusEventEmitter.emit('modeChanged', {
        mode: currentMode,
        currentTarget: currentTarget
      });
      
      // Pequeno atraso para permitir que o novo modo seja renderizado
      setTimeout(() => {
        // Refocaliza no mesmo alvo se estávamos focados em algo
        focusOnTarget(currentTarget, 1500);
      }, 300);
    }
  }, [currentMode, focusOnTarget]);
  
  // Este componente não renderiza nada visualmente
  return null;
};

// Exporta o componente e o emitter para uso em outros lugares
export { FocusController, focusEventEmitter };
export default FocusController;