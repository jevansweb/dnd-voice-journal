// src/components/TranscriptViewer.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";

export default function TranscriptViewer() {
  const [sessions, setSessions]       = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editingId, setEditingId]     = useState(null);
  const [newTitle, setNewTitle]       = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "sessions"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap =>
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const toggleTranscript = id => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const generateSummary = async sessionId => {
    const fn = httpsCallable(functions, "generateSummary");
    await fn({ sessionId });
  };

  const toSentenceCase = str =>
    str
      .toLowerCase()
      .replace(/(^\w|\.\s*\w)/g, c => c.toUpperCase());

  return (
    <div>
      <h2 style={{ color: "var(--accent)", fontFamily: "Merriweather, serif" }}>
        Sessions
      </h2>
      {sessions.map(s => (
        <div key={s.id} style={{ marginBottom: "2rem" }}>
          {/* Title + Edit */}
          <div className="session-header">
            {editingId === s.id ? (
              <input
                className="title-input"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onBlur={async () => {
                  if (newTitle.trim()) {
                    await updateDoc(doc(db, "sessions", s.id), {
                      title: newTitle.trim()
                    });
                  }
                  setEditingId(null);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") e.target.blur();
                }}
                autoFocus
              />
            ) : (
              <>
                <span className="session-title">
                  {s.title || "Untitled Session"}
                </span>
                <span
                  className="edit-icon"
                  title="Edit session title"
                  onClick={() => {
                    setEditingId(s.id);
                    setNewTitle(s.title || "");
                  }}
                >
                  ✎
                </span>
              </>
            )}
          </div>

          {/* Timestamp */}
          <div style={{ fontSize: "0.85rem", color: "var(--placeholder)" }}>
            {s.createdAt?.toDate().toLocaleString()}
          </div>

          {/* Summary / Generate */}
          {s.summary ? (
            <>
              <p style={{ marginTop: "1rem" }}>
                {toSentenceCase(s.summary)}
              </p>
              <button
                className="button"
                onClick={() => toggleTranscript(s.id)}
              >
                {expandedIds.has(s.id) ? "Hide Transcript" : "Show Transcript"}
              </button>
              {expandedIds.has(s.id) && (
                <pre className="transcript">{s.transcript}</pre>
              )}
            </>
          ) : s.transcript ? (
            <button
              className="button"
              onClick={() => generateSummary(s.id)}
            >
              Generate Summary & Extract
            </button>
          ) : (
            <p className="placeholder">Transcribing…</p>
          )}
        </div>
      ))}
    </div>
  );
}
