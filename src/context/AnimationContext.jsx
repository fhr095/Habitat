// AnimationContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const AnimationContext = createContext();

export const useAnimations = () => useContext(AnimationContext);

export const AnimationProvider = ({ children }) => {
  const [animations, setAnimations] = useState([]);
  const [mixer, setMixer] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);

  const playAnimation = useCallback(
    (animationName, fadeDuration = 0.5) => {
      if (!mixer || animations.length === 0) return;

      const clip = animations.find((clip) => clip.name === animationName);
      if (!clip) {
        console.warn(`Animation "${animationName}" not found.`);
        return;
      }

      const nextAction = mixer.clipAction(clip);

      if (currentAction && currentAction !== nextAction) {
        currentAction.fadeOut(fadeDuration);
        nextAction.reset().fadeIn(fadeDuration).play();
      } else if (!currentAction) {
        nextAction.reset().fadeIn(fadeDuration).play();
      }

      setCurrentAction(nextAction);
    },
    [animations, mixer, currentAction]
  );

  const stopAllAnimations = useCallback(() => {
    if (mixer) {
      mixer.stopAllAction();
      setCurrentAction(null);
    }
  }, [mixer]);

  return (
    <AnimationContext.Provider
      value={{ animations, setAnimations, mixer, setMixer, playAnimation, stopAllAnimations }}
    >
      {children}
    </AnimationContext.Provider>
  );
};
