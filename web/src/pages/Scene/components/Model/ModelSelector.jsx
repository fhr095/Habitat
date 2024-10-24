// ModelSelector.jsx
import React, { useContext } from "react";
import { ModelContext } from "../../../../context/ModelContext";

export default function ModelSelector() {
  const { currentModel, setCurrentModel } = useContext(ModelContext);

  return (
    <div className="model-selector">
      <button onClick={() => setCurrentModel("model1")}>Modelo 1</button>
      <button onClick={() => setCurrentModel("model2")}>Modelo 2</button>
      <button onClick={() => setCurrentModel("both")}>Ambos os Modelos</button>
    </div>
  );
}
