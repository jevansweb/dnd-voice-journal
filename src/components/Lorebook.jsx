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
          (data[key] || []).forEach(item => {
            all.push({
              category: key,
              ...item,
              sessionTimestamp: data.createdAt
            });
          });
        });
      });

      // sort newest → oldest
      all.sort((a,b) =>
        b.sessionTimestamp?.toDate() - a.sessionTimestamp?.toDate()
      );

      setEntries(all);
    })();
  }, []);

  const filtered = entries.filter(e => 
    (e.name || e.title || "")
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  return (
    <div>
      <h2>Lorebook</h2>
      <input
        type="text"
        placeholder="Search..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="mb-4 p-2 w-full"
      />

      {filtered.length === 0 && (
        <p className="placeholder">No entries match your search.</p>
      )}

      {filtered.map((e,i) => (
        <div key={i} className="lore-card">
          <p className="text-xs italic">
            {e.category} • {e.sessionTimestamp?.toDate().toLocaleDateString()}
          </p>
          <h3 className="font-semibold">{e.title || e.name}</h3>
          <p>{e.summary || e.description || e.role || e.goals}</p>
        </div>
      ))}
    </div>
  );
}
