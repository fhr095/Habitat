import React from "react";
import VoiceButton from "./VoiceButton";

import { GoHomeFill } from "react-icons/go";

import "./Buttons.scss";

export default function Buttons({ setTranscript }) {
    return (
        <div className="buttons-container">
            <button className="home-button">
                <GoHomeFill size={20} color="white"/>
            </button>
            <VoiceButton setTranscript={setTranscript} />
        </div>
    );
}
