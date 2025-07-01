// src/components/AudioUploader.jsx
import React, { useState } from "react";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";
import {
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { storage, db } from "../firebase";

export default function AudioUploader({ onUploaded }) {
  const [file, setFile]         = useState(null);
  const [title, setTitle]       = useState("");
  const [uploadPct, setUploadPct] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState("");

  const handleUpload = () => {
    if (!file || !title.trim()) {
      setError("Select a file and enter a session title.");
      return;
    }
    setError("");
    setUploading(true);
    const storageRef = ref(storage, `sessions/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      snapshot => {
        const pct = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setUploadPct(pct);
      },
      err => {
        setError(err.message);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        const docRef = await addDoc(collection(db, "sessions"), {
          title:           title.trim(),
          audioURL:        url,
          createdAt:       serverTimestamp(),
          originalFileName:file.name,
        });
        setFile(null);
        setTitle("");
        setUploading(false);
        setUploadPct(0);
        if (onUploaded) onUploaded(docRef.id);
      }
    );
  };

  return (
    <div style={{ marginBottom: "2rem" }}>
      <input
        className="input"
        type="text"
        placeholder="Session Title (e.g. Session 5)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={uploading}
      />
      <input
        className="input"
        type="file"
        accept="audio/*"
        onChange={e => setFile(e.target.files[0])}
        disabled={uploading}
      />
      <button
        className="button"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : "Upload & Create Session"}
      </button>
      {uploading && (
        <div style={{ marginTop: "1rem" }}>
          <div
            style={{
              height: "10px",
              background: "#ddd",
              borderRadius: "5px",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${uploadPct}%`,
                height: "100%",
                background: "var(--accent)"
              }}
            />
          </div>
          <p style={{ fontSize: "0.85rem", color: "#999" }}>
            {uploadPct}% complete
          </p>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
