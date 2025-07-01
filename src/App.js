// src/App.js
import React from "react";
import "./App.css";
import AudioUploader from "./components/AudioUploader";
import TranscriptViewer from "./components/TranscriptViewer";
import Lorebook         from "./components/Lorebook";
import QuestLog         from "./components/QuestLog";
import RelationshipWeb  from "./components/RelationshipWeb";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">D&D Voice Journal</h1>
      <AudioUploader />
      <TranscriptViewer />
      <Lorebook />
      <QuestLog />
      <RelationshipWeb />
    </div>
  );
}

export default App;
