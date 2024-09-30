// animationMachine.js
import { createMachine } from 'xstate';

export const animationMachine = createMachine({
  id: 'animation',
  initial: 'idle',
  states: {
    idle: {
      on: {
        PERSON_DETECTED: 'waving',
        AI_RESPONSE_RECEIVED: 'talking',
        PROCESSING_STARTED: 'confused',
      },
    },
    waving: {
      on: {
        AI_RESPONSE_RECEIVED: 'talking',
        PERSON_LOST: 'idle',
        PROCESSING_STARTED: 'confused',
      },
    },
    talking: {
      on: {
        RESPONSE_FINISHED: 'idle',
      },
    },
    confused: {
        on: {
            PROCESSING_ENDED: 'previous',
          },          
        on: {
            PROCESSING_ENDED: 'idle',
        },
    }
}})
