import React from "react";
import { ClipLoader } from "react-spinners";
import "../styles/LoadingScreen.scss";

export default function LoadingScreen({ progress }) {
    return (
        <div className="loading-screen">
            <div className="loader-container">
                <div className="loader-wrapper">
                    <ClipLoader color="#fff" size={80} />
                    <span className="progress-count">{progress}%</span>
                </div>
                <div className="progress-bar">
                    <div className="progress" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
}