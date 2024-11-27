// AnimationController.jsx
import { useEffect, useRef, useContext } from 'react';
import { createBrowserInspector } from '@statelyai/inspect';
import { createActor } from 'xstate';
import { animationMachine } from '../../../../animationMachine';
import { useAnimations } from '../../../../context/AnimationContext';
import { SceneConfigContext } from '../../../../context/SceneConfigContext';
import eventBus from '../../../../eventBus';

export default function AnimationController() {
  const { playAnimation } = useAnimations();
  const { sceneConfig, setSceneConfig } = useContext(SceneConfigContext);
  const idleTimerRef = useRef(null);
  const idleAnimationIntervalRef = useRef(null);
  const idleAnimations = [/*'RodandoCurto',*/ 'MinasPiscando', 'Acenando-2']; // Array de animações ociosas

  // Referências para o inspetor e o ator
  const inspectorRef = useRef(null);
  const actorRef = useRef(null);
  
  // Armazena o valor anterior do estado
  const previousStateValueRef = useRef(null);

  // Cria uma referência para a função playAnimation
  const playAnimationRef = useRef(playAnimation);
  
  // Atualiza a referência sempre que playAnimation mudar
  useEffect(() => {
    playAnimationRef.current = playAnimation;
  }, [playAnimation]);

  

  useEffect(() => {
    // Inicializa o inspetor apenas uma vez
    if (!inspectorRef.current) {
      inspectorRef.current = createBrowserInspector();
      inspectorRef.current.start();
    }

    // Inicializa o ator apenas uma vez
    if (!actorRef.current) {
      actorRef.current = createActor(animationMachine, {
        inspect: inspectorRef.current.inspect, // Corrigido aqui
      });
      actorRef.current.start();
    }

    const actor = actorRef.current;

    // Funções de manipulação de eventos
    const handlePersonDetected = () => {
      actor.send({ type: 'PERSON_DETECTED' });
      actor.send({ type: 'UNSET_DISTRACTED' }); // Resetar o estado distraído quando uma pessoa é detectada
    };

    const handlePersonLost = () => {
      actor.send({ type: 'PERSON_LOST' });
    };

    const handleAIResponseReceived = () => {
      actor.send({ type: 'AI_RESPONSE_RECEIVED' });
    };

    const handleResponseFinished = () => {
      actor.send({ type: 'RESPONSE_FINISHED' });
    };

    const handleAudioStarted = () => {
      actor.send({ type: 'AI_RESPONSE_RECEIVED' });
    };

    const handleAudioEnded = () => {
      actor.send({ type: 'RESPONSE_FINISHED' });
    };

    const handleProcessingStarted = () => {
      actor.send({ type: 'PROCESSING_STARTED' });
    };

    const handleProcessingEnded = () => {
      actor.send({ type: 'PROCESSING_ENDED' });
    };

    const handleIntentionTalkDetected = () => {
      actor.send({ type: 'INTENTION_TALK_DETECTED' });
    };

    const handleQuestionReceived = () => {
      actor.send({ type: 'QUESTION_RECEIVED' });
    };

    // Registro de eventos
    eventBus.on('personDetected', handlePersonDetected);
    eventBus.on('personLost', handlePersonLost);
    eventBus.on('aiResponseReceived', handleAIResponseReceived);
    eventBus.on('responseFinished', handleResponseFinished);
    eventBus.on('audioStarted', handleAudioStarted);
    eventBus.on('audioEnded', handleAudioEnded);
    eventBus.on('processingStarted', handleProcessingStarted);
    eventBus.on('processingEnded', handleProcessingEnded);
    eventBus.on('intentionTalkDetected', handleIntentionTalkDetected);
    eventBus.on('questionReceived', handleQuestionReceived);

    return () => {
      // Remoção de eventos ao desmontar o componente
      eventBus.off('personDetected', handlePersonDetected);
      eventBus.off('personLost', handlePersonLost);
      eventBus.off('aiResponseReceived', handleAIResponseReceived);
      eventBus.off('responseFinished', handleResponseFinished);
      eventBus.off('audioStarted', handleAudioStarted);
      eventBus.off('audioEnded', handleAudioEnded);
      eventBus.off('processingStarted', handleProcessingStarted);
      eventBus.off('processingEnded', handleProcessingEnded);
      eventBus.off('intentionTalkDetected', handleIntentionTalkDetected);
      eventBus.off('questionReceived', handleQuestionReceived);

      actor.stop(); // Para o ator ao desmontar o componente
    };
  }, []);

  /*const distractedRef = useRef(state.context.distracted);
      useEffect(() => {
        distractedRef.current = state.context.distracted;
      }, [state.context.distracted]);*/

  useEffect(() => {
    const actor = actorRef.current;

    const subscription = actor.subscribe((state) => {
      const prevStateValue = previousStateValueRef.current;
      const currentStateValue = state.value;

      console.log('Estado atual:', currentStateValue);
      console.log('Contexto atual:', state.context);

      

      // Limpa os temporizadores apenas se o valor do estado mudar
      if (prevStateValue !== currentStateValue) {
        // Limpa o temporizador anterior
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }

        // Limpa o intervalo de animação ociosa
        if (idleAnimationIntervalRef.current) {
          clearInterval(idleAnimationIntervalRef.current);
          idleAnimationIntervalRef.current = null;
        }
      }
    
      // Configurações específicas de câmera para animações
      const adjustCameraForAnimation = (animationName) => {
        switch (animationName) {
          case 'CantodeTela':
            /*setSceneConfig((prevConfig) => ({
              ...prevConfig,
              camera: {
                ...prevConfig.camera,
                position: { x: 1.2, y: 0.75, z: 2.05 },
                direction: { x: -48.5, y: -2.3, z: -35.85 }
              },
            }));*/
            break;

            /*case 'RodandoCurto':
              setSceneConfig((prevConfig) => ({
                ...prevConfig,
                camera: {
                  ...prevConfig.camera,
                  position: { x: 1, y: -1, z: 0 },
                direction: { x: 0, y: 0.8, z: 0 }
                },
              }));
              break;*/

          default:
            /*setSceneConfig((prevConfig) => ({
              ...prevConfig,
              camera: {
                ...prevConfig.camera,
                position: { x: 1, y: 1, z: 0 },
                direction: { x: 0, y: 0.8, z: 0 }
              },
            }));*/
            break;
        }
      };

      // Definindo animações com base no estado atual
      switch (currentStateValue) {
        case 'idle':
          playAnimationRef.current('Idle-2-Sorridente');
          // Inicia o temporizador para entrar no estado distraído após X segundos
          if (!idleTimerRef.current) {
            console.log('Iniciando temporizador para entrar no estado distraído');
            idleTimerRef.current = setTimeout(() => {
              console.log('Enviando evento SET_DISTRACTED');
              actor.send({ type: 'SET_DISTRACTED' });
            }, 5000); // Ajuste o tempo conforme necessário
          }
          break;

        case 'waving1':
          playAnimationRef.current('Acenando');
          //playAnimationRef.current('MinasPiscando');
          adjustCameraForAnimation('Acenando');
          break;

        case 'waving2':
          playAnimationRef.current('Acenando-2');
          //playAnimationRef.current('MinasPiscando');
          adjustCameraForAnimation('Acenando-2');
          break;

        case 'approaching':
          playAnimationRef.current('MinasPiscando');
          break;

        case 'listening':
          //playAnimationRef.current('Confuso');
          break;

        case 'processing':
          playAnimationRef.current('Confuso');
          break;

        case 'talking':
          playAnimationRef.current('Conversando-Feliz-1-Grande');
          break;

        default:
          break;
      }

      
      // Inicia animações aleatórias se o avatar estiver distraído
      if (state.context.distracted) {        
        console.log("Aleatorio: ", state.context.distracted);
        if (!idleAnimationIntervalRef.current) {
          idleAnimationIntervalRef.current = setInterval(() => {
            const randomAnimation =
              idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
            playAnimationRef.current(randomAnimation);
            adjustCameraForAnimation(randomAnimation);
          }, 6000); // Troca de animação a cada 10 segundos (ajuste conforme necessário)
        }
      }

       // Se o avatar não está mais distraído, limpa o intervalo de animação
       if (!state.context.distracted && idleAnimationIntervalRef.current) {
        console.log('Limpando intervalo de animação ociosa');
        clearInterval(idleAnimationIntervalRef.current);
        idleAnimationIntervalRef.current = null;
      }

      // Atualiza o valor anterior do estado
      previousStateValueRef.current = currentStateValue;
    });

    return () => {
      subscription.unsubscribe(); // Limpa a assinatura quando o componente é desmontado
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (idleAnimationIntervalRef.current) {
        clearInterval(idleAnimationIntervalRef.current);
      }
    };
  }, [playAnimation]);

  return null;
}