import React from "react";
import MiniMap from "../MiniMap/MiniMap";
import SetupScene from "./SetupScene/SetupScene";
import FadeEffect from "./FadeEffect/FadeEffect";
import Model from "./Model/Model";
import AdvancedScene from "./AdvancedScene/AdvancedScene";  // Importando o novo componente
import "./Scene.scss";

export default function Scene({ habitatId, mainFileUrl, mobileFileUrl, fade = "", address }) {
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [modelUrl, setModelUrl] = useState("");
  
  const containerRef = useRef();
  const [components, setComponents] = useState(null);
  const [world, setWorld] = useState(null);
  const [camera, setCamera] = useState(null);
  const [arrayName, setArrayName] = useState([]);

  useEffect(() => {
    if (mainFileUrl || mobileFileUrl) {
      const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
      const selectedUrl = isMobileDevice ? mobileFileUrl : mainFileUrl;
      setModelUrl(selectedUrl);
      setIsValidUrl(true);
      
      const { components, world } = SetupScene(containerRef, setCamera);
      setComponents(components);
      setWorld(world);
    } else {
      setIsValidUrl(false);
    }
  }, [habitatId, mainFileUrl, mobileFileUrl]);

  useEffect(() => {
    if (camera && arrayName.length > 0) {
      FadeEffect(fade, arrayName, camera);
    }
  }, [fade, arrayName, camera]);

  return (
    <div ref={containerRef} className="scene">
      {isValidUrl && components && world && (
        <>
          <Model modelUrl={modelUrl} components={components} world={world} setArrayName={setArrayName} />
          <AdvancedScene components={components} world={world} camera={camera} />
        </>
      )}
      {address && <MiniMap address={address} />}
    </div>
  );
}
