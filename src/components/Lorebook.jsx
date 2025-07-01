// src/components/Lorebook.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function Lorebook() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter]   = useState("");

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "sessions"));
      const all = [];
      snap.docs.forEach(doc => {
        const data = doc.data();
        ["events","locations","characters","npcs","factions"].forEach(key => {
          if (Array.isArray(data[key])) {
            data[key].forEach(item => {
              all.push({ category: key, ...item, sessionId: doc.id });
            });
          }
        });
      });
      setEntries(all);
    })();
  }, []);

  const filtered = entries.filter(e =>
    e.name?.toLowerCase().includes(filter.toLowerCase()) ||
    e.title?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="mt-8 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Lorebook</h2>
      <input
        type="text"
        placeholder="Search..."
        className="mb-4 p-2 border rounded w-full"
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((e, i) => (
          <div key={i} className="p-3 bg-white shadow rounded">
            <p className="text-sm text-gray-500 uppercase">{e.category}</p>
            <h3 className="font-medium">
              {e.title || e.name}
            </h3>
            <p className="text-gray-700 text-sm">
              {e.summary || e.description || e.role || e.goals}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
