import { useEffect } from 'react';
import { usePorcupine } from '@picovoice/porcupine-react';

export default function Porcupine({ setIsFinished }) {
  const { keywordDetection, init, start, stop } = usePorcupine();

  useEffect(() => {
    const initializePorcupine = async () => {
      await init(
        import.meta.env.VITE_PORCUPINE_ACCESS_KEY, // replace with your actual Picovoice Access Key
        [
          { publicPath: "/Porcupine/maari_pt_wasm_v3_0_0.ppn", label: 'Maari' },
          { publicPath: "/Porcupine/Olá-mari_pt_wasm_v3_0_0.ppn", label: 'Olá Mari' }
        ], // you can add multiple keywords like this
        { publicPath: "/Porcupine/porcupine_params_pt.pv" } // path to the model file
      );
      await start();
    };

    initializePorcupine();
    
    return () => stop(); // Ensure resources are cleaned up on unmount
  }, [init, start, stop]);

  useEffect(() => {
    if (keywordDetection) {
      console.log(`Detected keyword: ${keywordDetection.label}`);
      setIsFinished(true);
    }
  }, [keywordDetection]);

  return null; // This ensures the component returns nothing visually
}