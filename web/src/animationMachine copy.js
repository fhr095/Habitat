// animationMachine.js
import { createMachine } from 'xstate';

export const animationMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QEMB2BLAtsgLug9qgHToQA2YAxAAoCiASgMoDyAcgPoAitAKrQMJ9OAbQAMAXUSgADvljo8hKSAAeiAEyiAnEQCsogBxato0bt3r1WgMzWANCACeiACwBGdUTcGAbAHZ1Px9dFz9RKx8AX0iHNCxcAmJSCkoAQQBJdnpaRmo2RlosgVp0gDVaEQllWXlFVGU1BE0fB2cEHzdrIltbF003LV0fKJiQOOw6knIqanpmfhzGdNYAcXZGHlT6ITFJJBAahUSGjVEWp1PPdX1TX191a3UR2IwJxKIAd2QAN3RUKDSmWyuXyhWyCzKFV21TkRyU+0a5j8RBcLgM7lCfhMBnUBlarkCRAMRmsIRCljufmiL3iky+v3+NAYLA4ABlmBtoftDnUTk0DG4iD5rviEI9BT1rH1RAMhs8xq8EoRPj8-gDZvNFss1hstjsqtzYbyEYhdH5BWiXNY-LpRY8uqZHXdhY95eMlcQcMgyABrNWUYF5VgFdgAMWW6UYAAkoQaZEbjiaELpjERRH4BSKLggXFpPLoDL1+oNhtSFbT3gBjQgAMwArrBIDQ5gtGEtVuxaKxuJU9vHaonQIjU7prB5bdmBXpHYYfPdXepoqNUPgIHBlO7jf24fUkwBac5tA9lzfvZJgGED+FDgmiwbdPO+AtWQxaIInxV01X-S87vkuCwUXRa0JzaR4dC0NxhhtUlcWMawPwrZUvV9NVfy3VREAFZEtDnG1RVzB1CylYs5UQt5lWrVB60bCB0MHTCEGwohcIMfDs00XQiGuJ05xdJ4l0iIA */

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
