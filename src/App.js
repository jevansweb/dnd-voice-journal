// src/App.js
import React, { useState } from "react";
import "./App.css";
import AudioUploader     from "./components/AudioUploader";
import TranscriptViewer  from "./components/TranscriptViewer";
import Lorebook          from "./components/Lorebook";
import QuestLog          from "./components/QuestLog";
import RelationshipWeb   from "./components/RelationshipWeb";

const tabs = [
  { key: "upload",       label: "Upload Audio" },
  { key: "transcripts",  label: "Transcripts" },
  { key: "lorebook",     label: "Lorebook" },
  { key: "quests",       label: "Quest Log" },
  { key: "relationships",label: "Relationships" },
];

function App() {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="app">
      <header className="header">
        <h1>D&amp;D Voice Journal</h1>
      </header>

      <nav className="tabs">
        {tabs.map(tab => (
          <div
            key={tab.key}
            className={`tab${activeTab === tab.key ? " active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </nav>

      <main className="main">
        {activeTab === "upload"       && <AudioUploader />}
        {activeTab === "transcripts"  && <TranscriptViewer />}
        {activeTab === "lorebook"     && <Lorebook />}
        {activeTab === "quests"       && <QuestLog />}
        {activeTab === "relationships"&& <RelationshipWeb />}
      </main>
    </div>
  );
}

export default App;
