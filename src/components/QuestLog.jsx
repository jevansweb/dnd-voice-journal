// src/components/QuestLog.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function QuestLog() {
  const [quests, setQuests] = useState([]);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "sessions"));
      const all = [];
      snap.docs.forEach(doc => {
        (doc.data().quests || []).forEach(q => {
          all.push(q);
        });
      });
      setQuests(all);
    })();
  }, []);

  if (quests.length === 0) {
    return <p className="placeholder">No quests found.</p>;
  }

  return (
    <div>
      <h2>Quest Log</h2>
      {quests.map((q,i) => (
        <div key={i} className="mb-4 p-4 bg-white rounded shadow">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{q.title}</h3>
            <span className={`px-2 py-1 text-xs rounded ${
              q.status === "Active"   ? "bg-green-200" :
              q.status === "Complete" ? "bg-blue-200" :
                                        "bg-red-200"
            }`}>
              {q.status}
            </span>
          </div>
          <p className="mt-1">{q.description}</p>
          <p className="text-sm mt-2"><strong>Objectives:</strong> {q.objectives?.join(", ")}</p>
          <p className="text-sm"><strong>Participants:</strong> {q.participants?.join(", ")}</p>
        </div>
      ))}
    </div>
  );
}
