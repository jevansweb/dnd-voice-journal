// src/components/TranscriptViewer.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";

export default function TranscriptViewer() {
  const [sessions, setSessions]       = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    const q = query(
      collection(db, "sessions"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const toggleTranscript = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleGenerate = async (sessionId) => {
    const fn = httpsCallable(functions, "generateSummary");
    await fn({ sessionId });
  };

  // Helper: sentence-case a string
  const toSentenceCase = (str) =>
    str
      .toLowerCase()
      .replace(/(^\w|\.\s*\w)/g, c => c.toUpperCase());

  return (
    <div>
      <h2>Session Transcripts</h2>
      {sessions.map(s => (
        <div key={s.id} className="mb-6">
          <p className="text-sm text-gray-500 mb-2">
            {s.createdAt?.toDate().toLocaleString()}
          </p>

          {s.transcriptionError && (
            <p className="text-red-600">Error: {s.transcriptionError}</p>
          )}

          {s.summary ? (
            <div>
              <p>{toSentenceCase(s.summary)}</p>
              <button
                onClick={() => toggleTranscript(s.id)}
                className="px-3 py-1 mt-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {expandedIds.has(s.id) ? "Hide Transcript" : "Show Transcript"}
              </button>
              {expandedIds.has(s.id) && (
                <pre className="transcript">{s.transcript}</pre>
              )}
            </div>
          ) : s.transcript ? (
            <button
              onClick={() => handleGenerate(s.id)}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Generate Summary & Extract
            </button>
          ) : (
            <p className="italic">Transcribing…</p>
          )}
        </div>
      ))}
    </div>
  );
}
