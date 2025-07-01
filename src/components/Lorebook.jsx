// src/components/Lorebook.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Define the lore categories
const CATEGORIES = [
  { key: "locations",  label: "Locations"  },
  { key: "characters", label: "Characters" },
  { key: "events",     label: "Events"     },
  { key: "npcs",       label: "NPCs"       },
  { key: "factions",   label: "Factions"   },
];

// Initialize each category with an empty array
const INITIAL_ENTRIES = CATEGORIES.reduce((acc, { key }) => {
  acc[key] = [];
  return acc;
}, {});

export default function Lorebook() {
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [filter, setFilter]   = useState("");

  // Fetch and group lore entries from all sessions
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "sessions"));
      const grouped = { ...INITIAL_ENTRIES };

      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        CATEGORIES.forEach(({ key }) => {
          ;(data[key] || []).forEach(item => {
            const label   = item.name || item.title;
            const content = item.description || item.summary || "";
            if (label) {
              grouped[key].push({
                id:      `${key}-${label}-${docSnap.id}`,
                label,
                content,
                date:    data.createdAt?.toDate(),
              });
            }
          });
        });
      });

      // Sort each category newest → oldest
      CATEGORIES.forEach(({ key }) => {
        grouped[key].sort((a, b) => b.date - a.date);
      });

      setEntries(grouped);
    })();
  }, []);

  // Safely filter an array by label/content
  const filterGroup = arr =>
    Array.isArray(arr)
      ? arr.filter(e =>
          e.label.toLowerCase().includes(filter.toLowerCase()) ||
          e.content.toLowerCase().includes(filter.toLowerCase())
        )
      : [];

  // Total count of all filtered entries
  const totalCount = Object.values(entries).reduce(
    (sum, arr) => sum + filterGroup(arr).length,
    0
  );

  return (
    <div>
      {/* Section header */}
      <h2
        style={{
          color: "var(--accent)",
          fontFamily: "Uncial Antiqua, serif",
          marginBottom: "1rem"
        }}
      >
        Lorebook
      </h2>

      {/* Global search input */}
      <input
        className="input"
        type="text"
        placeholder="Search all lore…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />

      {/* No results placeholder */}
      {totalCount === 0 && (
        <p className="placeholder">No lore entries found.</p>
      )}

      {/* Render each non-empty category */}
      {CATEGORIES.map(({ key, label }) => {
        const group = filterGroup(entries[key]);
        if (group.length === 0) return null;

        return (
          <div key={key} className="lore-group">
            <h3>{label}</h3>
            {group.map(item => (
              <div key={item.id} className="lore-card">
                <strong>{item.label}</strong>
                <p style={{ margin: "0.5rem 0" }}>{item.content}</p>
                <div className="timestamp">
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
