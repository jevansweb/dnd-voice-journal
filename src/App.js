// src/App.js
import React from "react";
import "./App.css";
import AudioUploader from "./components/AudioUploader";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">D&D Voice Journal</h1>
      <AudioUploader />
    </div>
  );
}

export default App;
