import React from "react";
import { ScaleLoader } from "react-spinners";

export default function LoadingScreen() {
    return (
        <div className="loading">
            <ScaleLoader color="#fff" size={20} />
        </div>
    );
}