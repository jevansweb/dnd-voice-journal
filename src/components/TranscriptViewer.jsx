// src/components/TranscriptViewer.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";

export default function TranscriptViewer() {
  const [sessions, setSessions]           = useState([]);
  const [expandedIds, setExpandedIds]     = useState(new Set());
  const [editingId, setEditingId]         = useState(null);
  const [newTitle, setNewTitle]           = useState("");
  const [summaryLoadingIds, setSummaryLoadingIds] = useState(new Set());

  // Subscribe to sessions
  useEffect(() => {
    const q = query(
      collection(db, "sessions"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const toggleTranscript = id => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const generateSummary = async sessionId => {
    // show progress bar
    setSummaryLoadingIds(prev => new Set(prev).add(sessionId));
    const fn = httpsCallable(functions, "generateSummary");
    try {
      await fn({ sessionId });
    } finally {
      // hide progress bar once function returns
      setSummaryLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const deleteSession = async sessionId => {
    if (window.confirm("Delete this session and all its data?")) {
      await deleteDoc(doc(db, "sessions", sessionId));
    }
  };

  const toSentenceCase = (str = "") =>
    str
      .toLowerCase()
      .replace(/(^\w|\.\s*\w)/g, c => c.toUpperCase());

  return (
    <div>
      <h2 style={{ color: "var(--accent)", fontFamily: "Uncial Antiqua, serif" }}>
        Sessions
      </h2>
      {sessions.map(s => (
        <div key={s.id} className="session-card">
          {/* Title & Icons */}
          <div className="session-header">
            {editingId === s.id ? (
              <input
                className="title-input"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onBlur={async () => {
                  const title = newTitle.trim();
                  if (title) {
                    await updateDoc(doc(db, "sessions", s.id), { title });
                  }
                  setEditingId(null);
                }}
                onKeyDown={e => e.key === "Enter" && e.target.blur()}
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
                <span
                  className="delete-icon"
                  title="Delete session"
                  onClick={() => deleteSession(s.id)}
                >
                  🗑️
                </span>
              </>
            )}
          </div>

          {/* Timestamp */}
          <div className="timestamp">
            {s.createdAt?.toDate().toLocaleString()}
          </div>

          {/* If summary exists */}
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
            summaryLoadingIds.has(s.id) ? (
              // Indeterminate bar for summary generation
              <div style={{ marginTop: "1rem" }}>
                <p className="placeholder">Generating summary…</p>
                <div
                  style={{
                    height: "6px",
                    background: "#ddd",
                    borderRadius: "3px",
                    overflow: "hidden",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "30%",
                      height: "100%",
                      background: "var(--accent)",
                      animation: "indeterminate 1.5s infinite",
                    }}
                  />
                </div>
              </div>
            ) : (
              <button
                className="button"
                onClick={() => generateSummary(s.id)}
              >
                Generate Summary & Extract
              </button>
            )
          ) : (
            // transcription in progress
            <div style={{ marginTop: "1rem" }}>
              <p className="placeholder">Transcribing…</p>
              <div
                style={{
                  height: "6px",
                  background: "#ddd",
                  borderRadius: "3px",
                  overflow: "hidden",
                  marginTop: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "30%",
                    height: "100%",
                    background: "var(--accent)",
                    animation: "indeterminate 1.5s infinite",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
