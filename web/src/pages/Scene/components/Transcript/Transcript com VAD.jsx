import React, { useEffect, useRef, useState } from "react";
import { useMicVAD } from "@ricky0123/vad-react";

export default function Transcript({ setTranscript }) {
  const recognizerRef = useRef(null);
  const [isListening, setIsListening] = useState(false); // Gerencia o estado de escuta


  // Configurando o VAD para iniciar reconhecimento de voz ao detectar atividade
  const vad = useMicVAD({
    startOnLoad: true,
    /*workletURL: '/vad.worklet.bundle.min.js',  // Caminho para o worklet
    modelURL: '/silero_vad.onnx',  */            // Caminho para o modelo ONNX
    modelURL: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.18/dist/silero_vad.onnx",
    workletURL: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.18/dist/vad.worklet.bundle.min.js",
    ortConfig: (ort) => {
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/";
    },
    positiveSpeechThreshold: 0.7,
    negativeSpeechThreshold: 0.2,
    redemptionFrames: 10,
    minSpeechFrames: 1,
    onSpeechStart: () => {
      console.log("Fala detectada! Iniciando reconhecimento...");
      startRecognition();
    },
    onSpeechEnd: (audio) => {
      console.log("Fim da fala detectado.");
      stopRecognition();
    },
    onVADMisfire: () => {
      console.log("Detecção de fala falhou (menos de minSpeechFrames).");
    },
  });

  // Função para iniciar o reconhecimento de voz
  const startRecognition = () => {
    if (recognizerRef.current && recognizerRef.current.recognizing) {
      return; // Se o reconhecimento já está ativo, não faça nada
    }

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error("Browser does not support speech recognition.");
        return;
      }

      const recognizer = new SpeechRecognition();
      recognizer.lang = "pt-BR";
      recognizer.continuous = true;
      recognizer.interimResults = false;
      recognizer.recognizing = false;

      recognizer.onstart = () => {
        recognizer.recognizing = true; // Marca o reconhecimento como ativo
        setIsListening(true); // Atualiza o estado de escuta
      };

      recognizer.onend = () => {
        recognizer.recognizing = false; // Marca o reconhecimento como inativo
        setIsListening(false); // Atualiza o estado de escuta
        if (recognizerRef.current) {
          recognizer.start(); // Reinicie o reconhecimento se estiver ativo
        }
      };

      recognizer.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join(' ')
          .trim();

        if (transcript) {
          setTranscript(prevTranscript => {
            if (prevTranscript.trim() !== transcript.trim()) {
              return transcript; // Apenas atualiza se o texto for diferente
            }
            return prevTranscript; // Mantém o mesmo texto se for igual
          });
        }
      };

      recognizer.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          if (recognizerRef.current && !recognizerRef.current.recognizing) {
            recognizer.start(); // Reinicia se ocorrer o erro "no-speech" e não estiver ativo
          }
        } else {
          stopRecognition();
        }
      };

      const stopRecognition = () => {
        if (recognizerRef.current) {
          recognizerRef.current.stop();
          recognizerRef.current = null;
        }
      };

      recognizerRef.current = recognizer;
      recognizer.start();
    } catch (error) {
      console.error("Error initializing recognition:", error);
    }
  };

  // Limpar o reconhecimento de voz ao desmontar o componente
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
        recognizerRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      {vad.userSpeaking ? "Usuário está falando..." : "Aguardando fala..."}
      {isListening && <p>Reconhecimento ativo...</p>}
    </div>
  );
}
