// src/components/AudioUploader.jsx
import React, { useState } from "react";
import {
  ref, uploadBytesResumable, getDownloadURL
} from "firebase/storage";
import {
  collection, addDoc, serverTimestamp
} from "firebase/firestore";
import { storage, db } from "../firebase";

export default function AudioUploader() {
  const [file, setFile]       = useState(null);
  const [title, setTitle]     = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError]     = useState("");

  const handleUpload = () => {
    if (!file || !title.trim()) {
      setError("Please choose a file AND enter a session title.");
      return;
    }
    setError("");
    const storageRef = ref(storage, `sessions/${Date.now()}_${file.name}`);
    const task       = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      snap => setProgress(Math.round((snap.bytesTransferred/snap.totalBytes)*100)),
      err => setError(err.message),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await addDoc(collection(db, "sessions"), {
          title:           title.trim(),
          audioURL:        url,
          createdAt:       serverTimestamp(),
          originalFileName:file.name,
        });
        setFile(null);
        setTitle("");
        setProgress(0);
      }
    );
  };

  return (
    <div>
      <input
        className="input"
        type="text"
        placeholder="Session Title (e.g. Session 5)"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <input
        className="input"
        type="file"
        accept="audio/*"
        onChange={e => setFile(e.target.files[0])}
      />
      <button className="button" onClick={handleUpload} disabled={!file}>
        Upload & Create Session
      </button>
      {progress > 0 && <p>Uploading: {progress}%</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
