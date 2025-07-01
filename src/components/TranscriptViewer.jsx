// src/components/TranscriptViewer.jsx
import React, { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";

export default function TranscriptViewer() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "sessions"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setSessions(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      );
    });
    return () => unsub();
  }, []);

  const handleGenerate = async (sessionId) => {
    const fn = httpsCallable(functions, "generateSummary");
    try {
      // disable button by marking summaryLoading
      setSessions(prev => prev.map(s => (
        s.id === sessionId ? { ...s, summaryLoading: true } : s
      )));
      await fn({ sessionId });
      // the Cloud Function will write summary & structured data back
    } catch (err) {
      console.error("Summary generation failed:", err);
    } finally {
      setSessions(prev => prev.map(s => (
        s.id === sessionId ? { ...s, summaryLoading: false } : s
      )));
    }
  };

  return (
    <div className="mt-8 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Session Transcripts</h2>
      {sessions.map(s => (
        <div 
          key={s.id} 
          className="mb-6 p-4 bg-white shadow rounded"
        >
          <p className="text-sm text-gray-500 mb-2">
            Session ID: {s.id} •{" "}
            {s.createdAt?.toDate().toLocaleString()}
          </p>

          {!s.transcript && !s.transcriptionError && (
            <p className="italic text-gray-600">Transcribing…</p>
          )}
          {s.transcriptionError && (
            <p className="text-red-600">
              Error: {s.transcriptionError}
            </p>
          )}
          {s.transcript && (
            <pre className="whitespace-pre-wrap text-gray-800 mb-4">
              {s.transcript}
            </pre>
          )}

          {s.transcript && !s.summary && (
            <button
              onClick={() => handleGenerate(s.id)}
              disabled={s.summaryLoading}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {s.summaryLoading ? "Generating…" : "Generate Summary & Extract"}
            </button>
          )}

          {s.summary && (
            <>
              <h3 className="font-medium mt-4">Summary</h3>
              <p className="text-gray-800 mb-2">{s.summary}</p>
              {/* Later: render s.events, s.locations, etc. */}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
