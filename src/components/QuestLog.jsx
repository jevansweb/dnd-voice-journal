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
        const data = doc.data();
        if (Array.isArray(data.quests)) {
          data.quests.forEach(q => {
            all.push({ sessionId: doc.id, ...q });
          });
        }
      });
      setQuests(all);
    })();
  }, []);

  return (
    <div className="mt-8 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Quest Log</h2>
      {quests.map((q, i) => (
        <div key={i} className="mb-4 p-4 bg-white shadow rounded">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{q.title}</h3>
            <span
              className={`px-2 py-1 text-xs rounded ${
                q.status === "Active" ? "bg-green-200" :
                q.status === "Complete" ? "bg-blue-200" :
                "bg-red-200"
              }`}
            >
              {q.status}
            </span>
          </div>
          <p className="mt-1 text-gray-700">{q.description}</p>
          <p className="mt-2 text-sm text-gray-600">
            Objectives: {q.objectives?.join(", ")}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Participants: {q.participants?.join(", ")}
          </p>
        </div>
      ))}
    </div>
  );
}
