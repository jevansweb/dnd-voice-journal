// src/components/RelationshipWeb.jsx
import React, { useEffect, useState } from "react";
import ReactFlow, { Background, Controls } from "react-flow-renderer";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function RelationshipWeb() {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "sessions"));
      const nodes = {};
      const edges = [];

      snap.docs.forEach(doc => {
        (doc.data().relationships || []).forEach(rel => {
          const { source, target, type } = rel;
          [source, target].forEach(name => {
            if (!nodes[name]) {
              nodes[name] = {
                id: name,
                data: { label: name },
                position: { x: Math.random()*600, y: Math.random()*400 }
              };
            }
          });
          edges.push({ id:`${source}-${target}`, source, target, label:type, animated:true });
        });
      });

      setElements([...Object.values(nodes), ...edges]);
    })();
  }, []);

  if (elements.length === 0) {
    return <p className="placeholder">No relationships to display.</p>;
  }

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <ReactFlow elements={elements}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
