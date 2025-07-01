import React, { useEffect, useState, useMemo } from "react";
import ReactFlow, { Background, Controls } from "react-flow-renderer";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Define static nodeTypes and edgeTypes outside the component
const nodeTypes = {};
const edgeTypes = {};

export default function RelationshipWeb() {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "sessions"));
      const nodes = {};
      const edges = [];

      snap.docs.forEach((doc) => {
        const data = doc.data();
        (data.relationships || []).forEach((rel) => {
          const { source, target, type } = rel;
          // Ensure nodes exist
          [source, target].forEach((name) => {
            if (!nodes[name]) {
              nodes[name] = {
                id: name,
                data: { label: name },
                position: {
                  x: Math.random() * 800,
                  y: Math.random() * 600,
                },
              };
            }
          });
          edges.push({
            id: `${source}-${target}`,
            source,
            target,
            label: type,
            animated: true,
          });
        });
      });

      setElements([...Object.values(nodes), ...edges]);
    })();
  }, []);

  // Memoize nodeTypes and edgeTypes to avoid recreating them each render
  const memoNodeTypes = useMemo(() => nodeTypes, []);
  const memoEdgeTypes = useMemo(() => edgeTypes, []);

  return (
    <div
      style={{ width: "100%", height: "400px" }}
      className="mt-8 bg-white shadow rounded"
    >
      <ReactFlow
        elements={elements}
        nodeTypes={memoNodeTypes}
        edgeTypes={memoEdgeTypes}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
