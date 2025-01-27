// Home.jsx
import React from "react";
import Habitats from "./components/Habitats/Habitats";
import Access from "./components/Access/Access";
import Scene from "./components/Scene/Scene";
import ChatContainer from "./components/ChatContainer/ChatContainer";
import { useHabitatUser } from "../../context/HabitatUserContext";
import { FadeProvider } from "../../context/FadeContext";
import { SceneProvider } from "../../context/SceneContext";
import "./Home.scss";

export default function Home() {
  const { habitat, user, chatMember, chatGroup, chatBot } = useHabitatUser();
  const isChatActive = chatMember.id || chatGroup.id || chatBot.id;

  if (user) {
    return (
      <FadeProvider>
        <SceneProvider>
          <div className="home-container">
            <Habitats />
            {habitat.id && (
              <>
                <Access />
                <Scene
                  key={habitat.id}
                  mainFileUrl={habitat.mainFileUrl}
                  mobileFileUrl={habitat.mobileFileUrl}
                  fade={habitat.fade}
                  address={habitat.address}
                />
                {isChatActive && <ChatContainer />}
              </>
            )}
          </div>
        </SceneProvider>
      </FadeProvider>
    );
  } else {
    return (
      <div className="home">
        {/* Tela para usuário não autenticado */}
      </div>
    );
  }
}
