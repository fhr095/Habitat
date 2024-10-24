// animationMachine.js
import { createMachine, assign } from 'xstate';

const guards = {
  isDistracted: ({ context }) => {
    console.log('Guard isDistracted chamado, context.distracted:', context.distracted);
    return context.distracted;
  },
  isNotDistracted: ({ context }) => {
    console.log('Guard isNotDistracted chamado, context.distracted:', context.distracted);
    return !context.distracted;
  },
};

export const animationMachine = createMachine(
  {
    id: 'animation',
    initial: 'idle',
    context: {
      distracted: false, // Variável de contexto para rastrear se o avatar está distraído
    },
    on: {
      SET_DISTRACTED: {
        actions: assign({
          distracted: (context) => true,
        }),
      },
      UNSET_DISTRACTED: {
        actions: assign({
          distracted: (context) => false,
        }),
      },
    },
    states: {
      idle: {
        on: {
          PERSON_DETECTED: [
            {
              target: 'waving1',
              guard: 'isNotDistracted',
            },
            {
              target: 'waving2',
              guard: 'isDistracted',
            },
          ],
          AI_RESPONSE_RECEIVED: 'talking',
          PROCESSING_STARTED: 'processing',
        },
      },
      waving1: {
        on: {
          INTENTION_TALK_DETECTED: 'approaching',
          PERSON_LOST: 'idle',
          AI_RESPONSE_RECEIVED: 'talking',
          PROCESSING_STARTED: 'processing',
        },
      },
      waving2: {
        on: {
          INTENTION_TALK_DETECTED: 'approaching',
          PERSON_LOST: 'idle',
          AI_RESPONSE_RECEIVED: 'talking',
          PROCESSING_STARTED: 'processing',
        },
      },
      approaching: {
        on: {
          QUESTION_RECEIVED: 'listening',
          PERSON_LOST: 'idle',
        },
      },
      listening: {
        on: {
          PROCESSING_STARTED: 'processing',
          PERSON_LOST: 'idle',
        },
      },
      processing: {
        on: {
          AI_RESPONSE_RECEIVED: 'talking',
        },
      },
      talking: {
        on: {
          RESPONSE_FINISHED: 'idle',
        },
      },
    },
  },
  {
    guards,
    devTools: falsenp,
  }
);
