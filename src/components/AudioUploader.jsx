// src/components/AudioUploader.jsx
import React, { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from "../firebase";

export default function AudioUploader() {
  const [file, setFile]               = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState("");
  const [error, setError]             = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setDownloadURL("");
    setUploadProgress(0);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `sessions/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(percent));
        },
        (err) => {
          setError(`Upload failed: ${err.message}`);
        },
        async () => {
          // 2. Get download URL
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setDownloadURL(url);

          // 3. Create Firestore session doc
          const docRef = await addDoc(collection(db, "sessions"), {
            audioURL: url,
            createdAt: serverTimestamp(),
            originalFileName: file.name,
          });

          console.log("Session created with ID:", docRef.id);
        }
      );
    } catch (e) {
      setError(`Error: ${e.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-white shadow-sm max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">Upload Session Audio</h2>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="mb-2"
      />
      <button
        onClick={handleUpload}
        disabled={!file}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Upload & Create Session
      </button>

      {uploadProgress > 0 && (
        <p className="mt-2">Uploading: {uploadProgress}%</p>
      )}

      {downloadURL && (
        <div className="mt-2">
          <p>Upload complete!</p>
          <a
            href={downloadURL}
            target="_blank"
            rel="noreferrer"
            className="underline text-blue-600"
          >
            Listen to Audio
          </a>
        </div>
      )}

      {error && (
        <p className="mt-2 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
