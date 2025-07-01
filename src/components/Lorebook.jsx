// src/components/Lorebook.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const CATEGORIES = [
  { key: "locations", label: "Locations" },
  { key: "characters", label: "Characters" },
  { key: "events",     label: "Events" },
  { key: "npcs",       label: "NPCs" },
  { key: "factions",   label: "Factions" },
];

// Build an initial empty object: { locations: [], characters: [], ... }
const INITIAL_ENTRIES = CATEGORIES.reduce((acc, { key }) => {
  acc[key] = [];
  return acc;
}, {});

export default function Lorebook() {
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [filter, setFilter]   = useState("");

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "sessions"));
      const grouped = CATEGORIES.reduce((acc, { key }) => {
        acc[key] = [];
        return acc;
      }, {});

      snap.docs.forEach(doc => {
        const data = doc.data();
        CATEGORIES.forEach(({ key }) => {
          (data[key] || []).forEach(item => {
            const label = item.name || item.title;
            const content = item.description || item.summary || "";
            if (label) {
              grouped[key].push({
                id:      `${key}-${label}-${doc.id}`,
                label,
                content,
                date:    data.createdAt?.toDate(),
              });
            }
          });
        });
      });

      // Sort each group newest → oldest
      CATEGORIES.forEach(({ key }) => {
        grouped[key].sort((a, b) => b.date - a.date);
      });

      setEntries(grouped);
    })();
  }, []);

  // Only filter on real arrays
  const filterGroup = (arr) =>
    Array.isArray(arr)
      ? arr.filter(
          e =>
            e.label.toLowerCase().includes(filter.toLowerCase()) ||
            e.content.toLowerCase().includes(filter.toLowerCase())
        )
      : [];

  // Total count across all categories
  const totalCount = Object.values(entries).reduce(
    (sum, arr) => sum + filterGroup(arr).length,
    0
  );

  return (
    <div>
      <h2>Lorebook</h2>
      <input
        type="text"
        placeholder="Search all lore…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{
          padding: "0.5rem",
          width: "100%",
          margin: "1rem 0",
          border: "1px solid #806632",
          borderRadius: "0.25rem",
        }}
      />

      {totalCount === 0 && (
        <p className="placeholder">No lore entries found.</p>
      )}

      {CATEGORIES.map(({ key, label }) => {
        const group = filterGroup(entries[key]);
        if (group.length === 0) return null;
        return (
          <div key={key} className="lore-group">
            <h3>{label}</h3>
            {group.map(item => (
              <div key={item.id} className="lore-card">
                <strong>{item.label}</strong>
                <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                  {item.content}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#826F5A",
                    marginTop: "0.5rem",
                  }}
                >
                  {item.date?.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
