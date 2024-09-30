// AnimationController.jsx
import { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { animationMachine } from '../../../../animationMachine';
import { useAnimations } from '../../../../context/AnimationContext';
import eventBus from '../../../../eventBus';

export default function AnimationController() {
  const { playAnimation } = useAnimations();
  const [state, send] = useMachine(animationMachine);

  useEffect(() => {
    const handlePersonDetected = () => {
      send({ type: 'PERSON_DETECTED' });
    };

    const handlePersonLost = () => {
      send({ type: 'PERSON_LOST' });
    };

    const handleAIResponseReceived = () => {
      send({ type: 'AI_RESPONSE_RECEIVED' });
    };

    const handleResponseFinished = () => {
      send({ type: 'RESPONSE_FINISHED' });
    };

    const handleAudioStarted = () => {
      send({ type: 'AI_RESPONSE_RECEIVED' });
    };

    const handleAudioEnded = () => {
      send({ type: 'RESPONSE_FINISHED' });
    };

    const handleProcessingStarted = () => {
        send({ type: 'PROCESSING_STARTED' });
      };
  
      const handleProcessingEnded = () => {
        send({ type: 'PROCESSING_ENDED' });
      };

    eventBus.on('personDetected', handlePersonDetected);
    eventBus.on('personLost', handlePersonLost);
    eventBus.on('aiResponseReceived', handleAIResponseReceived);
    eventBus.on('responseFinished', handleResponseFinished);
    eventBus.on('audioStarted', handleAudioStarted);
    eventBus.on('audioEnded', handleAudioEnded);
    eventBus.on('processingStarted', handleProcessingStarted);
    eventBus.on('processingEnded', handleProcessingEnded);

    return () => {
      eventBus.off('personDetected', handlePersonDetected);
      eventBus.off('personLost', handlePersonLost);
      eventBus.off('aiResponseReceived', handleAIResponseReceived);
      eventBus.off('responseFinished', handleResponseFinished);
      eventBus.off('audioStarted', handleAudioStarted);
      eventBus.off('audioEnded', handleAudioEnded);
      eventBus.off('processingStarted', handleProcessingStarted);
      eventBus.off('processingEnded', handleProcessingEnded);
    };
  }, [send]);

  useEffect(() => {
    switch (state.value) {
      case 'idle':
        playAnimation('Idle-2-Sorridente'); // Certifique-se que "Idle" é uma animação válida
        break;
      case 'waving':
        playAnimation('Acenando'); // Nome da animação de aceno
        break;
      case 'talking':
        playAnimation('Conversando-Feliz-1-Grande'); // Nome da animação de conversação
        break;
    case 'confused':
        playAnimation('Confuso'); // Nome da animação de confusão
        break;
      default:
        break;
    }
  }, [state.value, playAnimation]);

  return null;
}
